import { METRO_LINES, ODPT_API_URL } from '../constants';
import { GroupedStation } from '../types';
import { getAllGroupedStations, getLineStations } from './odptService';

const getApiKey = () => {
    return process.env.ODPT_API_KEY ||
        process.env.VITE_ODPT_API_KEY ||
        process.env.REACT_APP_ODPT_API_KEY ||
        '';
};

// Map<FromStationId, Map<ToStationId, Minutes>>
const timeMap = new Map<string, Map<string, number>>();
// Map<StationName, StationId[]>
const nameToIdsMap = new Map<string, string[]>();
// Map<StationId, LineId>
const idToLineMap = new Map<string, string>();
// Map<StationId, StationName>
const idToNameMap = new Map<string, string>();

let isInitialized = false;

// 乗り換え時間（分）
const TRANSFER_TIME_MINUTES = 5;

/**
 * ネットワーク情報の初期化
 * 全路線の時刻表を取得し、駅間時間を構築する
 */
export const initializeNetwork = async (): Promise<void> => {
    if (isInitialized) return;

    // console.log('Initializing network...');
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error('API Key Missing');
        return;
    }

    // 1. 駅グルーピング情報の構築
    const groupedStations = await getAllGroupedStations();
    groupedStations.forEach(group => {
        const ids = group.stations.map(s => s.id);
        nameToIdsMap.set(group.name, ids);
        group.stations.forEach(s => {
            idToLineMap.set(s.id, s.lineId);
            idToNameMap.set(s.id, group.name);
        });
    });

    // 2. 静的な駅順序に基づくエッジの構築（フォールバック）
    // 時刻表APIが失敗しても最低限の検索ができるようにする
    for (const line of METRO_LINES) {
        const data = await getLineStations(line);
        if (data.isFallback || data.stations.length < 2) continue;

        for (let i = 0; i < data.stations.length - 1; i++) {
            const from = data.stations[i].id;
            const to = data.stations[i + 1].id;
            // デフォルト2分
            setEdgeWeight(from, to, 2);
            setEdgeWeight(to, from, 2);
        }
    }

    // 3. 時刻表データの取得とTimeMap更新（あれば詳細な時間で上書き）
    // 3. 時刻表データの取得とTimeMap更新（あれば詳細な時間で上書き）
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const line of METRO_LINES) {
        // APIレート制限回避のため待機
        await delay(200);

        try {
            // 平日の代表的な列車時刻表を取得（方向は問わないが、両方向あるとベター。ここでは各路線の全列車時刻表APIを叩くか、または代表的なTrainTimetableを取得する）
            // odpt:TrainTimetable はデータ量が多すぎるため、路線ごとにフィルタしますが、それでも多いです。
            // 戦略: odpt:TrainTimetable?odpt:railway={lineId}&odpt:calendar=odpt.Calendar:Weekday
            // 全列車のデータを取得し、隣接駅間の平均を算出します。
            // ※ データ量削減のため、12時台の列車に絞るなどの工夫が必要か？ APIのフィルタでは時間指定は難しい。
            // 全件取得のリスクがあるため、limitを設定するか？ ODPT APIはデフォルトで全件返すが...
            // とりあえず全件取得してみます。重ければ調整。

            const url = `${ODPT_API_URL}/odpt:TrainTimetable?odpt:railway=${line.id}&odpt:calendar=odpt.Calendar:Weekday&acl:consumerKey=${apiKey}`;
            const res = await fetch(url);

            if (res.status === 429) {
                console.warn(`Rate limit exceeded for ${line.name}, skipping`);
                continue;
            }

            if (!res.ok) continue;

            const timetables = await res.json();
            if (!timetables || timetables.length === 0) continue;

            // 最初の数本の列車（各方向）を使って計算すれば十分
            // 各列車の `odpt:station` リストを見て、隣接駅間の差分を取る
            let trainCount = 0;
            const MAX_TRAINS_TO_ANALYZE = 20; // 計算量削減のため解析する列車数を制限

            for (const train of timetables) {
                if (trainCount >= MAX_TRAINS_TO_ANALYZE) break;

                const stops = train['odpt:trainTimetableObject'];
                if (!stops || stops.length < 2) continue;

                trainCount++;

                for (let i = 0; i < stops.length - 1; i++) {
                    const from = stops[i];
                    const to = stops[i + 1];

                    if (!from['odpt:departureTime'] || !to['odpt:arrivalTime']) continue;

                    // 時間差分計算
                    const dep = parseTime(from['odpt:departureTime']);
                    const arr = parseTime(to['odpt:arrivalTime']);
                    let diff = arr - dep;
                    if (diff < 0) diff += 24 * 60; // 日またぎ

                    if (diff > 0 && diff < 60) { // 異常値除外
                        setEdgeWeight(from['odpt:station'], to['odpt:station'], diff);
                        // 逆方向も同じと仮定（データ不足時の補完）
                        setEdgeWeight(to['odpt:station'], from['odpt:station'], diff);
                    }
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch timetable for ${line.name}`, e);
        }
    }
    isInitialized = true;
    // console.log('Network initialized');
};

const setEdgeWeight = (fromId: string, toId: string, minutes: number) => {
    if (!timeMap.has(fromId)) {
        timeMap.set(fromId, new Map());
    }
    const fromMap = timeMap.get(fromId)!;
    // シンプルに上書き（最初の有効な値を使う）でも十分精度は高い
    if (!fromMap.has(toId)) {
        fromMap.set(toId, minutes);
    }
};

const parseTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

export interface RouteResult {
    stationId: string;
    totalTime: number;
    transfers: number;
    lines: string[]; // 使用路線ID
    routeText: string;
    sourceStationId?: string;
}

/**
 * ターゲット駅名への全駅からの探索（目的地への到達時間を計算）
 * maxTransfers: 最大乗り換え回数（デフォルト: 1）
 */
export const findRoutesToDestination = (destinationName: string, maxTransfers: number = 1): Map<string, RouteResult> => {
    if (!isInitialized) {
        console.warn('Network not initialized');
        return new Map();
    }

    const destinationIds = nameToIdsMap.get(destinationName);
    if (!destinationIds || destinationIds.length === 0) return new Map();

    const results = new Map<string, RouteResult>(); // key: stationId

    // BFS用のキュー: { currentId, totalTime, transfers, lines, path }
    const queue: { id: string; time: number; transfers: number; lines: string[]; path: string[] }[] = [];

    // 初期化：目的地駅群をキューに入れる
    destinationIds.forEach(id => {
        queue.push({
            id,
            time: 0,
            transfers: 0,
            lines: [idToLineMap.get(id) || ''],
            path: [id]
        });
        results.set(id, {
            stationId: id,
            totalTime: 0,
            transfers: 0,
            lines: [idToLineMap.get(id) || ''],
            routeText: '目的地'
        });
    });

    const visited = new Map<string, number>();

    while (queue.length > 0) {
        queue.sort((a, b) => a.time - b.time);
        const current = queue.shift()!;

        if (visited.has(current.id) && visited.get(current.id)! <= current.time) continue;
        visited.set(current.id, current.time);

        // Update result for this station if it's the best time found so far
        if (!results.has(current.id) || results.get(current.id)!.totalTime > current.time) {
            results.set(current.id, {
                stationId: current.id,
                totalTime: current.time,
                transfers: current.transfers,
                lines: current.lines,
                routeText: '',
                sourceStationId: current.path[0]
            });
        }

        if (current.transfers > maxTransfers) continue;

        // 1. Same line neighbors
        const neighbors = timeMap.get(current.id);
        if (neighbors) {
            for (const [nextId, cost] of neighbors.entries()) {
                const newTime = current.time + cost;
                // Check if nextId is on the same line (should be, based on timeMap construction)
                // But for safety, we assume edge traversal doesn't change line/transfers
                updateQueue(queue, visited, nextId, newTime, current.transfers, current.lines, [nextId, ...current.path]);
            }
        }

        // 2. Transfers (Same name stations)
        if (current.transfers < 1) {
            const stationName = idToNameMap.get(current.id);
            if (stationName) {
                const siblings = nameToIdsMap.get(stationName) || [];
                for (const siblingId of siblings) {
                    if (siblingId === current.id) continue;

                    const newTime = current.time + TRANSFER_TIME_MINUTES;
                    const newLine = idToLineMap.get(siblingId) || '';

                    // Add new line to lines list if not already present
                    const newLines = current.lines.includes(newLine) ? current.lines : [...current.lines, newLine];

                    updateQueue(queue, visited, siblingId, newTime, current.transfers + 1, newLines, [siblingId, ...current.path]);
                }
            }
        }
    }

    return results;
};

const updateQueue = (
    queue: any[],
    visited: Map<string, number>,
    id: string,
    time: number,
    transfers: number,
    lines: string[],
    path: string[]
) => {
    if (!visited.has(id) || visited.get(id)! > time) {
        queue.push({ id, time, transfers, lines, path });
    }
};

export const getStationName = (id: string): string => idToNameMap.get(id) || '';

export const isNetworkInitialized = () => isInitialized;

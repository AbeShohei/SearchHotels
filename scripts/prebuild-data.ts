/**
 * プリビルドスクリプト: ODPT APIからデータを取得してJSONファイルとして保存
 * 実行: npx tsx scripts/prebuild-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// .env.local から環境変数を読み込む
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

// 定数
const ODPT_API_URL = 'https://api.odpt.org/api/v4';
const METRO_LINES = [
    { id: 'odpt.Railway:TokyoMetro.Ginza', name: '銀座線', referenceStationId: 'odpt.Station:TokyoMetro.Ginza.Ginza', directionAsc: 'odpt.RailDirection:TokyoMetro.Shibuya', directionDesc: 'odpt.RailDirection:TokyoMetro.Asakusa' },
    { id: 'odpt.Railway:TokyoMetro.Marunouchi', name: '丸ノ内線', referenceStationId: 'odpt.Station:TokyoMetro.Marunouchi.Shinjuku', directionAsc: 'odpt.RailDirection:TokyoMetro.Ogikubo', directionDesc: 'odpt.RailDirection:TokyoMetro.Ikebukuro' },
    { id: 'odpt.Railway:TokyoMetro.Hibiya', name: '日比谷線', referenceStationId: 'odpt.Station:TokyoMetro.Hibiya.Ginza', directionAsc: 'odpt.RailDirection:TokyoMetro.NakaMeguro', directionDesc: 'odpt.RailDirection:TokyoMetro.KitaSenju' },
    { id: 'odpt.Railway:TokyoMetro.Tozai', name: '東西線', referenceStationId: 'odpt.Station:TokyoMetro.Tozai.Nihombashi', directionAsc: 'odpt.RailDirection:TokyoMetro.Nakano', directionDesc: 'odpt.RailDirection:TokyoMetro.NishiFunabashi' },
    { id: 'odpt.Railway:TokyoMetro.Chiyoda', name: '千代田線', referenceStationId: 'odpt.Station:TokyoMetro.Chiyoda.Otemachi', directionAsc: 'odpt.RailDirection:TokyoMetro.YoyogiUehara', directionDesc: 'odpt.RailDirection:TokyoMetro.Ayase' },
    { id: 'odpt.Railway:TokyoMetro.Yurakucho', name: '有楽町線', referenceStationId: 'odpt.Station:TokyoMetro.Yurakucho.Ikebukuro', directionAsc: 'odpt.RailDirection:TokyoMetro.Wakoshi', directionDesc: 'odpt.RailDirection:TokyoMetro.ShinKiba' },
    { id: 'odpt.Railway:TokyoMetro.Hanzomon', name: '半蔵門線', referenceStationId: 'odpt.Station:TokyoMetro.Hanzomon.Shibuya', directionAsc: 'odpt.RailDirection:TokyoMetro.Shibuya', directionDesc: 'odpt.RailDirection:TokyoMetro.Oshiage' },
    { id: 'odpt.Railway:TokyoMetro.Namboku', name: '南北線', referenceStationId: 'odpt.Station:TokyoMetro.Namboku.Nagatacho', directionAsc: 'odpt.RailDirection:TokyoMetro.Meguro', directionDesc: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi' },
    { id: 'odpt.Railway:TokyoMetro.Fukutoshin', name: '副都心線', referenceStationId: 'odpt.Station:TokyoMetro.Fukutoshin.Ikebukuro', directionAsc: 'odpt.RailDirection:TokyoMetro.Shibuya', directionDesc: 'odpt.RailDirection:TokyoMetro.Wakoshi' },
];

interface Station {
    id: string;
    name: string;
    romaji: string;
    kana?: string;
    lat: number;
    lng: number;
}

interface GroupedStation {
    name: string;
    romaji: string;
    kana?: string;
    stations: {
        id: string;
        lineId: string;
        lineName: string;
        lat: number;
        lng: number;
    }[];
}

interface NetworkData {
    timeMap: Record<string, Record<string, number>>;
    nameToIds: Record<string, string[]>;
    idToLine: Record<string, string>;
    idToName: Record<string, string>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getApiKey(): Promise<string> {
    // 環境変数から取得、またはコマンドライン引数から
    return process.env.ODPT_API_KEY || process.env.VITE_ODPT_API_KEY || '';
}

async function getLineStations(line: typeof METRO_LINES[0], apiKey: string): Promise<Station[]> {
    try {
        // Railway情報取得
        const railwayUrl = `${ODPT_API_URL}/odpt:Railway?owl:sameAs=${line.id}&acl:consumerKey=${apiKey}`;
        const railwayRes = await fetch(railwayUrl);
        const railwayData = await railwayRes.json();
        const railway = railwayData[0] || null;

        // 駅情報取得
        const stationsUrl = `${ODPT_API_URL}/odpt:Station?odpt:railway=${line.id}&acl:consumerKey=${apiKey}`;
        const stationsRes = await fetch(stationsUrl);
        const stationsRaw = await stationsRes.json();

        if (stationsRaw.length === 0) return [];

        // 駅順序に基づいてソート
        let orderedStations: Station[] = [];
        if (railway && railway['odpt:stationOrder']) {
            const stationMap = new Map(stationsRaw.map((s: any) => [s['owl:sameAs'], s]));
            railway['odpt:stationOrder'].forEach((item: any) => {
                const stationData = stationMap.get(item['odpt:station']) as any;
                if (stationData) {
                    orderedStations.push({
                        id: stationData['owl:sameAs'],
                        name: stationData['odpt:stationTitle']?.ja || stationData['dc:title'],
                        romaji: stationData['odpt:stationTitle']?.en || '',
                        kana: stationData['odpt:stationTitle']?.['ja-Hrkt'],
                        lat: stationData['geo:lat'],
                        lng: stationData['geo:long'],
                    });
                }
            });
        } else {
            orderedStations = stationsRaw.map((s: any) => ({
                id: s['owl:sameAs'],
                name: s['odpt:stationTitle']?.ja || s['dc:title'],
                romaji: s['odpt:stationTitle']?.en || '',
                lat: s['geo:lat'],
                lng: s['geo:long'],
            }));
        }

        return orderedStations;
    } catch (e) {
        console.error(`${line.name} 取得エラー:`, e);
        return [];
    }
}

async function buildGroupedStations(apiKey: string): Promise<GroupedStation[]> {
    const groupedMap = new Map<string, GroupedStation>();
    const failedLines: string[] = [];

    for (const line of METRO_LINES) {
        await delay(200);
        console.log(`  ${line.name}を取得中...`);
        const stations = await getLineStations(line, apiKey);

        if (stations.length === 0) {
            console.error(`  ❌ ${line.name}: 駅データが0件 — API取得に失敗した可能性があります`);
            failedLines.push(line.name);
            continue;
        }

        console.log(`  ✅ ${line.name}: ${stations.length}駅`);

        for (const station of stations) {
            const existing = groupedMap.get(station.name);
            const stationInfo = {
                id: station.id,
                lineId: line.id,
                lineName: line.name,
                lat: station.lat,
                lng: station.lng
            };

            if (existing) {
                if (!existing.stations.some(s => s.id === station.id)) {
                    existing.stations.push(stationInfo);
                }
            } else {
                groupedMap.set(station.name, {
                    name: station.name,
                    romaji: station.romaji,
                    kana: station.kana,
                    stations: [stationInfo]
                });
            }
        }
    }

    if (failedLines.length > 0) {
        console.error(`\n🚨 以下の路線のデータ取得に失敗しました: ${failedLines.join(', ')}`);
        console.error('   既存のデータファイルを保持するため、プリビルドを中断します。');
        console.error('   ネットワーク接続やAPIキーを確認して再実行してください。\n');
        process.exit(1);
    }

    return Array.from(groupedMap.values()).sort((a, b) => a.romaji.localeCompare(b.romaji));
}

async function buildNetworkData(groupedStations: GroupedStation[], apiKey: string): Promise<NetworkData> {
    const timeMap: Record<string, Record<string, number>> = {};
    const nameToIds: Record<string, string[]> = {};
    const idToLine: Record<string, string> = {};
    const idToName: Record<string, string> = {};

    // Build mappings
    groupedStations.forEach(group => {
        nameToIds[group.name] = group.stations.map(s => s.id);
        group.stations.forEach(s => {
            idToLine[s.id] = s.lineId;
            idToName[s.id] = group.name;
        });
    });

    // Build edges from station order
    for (const line of METRO_LINES) {
        await delay(100);
        const stations = await getLineStations(line, apiKey);

        for (let i = 0; i < stations.length - 1; i++) {
            const from = stations[i].id;
            const to = stations[i + 1].id;

            if (!timeMap[from]) timeMap[from] = {};
            if (!timeMap[to]) timeMap[to] = {};

            timeMap[from][to] = 2; // デフォルト2分
            timeMap[to][from] = 2;
        }
    }

    // Fetch timetable data for more accurate times
    console.log('  時刻表データを取得中...');
    for (const line of METRO_LINES) {
        await delay(300);
        try {
            const url = `${ODPT_API_URL}/odpt:TrainTimetable?odpt:railway=${line.id}&odpt:calendar=odpt.Calendar:Weekday&acl:consumerKey=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) continue;

            const timetables = await res.json();
            if (!timetables || timetables.length === 0) continue;

            let trainCount = 0;
            const MAX_TRAINS = 20;

            for (const train of timetables) {
                if (trainCount >= MAX_TRAINS) break;
                const stops = train['odpt:trainTimetableObject'];
                if (!stops || stops.length < 2) continue;
                trainCount++;

                for (let i = 0; i < stops.length - 1; i++) {
                    const from = stops[i];
                    const to = stops[i + 1];

                    if (!from['odpt:departureTime'] || !to['odpt:arrivalTime']) continue;

                    const dep = parseTime(from['odpt:departureTime']);
                    const arr = parseTime(to['odpt:arrivalTime']);
                    let diff = arr - dep;
                    if (diff < 0) diff += 24 * 60;

                    if (diff > 0 && diff < 60) {
                        const fromId = from['odpt:station'];
                        const toId = to['odpt:station'];
                        if (!timeMap[fromId]) timeMap[fromId] = {};
                        if (!timeMap[toId]) timeMap[toId] = {};
                        timeMap[fromId][toId] = diff;
                        timeMap[toId][fromId] = diff;
                    }
                }
            }
        } catch (e) {
            console.warn(`  ${line.name}の時刻表取得失敗`);
        }
    }

    return { timeMap, nameToIds, idToLine, idToName };
}

function parseTime(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

async function main() {
    console.log('🚇 東京メトロ データプリビルド開始\n');

    const apiKey = await getApiKey();
    if (!apiKey) {
        console.error('❌ ODPT_API_KEY が設定されていません');
        console.log('環境変数 ODPT_API_KEY または VITE_ODPT_API_KEY を設定してください');
        process.exit(1);
    }

    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. 駅データ取得
    console.log('📍 駅データを取得中...');
    const groupedStations = await buildGroupedStations(apiKey);

    const stationsPath = path.join(outputDir, 'groupedStations.json');
    fs.writeFileSync(stationsPath, JSON.stringify(groupedStations, null, 2));
    console.log(`✅ 駅データ保存: ${groupedStations.length}駅\n`);

    // 2. ネットワークデータ取得
    console.log('🔗 ネットワークデータを構築中...');
    const networkData = await buildNetworkData(groupedStations, apiKey);

    const networkPath = path.join(outputDir, 'networkData.json');
    fs.writeFileSync(networkPath, JSON.stringify(networkData, null, 2));
    console.log(`✅ ネットワークデータ保存: ${Object.keys(networkData.timeMap).length}駅間\n`);

    console.log('🎉 プリビルド完了!');
    console.log(`  ${stationsPath}`);
    console.log(`  ${networkPath}`);
}

main().catch(console.error);

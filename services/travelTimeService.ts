/**
 * 東京メトロ 所要時間・時刻表サービス
 * ODPT TrainTimetable/StationTimetable APIから実際の時刻を取得
 */

import { ODPT_API_URL, MetroLine } from '../constants';

// 所要時間キャッシュ: lineId -> Map<fromStation-toStation, minutes>
const travelTimeCache = new Map<string, Map<string, number>>();

// 駅時刻表キャッシュ: stationId-direction-calendar -> times[]
interface StationTrainInfo {
    departureTime: string;
    destination: string;
}
const stationTimetableCache = new Map<string, StationTrainInfo[]>();

const getApiKey = () => {
    return process.env.ODPT_API_KEY || process.env.VITE_ODPT_API_KEY || '';
};

/**
 * 曜日から使用するカレンダーを判定
 */
const getCalendarType = (date: Date): string => {
    const day = date.getDay();
    if (day === 0) return 'odpt.Calendar:SaturdayHoliday'; // 日曜
    if (day === 6) return 'odpt.Calendar:SaturdayHoliday'; // 土曜
    return 'odpt.Calendar:Weekday'; // 平日
};

/**
 * 列車時刻表から駅間の所要時間を計算
 */
export const prefetchTravelTimes = async (line: MetroLine): Promise<void> => {
    const apiKey = getApiKey();
    if (!apiKey) return;

    const lineId = line.id;
    if (travelTimeCache.has(lineId)) return;

    // console.log(`${line.name}の所要時間データを取得中...`);

    try {
        const url = `${ODPT_API_URL}/odpt:TrainTimetable?odpt:railway=${lineId}&odpt:calendar=odpt.Calendar:Weekday&acl:consumerKey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return;

        const trains = await response.json();
        if (!trains || trains.length === 0) return;

        const midday = trains.find((t: any) => {
            const firstDep = t['odpt:trainTimetableObject']?.[0]?.['odpt:departureTime'];
            return firstDep && (firstDep.startsWith('10:') || firstDep.startsWith('11:') || firstDep.startsWith('12:') || firstDep.startsWith('13:'));
        }) || trains[Math.floor(trains.length / 2)];

        const timetable = midday['odpt:trainTimetableObject'] || [];
        const lineCache = new Map<string, number>();

        const stations = timetable.map((t: any) => t['odpt:departureStation'] || t['odpt:arrivalStation']).filter(Boolean);
        const times = timetable.map((t: any) => t['odpt:departureTime'] || t['odpt:arrivalTime']).filter(Boolean);

        for (let i = 0; i < stations.length; i++) {
            for (let j = i + 1; j < stations.length; j++) {
                const from = stations[i];
                const to = stations[j];
                const key1 = `${from}-${to}`;
                const key2 = `${to}-${from}`;

                if (!lineCache.has(key1)) {
                    const minutes = calculateMinutesDiff(times[i], times[j]);
                    lineCache.set(key1, minutes);
                    lineCache.set(key2, minutes);
                }
            }
        }

        travelTimeCache.set(lineId, lineCache);
        // console.log(`✓ ${line.name}: ${lineCache.size}件の所要時間データを取得`);

    } catch (error) {
        console.error('TravelTime fetch error:', error);
    }
};

const calculateMinutesDiff = (from: string, to: string): number => {
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);

    let fromMin = fh * 60 + fm;
    let toMin = th * 60 + tm;

    if (toMin < fromMin) {
        toMin += 24 * 60;
    }

    return toMin - fromMin;
};

export const getTravelTime = (lineId: string, fromStation: string, toStation: string): number => {
    if (fromStation === toStation) return 0;

    const lineCache = travelTimeCache.get(lineId);
    if (lineCache) {
        const key = `${fromStation}-${toStation}`;
        if (lineCache.has(key)) {
            return lineCache.get(key)!;
        }
    }

    return 10;
};

/**
 * 駅の時刻表を取得（始発・終電用）
 */
export const fetchStationTimetable = async (
    stationId: string,
    direction: string,
    calendar: string
): Promise<StationTrainInfo[]> => {
    const cacheKey = `${stationId}-${direction}-${calendar}`;

    if (stationTimetableCache.has(cacheKey)) {
        return stationTimetableCache.get(cacheKey)!;
    }

    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
        const url = `${ODPT_API_URL}/odpt:StationTimetable?odpt:station=${stationId}&odpt:railDirection=${direction}&odpt:calendar=${calendar}&acl:consumerKey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();
        if (!data || data.length === 0) {
            console.warn(`StationTimetable empty for ${stationId} direction:${direction} calendar:${calendar}`);
            return [];
        }

        const timetableObjects = data[0]['odpt:stationTimetableObject'] || [];
        const times: StationTrainInfo[] = timetableObjects.map((obj: any) => ({
            departureTime: obj['odpt:departureTime'],
            destination: obj['odpt:destinationStation']?.[0] || ''
        }));

        stationTimetableCache.set(cacheKey, times);
        return times;

    } catch (error) {
        console.error('StationTimetable fetch error:', error);
        return [];
    }
};

export interface FirstLastTrainInfo {
    lastTrain: { departureTime: string; arrivalTime: string; destination: string } | null;
    firstTrain: { departureTime: string; arrivalTime: string; destination: string } | null;
}

/**
 * 終電と始発を取得
 * 終電: 目的地駅から宿泊駅への最終電車
 * 始発: 宿泊駅から目的地駅への最初の電車
 */
export const getFirstLastTrains = async (
    destinationStationId: string,
    hotelStationId: string,
    directionToHotel: string,
    directionToDestination: string,
    date: Date,
    travelTimeMinutes: number
): Promise<FirstLastTrainInfo> => {
    const todayCalendar = getCalendarType(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const tomorrowCalendar = getCalendarType(nextDay);

    // 終電: 目的地駅から宿泊駅方面（当日）
    const lastTrainTimes = await fetchStationTimetable(destinationStationId, directionToHotel, todayCalendar);
    // 始発: 宿泊駅から目的地方面（翌日）
    const firstTrainTimes = await fetchStationTimetable(hotelStationId, directionToDestination, tomorrowCalendar);

    let lastTrain = null;
    let firstTrain = null;

    if (lastTrainTimes.length > 0) {
        const last = lastTrainTimes[lastTrainTimes.length - 1];
        const arrivalTime = calculateArrivalTime(last.departureTime, travelTimeMinutes);
        lastTrain = {
            departureTime: last.departureTime,
            arrivalTime,
            destination: last.destination
        };
    }

    if (firstTrainTimes.length > 0) {
        const first = firstTrainTimes[0];
        const arrivalTime = calculateArrivalTime(first.departureTime, travelTimeMinutes);
        firstTrain = {
            departureTime: first.departureTime,
            arrivalTime,
            destination: first.destination
        };
    }

    return { lastTrain, firstTrain };
};

/**
 * 発車時刻から到着時刻を計算
 */
const calculateArrivalTime = (departureTime: string, minutes: number): string => {
    const [h, m] = departureTime.split(':').map(Number);
    let totalMinutes = h * 60 + m + minutes;

    if (totalMinutes >= 24 * 60) {
        totalMinutes -= 24 * 60;
    }

    const arrH = Math.floor(totalMinutes / 60);
    const arrM = totalMinutes % 60;
    return `${arrH.toString().padStart(2, '0')}:${arrM.toString().padStart(2, '0')}`;
};

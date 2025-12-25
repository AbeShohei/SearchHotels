/**
 * 東京メトロ 運賃計算サービス
 * ODPT APIから実際の運賃を取得
 */

import { ODPT_API_URL, TARGET_OPERATOR_ID } from '../constants';

// 運賃キャッシュ
interface FareData {
    icFare: number;
    ticketFare: number;
}

const fareCache = new Map<string, FareData>();
let isFareDataLoaded = false;

const getApiKey = () => {
    return process.env.ODPT_API_KEY ||
        process.env.VITE_ODPT_API_KEY ||
        '';
};

/**
 * ODPT APIから運賃データを取得してキャッシュ
 */
export const prefetchAllFares = async (stationIds: string[]): Promise<void> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn("APIキーがありません");
        isFareDataLoaded = true;
        return;
    }

    console.log("ODPT APIから東京メトロ運賃データを取得中...");

    try {
        // 各駅からの運賃を取得
        for (const fromStation of stationIds) {
            const url = `${ODPT_API_URL}/odpt:RailwayFare?odpt:operator=${TARGET_OPERATOR_ID}&odpt:fromStation=${fromStation}&acl:consumerKey=${apiKey}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`運賃取得エラー: ${response.status}`);
                continue;
            }

            const data = await response.json();

            data.forEach((item: any) => {
                const from = item['odpt:fromStation'];
                const to = item['odpt:toStation'];
                const icFare = item['odpt:icCardFare'];
                const ticketFare = item['odpt:ticketFare'];

                if (from && to && icFare !== undefined) {
                    const key = `${from}-${to}`;
                    fareCache.set(key, { icFare, ticketFare });
                    // 逆方向も同じ運賃
                    const reverseKey = `${to}-${from}`;
                    if (!fareCache.has(reverseKey)) {
                        fareCache.set(reverseKey, { icFare, ticketFare });
                    }
                }
            });
        }

        console.log(`✓ ODPT APIから ${fareCache.size} 件の運賃データを取得`);
        isFareDataLoaded = true;

    } catch (error) {
        console.error("運賃データ取得エラー:", error);
        isFareDataLoaded = true;
    }
};

/**
 * 2駅間の運賃を取得（IC運賃と切符運賃）
 */
export const getBothFares = (
    fromStationId: string,
    toStationId: string
): { icFare: number; ticketFare: number } => {
    if (fromStationId === toStationId) return { icFare: 0, ticketFare: 0 };

    const cacheKey1 = `${fromStationId}-${toStationId}`;
    const cacheKey2 = `${toStationId}-${fromStationId}`;

    if (fareCache.has(cacheKey1)) {
        return fareCache.get(cacheKey1)!;
    }
    if (fareCache.has(cacheKey2)) {
        return fareCache.get(cacheKey2)!;
    }

    // フォールバック（メトロの最低運賃）
    return { icFare: 180, ticketFare: 180 };
};

/**
 * IC運賃のみ取得（互換性用）
 */
export const getFareBetweenStations = (
    fromStationId: string,
    toStationId: string
): number => {
    return getBothFares(fromStationId, toStationId).icFare;
};

export const getFareCacheSize = (): number => fareCache.size;

export const calculateTravelTimeByStationCount = (stationCount: number): number => {
    return Math.ceil(stationCount * 2); // メトロは約2分/駅
};

export const isFareLoaded = (): boolean => isFareDataLoaded;

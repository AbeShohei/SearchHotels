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

    // console.log("ODPT APIから東京メトロ運賃データを取得中...");

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

        // console.log(`✓ ODPT APIから ${fareCache.size} 件の運賃データを取得`);
        isFareDataLoaded = true;

    } catch (error) {
        console.error("運賃データ取得エラー:", error);
        isFareDataLoaded = true;
    }
};

/**
 * 特定の駅からの全運賃を一括取得し、Mapで返す
 * @param fromStationId 出発駅ID（目的地）
 */
export const getFaresFromStation = async (fromStationId: string): Promise<Map<string, FareData>> => {
    const apiKey = getApiKey();
    const resultMap = new Map<string, FareData>();

    // 自分自身への運賃は0
    resultMap.set(fromStationId, { icFare: 0, ticketFare: 0 });

    if (!apiKey) return resultMap;

    try {
        const url = `${ODPT_API_URL}/odpt:RailwayFare?odpt:operator=${TARGET_OPERATOR_ID}&odpt:fromStation=${fromStationId}&acl:consumerKey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return resultMap;

        const data = await response.json();
        data.forEach((item: any) => {
            const to = item['odpt:toStation'];
            const icFare = item['odpt:icCardFare'];
            const ticketFare = item['odpt:ticketFare'];

            if (to && icFare !== undefined) {
                resultMap.set(to, { icFare, ticketFare });

                // キャッシュにも入れておく（getBothFares等のため）
                const key = `${fromStationId}-${to}`;
                fareCache.set(key, { icFare, ticketFare });
                const revKey = `${to}-${fromStationId}`;
                fareCache.set(revKey, { icFare, ticketFare });
            }
        });
    } catch (e) {
        console.error("Fare fetch error", e);
    }
    return resultMap;
};

export const getFareCacheSize = (): number => fareCache.size;

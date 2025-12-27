/**
 * 徒歩ルート計算サービス
 * OSRM (Open Source Routing Machine) APIを使用
 */

// OSRM公開サーバー（徒歩モード）
const OSRM_FOOT_URL = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";

export interface WalkingRouteResult {
    durationMinutes: number;  // 徒歩時間（分）
    distanceMeters: number;   // 距離（メートル）
}

/**
 * 2点間の徒歩ルートを計算
 * @param fromLat 出発地の緯度
 * @param fromLng 出発地の経度
 * @param toLat 目的地の緯度
 * @param toLng 目的地の経度
 */
export const getWalkingRoute = async (
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
): Promise<WalkingRouteResult | null> => {
    try {
        // OSRM format: /route/v1/{profile}/{coordinates}
        // coordinates: lng,lat;lng,lat (経度が先)
        const url = `${OSRM_FOOT_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`OSRM API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.warn('No route found');
            return null;
        }

        const route = data.routes[0];
        return {
            durationMinutes: Math.round(route.duration / 60), // 秒→分
            distanceMeters: Math.round(route.distance)
        };

    } catch (e) {
        console.error('Walking route calculation failed:', e);
        return null;
    }
};

/**
 * ホテルから駅までの徒歩時間を計算
 */
export const getWalkingTimeToStation = async (
    hotelLat: number,
    hotelLng: number,
    stationLat: number,
    stationLng: number
): Promise<number | null> => {
    const result = await getWalkingRoute(hotelLat, hotelLng, stationLat, stationLng);
    return result ? result.durationMinutes : null;
};

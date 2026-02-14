import { HotelResult } from '../types';

const RAKUTEN_API_URL = "https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426";
// @ts-ignore
const RAKUTEN_APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID || '';

// キャッシュの型定義
interface CacheEntry {
    data: HotelResult[];
    cachedDate: string; // YYYY-MM-DD 形式
}

// インメモリキャッシュ（ページセッション内）
const hotelCache = new Map<string, CacheEntry>();

// 今日の日付をYYYY-MM-DD形式で取得
const getTodayString = (): string => {
    return new Date().toISOString().split('T')[0];
};

// キャッシュキーを生成
const getCacheKey = (
    lat: number,
    lng: number,
    checkinDate: string,
    checkoutDate: string,
    adultNum: number,
    roomNum: number
): string => {
    // 緯度経度は小数点2桁で丸める（近い場所は同じキャッシュを使う）
    return `${checkinDate}_${checkoutDate}_${lat.toFixed(2)}_${lng.toFixed(2)}_${adultNum}_${roomNum}`;
};

// キャッシュから取得（当日分のみ有効）
const getFromCache = (key: string): HotelResult[] | null => {
    const entry = hotelCache.get(key);
    if (!entry) return null;

    // 当日のキャッシュのみ有効
    if (entry.cachedDate !== getTodayString()) {
        hotelCache.delete(key);
        return null;
    }

    return entry.data;
};

// キャッシュに保存
const saveToCache = (key: string, data: HotelResult[]): void => {
    hotelCache.set(key, {
        data,
        cachedDate: getTodayString()
    });
};

export interface RakutenHotel {
    hotelName: string;
    hotelNo: number;
    hotelInformationUrl: string;
    planList: {
        plan: {
            planName: string;
            room2: {
                dailyCharge: {
                    total: number;
                }
            }
        }
    }[];
    reviewAverage?: number;
}

export const searchHotels = async (
    lat: number,
    lng: number,
    checkinDate: string,
    checkoutDate: string,
    adultNum: number,
    roomNum: number
): Promise<HotelResult[]> => {
    // console.log("searchHotels function called");
    if (!RAKUTEN_APP_ID) {
        console.warn("VITE_RAKUTEN_APP_ID is not set");
        return [];
    }

    // キャッシュチェック
    const cacheKey = getCacheKey(lat, lng, checkinDate, checkoutDate, adultNum, roomNum);
    const cached = getFromCache(cacheKey);
    if (cached) {
        return cached;
    }

    // 検索半径(km)
    const searchRadius = 1;

    // 楽天トラベルAPIは秒間リクエスト制限があるため注意が必要
    const url = `${RAKUTEN_API_URL}?applicationId=${RAKUTEN_APP_ID}&format=json&checkinDate=${checkinDate}&checkoutDate=${checkoutDate}&latitude=${lat}&longitude=${lng}&searchRadius=${searchRadius}&adultNum=${adultNum}&roomNum=${roomNum}&datumType=1`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // 404含む全てのエラーで空配列を返す（ログなし）
            return [];
        }

        const data = await response.json();

        // 検索結果のルートキーを確認 ("hotels" または "items")
        // ドキュメントによると formatVersion=1 で items になる可能性があるが、通常 VacantHotelSearch は hotels を返す
        const hotelList = data.hotels || data.items;
        // console.log(`Found ${hotelList ? hotelList.length : 0} raw items`);

        if (!hotelList || !Array.isArray(hotelList)) {
            // console.warn("Unexpected API response structure:", JSON.stringify(data).substring(0, 200));
            return [];
        }

        const results: HotelResult[] = hotelList.map((item: any) => {
            // item = { hotel: [ {hotelBasicInfo: ...}, {roomInfo: ...}, ... ] }
            const hotelContainer = item.hotel;
            if (!Array.isArray(hotelContainer)) return null;

            // 構造が変わっても対応できるようにfindで探す
            const basicInfoWrapper = hotelContainer.find((h: any) => h.hotelBasicInfo);
            const roomInfoWrapper = hotelContainer.find((h: any) => h.roomInfo);

            const basicInfo = basicInfoWrapper?.hotelBasicInfo;
            const roomInfos = roomInfoWrapper?.roomInfo; // Array of plans

            if (!basicInfo) return null;

            let price = 0;
            // 泊数計算
            const d1 = new Date(checkinDate);
            const d2 = new Date(checkoutDate);
            const nights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000));

            // roomInfoが配列で返ってくるので、その中のプランから最安値を探し、その客室画像も取得
            let roomImageUrl: string | undefined;
            let roomThumbnailUrl: string | undefined;

            if (Array.isArray(roomInfos)) {
                // 有効な価格を持つプランを抽出
                const roomsWithPrices = roomInfos.map((r: any) => {
                    const dc = r.dailyCharge;
                    const roomPrice = dc?.stayTotal || (dc?.total ? dc.total * nights : 0);
                    // Extract room images if available
                    const rImg = r.roomBasicInfo?.roomImageUrl || r.roomImageUrl;
                    const rThumb = r.roomBasicInfo?.roomThumbnailUrl || r.roomThumbnailUrl;

                    return {
                        price: roomPrice,
                        roomImageUrl: rImg,
                        roomThumbnailUrl: rThumb
                    };
                }).filter((r: any) => r.price > 0);

                if (roomsWithPrices.length > 0) {
                    // 最安値のプランを見つける
                    const cheapestRoom = roomsWithPrices.reduce((min, r) => r.price < min.price ? r : min);
                    price = cheapestRoom.price;
                    roomImageUrl = cheapestRoom.roomImageUrl;
                    roomThumbnailUrl = cheapestRoom.roomThumbnailUrl;
                }
            }

            // 価格が取得できない、または0の場合はスキップ (あるいは表示したい場合は0を入れるが、今回は除外)
            if (price === 0) {
                // console.warn("Price not found for hotel:", basicInfo.hotelName);
                return null;
            }

            return {
                hotelName: basicInfo.hotelName || "Unknown Hotel",
                price: price,
                stationId: "",
                hotelUrl: basicInfo.hotelInformationUrl,
                // Provide both hotel and room images
                hotelImageUrl: basicInfo.hotelImageUrl,
                roomImageUrl: roomImageUrl,
                roomThumbnailUrl: roomThumbnailUrl,
                reviewAverage: basicInfo.reviewAverage,
                hotelLat: basicInfo.latitude,
                hotelLng: basicInfo.longitude
            };
        }).filter((h: any) => h).sort((a: any, b: any) => a.price - b.price);

        // キャッシュに保存
        saveToCache(cacheKey, results);

        // すべてのホテルを返す
        return results;

    } catch (e) {
        // エラーは静かに空配列を返す
        return [];
    }
};

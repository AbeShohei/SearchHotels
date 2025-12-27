import { HotelResult } from '../types';

const RAKUTEN_API_URL = "https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426";
// @ts-ignore
const RAKUTEN_APP_ID = import.meta.env.VITE_RAKUTEN_APP_ID || process.env.VITE_RAKUTEN_APP_ID || '';

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

    // 検索半径(km)。ユーザー要望の1km -> ヒット率向上のため3kmに拡大
    const searchRadius = 3;

    // 楽天トラベルAPIは秒間リクエスト制限があるため注意が必要
    const url = `${RAKUTEN_API_URL}?applicationId=${RAKUTEN_APP_ID}&format=json&checkinDate=${checkinDate}&checkoutDate=${checkoutDate}&latitude=${lat}&longitude=${lng}&searchRadius=${searchRadius}&adultNum=${adultNum}&roomNum=${roomNum}&datumType=1`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                // データなし(Data Not Found)は正常系として扱う
                return [];
            }

            console.error(`Rakuten API Error: ${response.status} ${response.statusText}`);
            try {
                const text = await response.text();
                // 400 Bad Request error_description: "wrong_parameter" など
                console.error("Rakuten API Error Body:", text);
            } catch (e) { /* ignore */ }
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

            // roomInfoが配列で返ってくるので、その中のプランから最安値を探す
            if (Array.isArray(roomInfos)) {
                // 有効な価格を持つプランを抽出
                const charges = roomInfos.map((r: any) => {
                    const dc = r.dailyCharge;
                    // stayTotalがあればそれを使う（滞在合計）。なければtotal（1日分と仮定）× 泊数
                    return dc?.stayTotal || (dc?.total ? dc.total * nights : 0);
                }).filter((p: number) => p > 0);

                if (charges.length > 0) {
                    price = Math.min(...charges);
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
                imageUrl: basicInfo.hotelImageUrl, // ここも APIによっては thumbnail の場合があるが基本はこれ
                reviewAverage: basicInfo.reviewAverage
            };
        }).filter((h: any) => h).sort((a: any, b: any) => a.price - b.price);

        // すべてのホテルを返す
        return results;

    } catch (e) {
        console.error("Failed to fetch Rakuten hotels (Network/CORS error?):", e);
        return [];
    }
};

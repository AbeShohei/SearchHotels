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
    checkoutDate: string
): Promise<HotelResult[]> => {
    if (!RAKUTEN_APP_ID) {
        console.warn("VITE_RAKUTEN_APP_ID is not set");
        return [];
    }

    // 検索半径(km)。ユーザー要望の1km -> ヒット率向上のため3kmに拡大
    const searchRadius = 3;

    // 楽天トラベルAPIは秒間リクエスト制限があるため注意が必要
    // formatVersion=2を指定するとレスポンス構造が変わるため、既存のパースロジック(配列アクセス)に合わせるため除去します。
    // items[0].hotel, items[1].roomInfo という構造は formatVersion指定なし(デフォルト)のものです。
    const url = `${RAKUTEN_API_URL}?applicationId=${RAKUTEN_APP_ID}&format=json&checkinDate=${checkinDate}&checkoutDate=${checkoutDate}&latitude=${lat}&longitude=${lng}&searchRadius=${searchRadius}&adultNum=2&datumType=1`;

    try {
        console.log("Fetching Rakuten URL:", url); // for debug
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                // データなし(Data Not Found)は正常系として扱う
                // console.log(`No hotels found for location ${lat},${lng}`);
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

        // デバッグ: 成功時のデータ構造確認（一瞬だけ有効化）
        // if (data.hotels && data.hotels.length > 0) {
        //    console.log("Rakuten API Success Structure:", JSON.stringify(data.hotels[0], null, 2));
        // }

        if (!data.hotels || !Array.isArray(data.hotels)) {
            return [];
        }

        const results: HotelResult[] = data.hotels.map((item: any) => {
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
            // roomInfoが配列で返ってくるので、その中のプランから最安値を探す
            if (Array.isArray(roomInfos)) {
                // 有効な価格を持つプランを抽出
                const charges = roomInfos.map((r: any) => {
                    const dc = r.dailyCharge;
                    return dc?.total || dc?.stayTotal || 0;
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

        // 最安値の1件だけ返すか、複数返すか？
        // SerachHotelsアプリの構造上、1駅につき1つの代表ホテル価格を使っているため、最安値を返すのが適切
        return results.length > 0 ? [results[0]] : [];

    } catch (e) {
        console.error("Failed to fetch Rakuten hotels", e);
        return [];
    }
};

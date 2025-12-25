import { HotelResult } from '../types';

// ホテル名のモックデータ
const HOTEL_NAMES = [
  'グランドセントラルホテル',
  'ステーションイン',
  'シティビジネスホテル',
  'コンフォートステイ',
  'グリーンプラザ',
  'ターミナルホテル',
  'アーバンリゾート',
  'スカイホテル',
  'パークサイドホテル'
];

/**
 * ホテル価格を生成する関数（同期版）
 * 都心（新宿）からの距離に基づいて価格を生成
 */
export const generateHotelPrice = (lng: number): number => {
  // 経度が西に行くほど（小さくなるほど）ベース価格を下げる
  const basePrice = 25000 - ((139.700257 - lng) * 20000);

  // ランダムな変動（+/- 3000円）を追加
  const randomFlux = (Math.random() * 6000) - 3000;

  let finalPrice = Math.floor(basePrice + randomFlux);

  // 最低価格の保証（現実的な範囲に収める）
  if (finalPrice < 6000) finalPrice = 6000 + Math.floor(Math.random() * 2000);

  return finalPrice;
};

/**
 * ホテル検索結果を生成（同期版・即座に結果を返す）
 */
export const generateHotel = (
  lat: number,
  lng: number,
  stationName: string
): HotelResult => {
  const randomName = HOTEL_NAMES[Math.floor(Math.random() * HOTEL_NAMES.length)];
  const price = generateHotelPrice(lng);

  return {
    hotelName: `${randomName} ${stationName}`,
    price,
    stationId: stationName
  };
};

/**
 * 楽天トラベル空室検索API（SimpleHotelSearch）をシミュレートする関数
 * ネットワーク遅延を含みます（レガシー互換のため残す）
 */
export const searchHotelsMock = async (
  lat: number,
  lng: number,
  date: string,
  stationId: string
): Promise<HotelResult> => {
  // ネットワーク遅延をシミュレート（レート制限対策: time.sleep(1) 相当）
  await new Promise(resolve => setTimeout(resolve, 100));

  return generateHotel(lat, lng, stationId);
};
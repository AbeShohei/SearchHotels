import { Destination } from './types';

// ODPT Constants
export const ODPT_API_URL = "https://api.odpt.org/api/v4";
export const TARGET_OPERATOR_ID = "odpt.Operator:TokyoMetro";

// 東京メトロ全路線
export interface MetroLine {
  id: string;
  name: string;
  color: string;
  referenceStationId: string;
  referenceStationName: string;
  directionAsc: string; // 順方向（駅リストの終点方面）
  directionDesc: string; // 逆方向（駅リストの始点方面）
}

export const METRO_LINES: MetroLine[] = [
  {
    id: 'odpt.Railway:TokyoMetro.Marunouchi',
    name: '丸ノ内線',
    color: '#F62E36',
    referenceStationId: 'odpt.Station:TokyoMetro.Marunouchi.Shinjuku',
    referenceStationName: '新宿',
    directionAsc: 'odpt.RailDirection:TokyoMetro.Ikebukuro',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Ogikubo'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Ginza',
    name: '銀座線',
    color: '#FF9500',
    referenceStationId: 'odpt.Station:TokyoMetro.Ginza.Shibuya',
    referenceStationName: '渋谷',
    directionAsc: 'odpt.RailDirection:TokyoMetro.Asakusa',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Shibuya'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Hibiya',
    name: '日比谷線',
    color: '#B5B5AC',
    referenceStationId: 'odpt.Station:TokyoMetro.Hibiya.Ueno',
    referenceStationName: '上野',
    directionAsc: 'odpt.RailDirection:TokyoMetro.KitaSenju',
    directionDesc: 'odpt.RailDirection:TokyoMetro.NakaMeguro'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Tozai',
    name: '東西線',
    color: '#009BBF',
    referenceStationId: 'odpt.Station:TokyoMetro.Tozai.Nakano',
    referenceStationName: '中野',
    directionAsc: 'odpt.RailDirection:TokyoMetro.NishiFunabashi',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Nakano'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Chiyoda',
    name: '千代田線',
    color: '#00BB85',
    referenceStationId: 'odpt.Station:TokyoMetro.Chiyoda.Omotesando',
    referenceStationName: '表参道',
    directionAsc: 'odpt.RailDirection:TokyoMetro.KitaAyase',
    directionDesc: 'odpt.RailDirection:TokyoMetro.YoyogiUehara'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Yurakucho',
    name: '有楽町線',
    color: '#C1A470',
    referenceStationId: 'odpt.Station:TokyoMetro.Yurakucho.Ikebukuro',
    referenceStationName: '池袋',
    directionAsc: 'odpt.RailDirection:TokyoMetro.ShinKiba',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Wakoshi'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Hanzomon',
    name: '半蔵門線',
    color: '#8F76D6',
    referenceStationId: 'odpt.Station:TokyoMetro.Hanzomon.Shibuya',
    referenceStationName: '渋谷',
    directionAsc: 'odpt.RailDirection:TokyoMetro.Oshiage',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Shibuya'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Namboku',
    name: '南北線',
    color: '#00AC9B',
    referenceStationId: 'odpt.Station:TokyoMetro.Namboku.Meguro',
    referenceStationName: '目黒',
    directionAsc: 'odpt.RailDirection:TokyoMetro.AkabaneIwabuchi',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Meguro'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Fukutoshin',
    name: '副都心線',
    color: '#9C5E31',
    referenceStationId: 'odpt.Station:TokyoMetro.Fukutoshin.Shibuya',
    referenceStationName: '渋谷',
    directionAsc: 'odpt.RailDirection:TokyoMetro.Shibuya',
    directionDesc: 'odpt.RailDirection:TokyoMetro.Wakoshi'
  },
];

// デフォルト路線
export const DEFAULT_LINE = METRO_LINES[0];

export const CALC_CONSTANTS = {
  FARE_PER_STATION: 160,
  MINUTES_PER_STATION: 2,
  VALUE_OF_TIME_PER_MINUTE: 30,
};

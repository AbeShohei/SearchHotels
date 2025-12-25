import { Destination } from './types';

// ODPT Constants
export const ODPT_API_URL = "https://api.odpt.org/api/v4";
export const TARGET_OPERATOR_ID = "odpt.Operator:TokyoMetro";

// 東京メトロ全路線
export interface MetroLine {
  id: string;
  name: string;
  color: string;
  referenceStationId: string; // 基準駅
  referenceStationName: string;
}

export const METRO_LINES: MetroLine[] = [
  {
    id: 'odpt.Railway:TokyoMetro.Marunouchi',
    name: '丸ノ内線',
    color: '#F62E36',
    referenceStationId: 'odpt.Station:TokyoMetro.Marunouchi.Shinjuku',
    referenceStationName: '新宿'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Ginza',
    name: '銀座線',
    color: '#FF9500',
    referenceStationId: 'odpt.Station:TokyoMetro.Ginza.Shibuya',
    referenceStationName: '渋谷'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Hibiya',
    name: '日比谷線',
    color: '#B5B5AC',
    referenceStationId: 'odpt.Station:TokyoMetro.Hibiya.Ueno',
    referenceStationName: '上野'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Tozai',
    name: '東西線',
    color: '#009BBF',
    referenceStationId: 'odpt.Station:TokyoMetro.Tozai.Nakano',
    referenceStationName: '中野'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Chiyoda',
    name: '千代田線',
    color: '#00BB85',
    referenceStationId: 'odpt.Station:TokyoMetro.Chiyoda.Omotesando',
    referenceStationName: '表参道'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Yurakucho',
    name: '有楽町線',
    color: '#C1A470',
    referenceStationId: 'odpt.Station:TokyoMetro.Yurakucho.Ikebukuro',
    referenceStationName: '池袋'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Hanzomon',
    name: '半蔵門線',
    color: '#8F76D6',
    referenceStationId: 'odpt.Station:TokyoMetro.Hanzomon.Shibuya',
    referenceStationName: '渋谷'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Namboku',
    name: '南北線',
    color: '#00AC9B',
    referenceStationId: 'odpt.Station:TokyoMetro.Namboku.Meguro',
    referenceStationName: '目黒'
  },
  {
    id: 'odpt.Railway:TokyoMetro.Fukutoshin',
    name: '副都心線',
    color: '#9C5E31',
    referenceStationId: 'odpt.Station:TokyoMetro.Fukutoshin.Shibuya',
    referenceStationName: '渋谷'
  },
];

// デフォルト路線
export const DEFAULT_LINE = METRO_LINES[0];

export const CALC_CONSTANTS = {
  FARE_PER_STATION: 160,
  MINUTES_PER_STATION: 2,
  VALUE_OF_TIME_PER_MINUTE: 30,
};

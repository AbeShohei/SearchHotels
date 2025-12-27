export interface Station {
  id: string; // ODPT ID (e.g., odpt.Station:JR-East.ChuoRapid.Shinjuku)
  name: string;
  romaji: string;
  kana?: string;
  lat: number;
  lng: number;
  stationCountFromShinjuku: number; // Index relative to Shinjuku
}

export interface GroupedStation {
  name: string;
  romaji: string;
  kana?: string;
  stations: {
    id: string; // odpt:Station ID
    lineId: string;
    lineName: string;
    lat: number;
    lng: number;
  }[];
}

export interface HotelResult {
  hotelName: string;
  price: number;
  stationId: string;
  hotelUrl?: string;
  hotelImageUrl?: string;
  reviewAverage?: number;
  hotelLat?: number;
  hotelLng?: number;
}

export interface ScoredResult extends Station {
  hotel: HotelResult;
  transportCost: number; // One way IC fare (for calculation)
  icFare: number;        // One way IC fare
  ticketFare: number;    // One way ticket fare
  trainTime: number;     // Minutes on train
  walkTime: number;      // Minutes walking (fixed based on destination)
  transfers: number;     // Number of transfers
  lines: string[];       // List of Line IDs used
  totalCost: number;     // Sum of hotel + round trip fare
  savings?: number;      // Difference from destination cost (positive = cheaper)
  numberOfStops?: number;
  // コスパ指標用
  savedMoney?: number;   // 浮いた金額 (円)
  extraTime?: number;    // 追加時間 (分)
  cospaIndex?: number;   // コスパ指標 (円/分)
}


// ODPT Raw Data Types
export interface OdptStation {
  '@id': string;
  'owl:sameAs': string;
  'dc:title': string;
  'geo:lat': number;
  'geo:long': number;
  'odpt:stationTitle': {
    en: string;
    ja: string;
    'ja-Hrkt'?: string;
  };
}

export interface OdptRailway {
  '@id': string;
  'odpt:stationOrder': {
    'odpt:station': string;
    'odpt:index': number;
  }[];
}
// Re-export or redefine to avoid deep imports if preferred, 
// but importing from service is fine if no cycle.
import { FirstLastTrainInfo } from './services/travelTimeService';

export interface ExtendedResult extends ScoredResult {
  trainSchedule?: FirstLastTrainInfo;
}

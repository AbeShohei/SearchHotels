export interface Station {
  id: string; // ODPT ID (e.g., odpt.Station:JR-East.ChuoRapid.Shinjuku)
  name: string;
  romaji: string;
  lat: number;
  lng: number;
  stationCountFromShinjuku: number; // Index relative to Shinjuku
}

export interface HotelResult {
  hotelName: string;
  price: number;
  stationId: string;
}

export interface ScoredResult extends Station {
  hotel: HotelResult;
  transportCost: number; // One way IC fare (for calculation)
  icFare: number;        // One way IC fare
  ticketFare: number;    // One way ticket fare
  timeCost: number;      // Total time value
  trainTime: number;     // Minutes on train
  walkTime: number;      // Minutes walking (fixed based on destination)
  totalScore: number;
}

export interface Destination {
  id: string;
  name: string;
  nearestStationId: string;
  minutesFromStation: number;
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
  };
}

export interface OdptRailway {
  '@id': string;
  'odpt:stationOrder': {
    'odpt:station': string;
    'odpt:index': number;
  }[];
}

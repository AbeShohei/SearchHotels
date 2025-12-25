import { OdptStation, OdptRailway, Station } from '../types';
import { ODPT_API_URL, METRO_LINES, MetroLine } from '../constants';

const getApiKey = () => {
  return process.env.ODPT_API_KEY ||
    process.env.VITE_ODPT_API_KEY ||
    process.env.REACT_APP_ODPT_API_KEY ||
    '';
};

export interface StationDataResponse {
  stations: Station[];
  isFallback: boolean;
  error?: string;
}

/**
 * 指定した路線の駅一覧を取得
 */
export const getLineStations = async (line: MetroLine): Promise<StationDataResponse> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("ODPT_API_KEY not found");
      return { stations: [], isFallback: true, error: "API Key Missing" };
    }

    // 1. Fetch Railway info
    const railwayUrl = `${ODPT_API_URL}/odpt:Railway?owl:sameAs=${line.id}&acl:consumerKey=${apiKey}`;
    const railwayRes = await fetch(railwayUrl);
    if (!railwayRes.ok) throw new Error(`Railway API Error: ${railwayRes.status}`);
    const railwayData = await railwayRes.json();
    const railway: OdptRailway | null = railwayData[0] || null;

    // 2. Fetch Station info
    const stationsUrl = `${ODPT_API_URL}/odpt:Station?odpt:railway=${line.id}&acl:consumerKey=${apiKey}`;
    const stationsRes = await fetch(stationsUrl);
    if (!stationsRes.ok) throw new Error(`Station API Error: ${stationsRes.status}`);
    const stationsRaw: OdptStation[] = await stationsRes.json();

    if (stationsRaw.length === 0) {
      throw new Error("No station data returned");
    }

    // 3. Order stations
    let orderedStations: Station[] = [];

    if (railway && railway['odpt:stationOrder'] && railway['odpt:stationOrder'].length > 0) {
      const stationMap = new Map<string, OdptStation>();
      stationsRaw.forEach(s => stationMap.set(s['owl:sameAs'], s));

      railway['odpt:stationOrder'].forEach((item) => {
        const stationData = stationMap.get(item['odpt:station']);
        if (stationData) {
          orderedStations.push({
            id: stationData['owl:sameAs'],
            name: stationData['odpt:stationTitle']?.ja || stationData['dc:title'],
            romaji: stationData['odpt:stationTitle']?.en || '',
            lat: stationData['geo:lat'],
            lng: stationData['geo:long'],
            stationCountFromShinjuku: 0,
          });
        }
      });
    } else {
      orderedStations = stationsRaw.map(s => ({
        id: s['owl:sameAs'],
        name: s['odpt:stationTitle']?.ja || s['dc:title'],
        romaji: s['odpt:stationTitle']?.en || '',
        lat: s['geo:lat'],
        lng: s['geo:long'],
        stationCountFromShinjuku: 0,
      }));
    }

    // 4. Calculate distance from reference station
    const refIndex = orderedStations.findIndex(s => s.id === line.referenceStationId);
    const finalStations = orderedStations.map((s, idx) => ({
      ...s,
      stationCountFromShinjuku: refIndex >= 0 ? Math.abs(idx - refIndex) : idx
    }));

    console.log(`${line.name}: ${finalStations.length}駅を取得`);
    return { stations: finalStations, isFallback: false };

  } catch (e: any) {
    console.error(`${line.name} 取得エラー:`, e);
    return {
      stations: [],
      isFallback: true,
      error: e.message || "Unknown Error"
    };
  }
};

/**
 * すべての東京メトロ路線の駅データを取得
 */
export const getAllMetroStations = async (): Promise<Map<string, StationDataResponse>> => {
  const results = new Map<string, StationDataResponse>();

  for (const line of METRO_LINES) {
    const data = await getLineStations(line);
    results.set(line.id, data);
  }

  return results;
};

// Backward compatibility
export const getChuoLineStations = async () => {
  return getLineStations(METRO_LINES[0]);
};

export const getMetroStations = getChuoLineStations;
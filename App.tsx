import React, { useState, useEffect, useMemo } from 'react';
import * as odpt from './services/odptService';
import { searchHotels } from './services/rakutenService';


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
import { getFaresFromStation } from './services/fareService';
import { getTravelTime, getFirstLastTrains, FirstLastTrainInfo } from './services/travelTimeService';
import { initializeNetwork, findRoutesToDestination, isNetworkInitialized, RouteResult } from './services/networkService';
import { ScoredResult, Station, GroupedStation } from './types';
import { ResultCard } from './components/ResultCard';
import { DateRangePicker } from './components/DateRangePicker';
import { METRO_LINES, MetroLine } from './constants';

// const VALUE_OF_TIME_PER_MINUTE = 30; // Deprecated

// Helper to get line color
const lineMap = new Map<string, MetroLine>();
METRO_LINES.forEach(l => lineMap.set(l.id, l));

const getLineColor = (lineId?: string) => {
  if (!lineId) return '#cccccc';
  return lineMap.get(lineId)?.color || '#cccccc';
};

// 路線の方向IDを取得 (簡易版: ネットワーク探索結果には使わないが、終電検索で必要)
// ※ 乗り換えがある場合、終電検索は複雑になるため、今回は「直通」の場合のみ終電を表示するか、
// あるいはメインの移動区間（最も時間が長い区間）の終電を表示するか。
// ユーザー要望「乗り換えを含めて検索」に対して「始発・終電」はどうするか？
// 乗り換えルートの終電検索は非常に難しい（乗り継ぎ検索が必要）。
// とりあえず、「直通」の場合は以前と同じロジック、「乗り換え」の場合は「終電情報なし」とするか、
// 「詳細検索」として諦めるか。
// ここでは、直通ルート（transfers === 0）の場合のみ終電情報を表示する方針にする。

const getRailDirection = (lineId: string, fromStationId: string, toStationId: string): string => {
  // 今回はApp.tsx側で方向判定ロジックを持たず、travelTimeService等に任せたいが、
  // 以前のロジックを流用するなら、Station情報が必要。
  // GroupedStationには stationCountFromShinjuku がないため、判定が難しい。
  // 暫定措置: 以前の station配列がないため、このロジックは使えない！
  // -> 終電情報の表示は一旦保留するか、または「時刻表API」から直接探す必要がある。
  // 今回は「検索機能の強化」が優先なので、終電表示は「直通かつデータが取れる場合」に限定する。
  return '';
};

interface ExtendedResult extends ScoredResult {
  trainSchedule?: FirstLastTrainInfo;
}

const App: React.FC = () => {
  const [groupedStations, setGroupedStations] = useState<GroupedStation[]>([]);
  const [isNetworkLoaded, setIsNetworkLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [results, setResults] = useState<ExtendedResult[]>([]);

  // Date input
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [adultCount, setAdultCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);

  // Search parameters snapshot (to avoid updating results when inputs change)
  const [searchedParams, setSearchedParams] = useState({
    adultCount: 2,
    nightCount: 1,
    roomCount: 1,
    selectedDate: new Date().toISOString().split('T')[0]
  });

  // Autocomplete state
  const [stationInput, setStationInput] = useState('半蔵門');
  const [selectedStation, setSelectedStation] = useState<GroupedStation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const suggestions = useMemo(() => {
    if (!stationInput.trim()) return groupedStations;
    const query = stationInput.toLowerCase();
    return groupedStations.filter(s =>
      s.name.includes(stationInput) ||
      s.romaji.toLowerCase().includes(query) ||
      (s.kana && s.kana.includes(query))
    ).slice(0, 8);
  }, [stationInput, groupedStations]);

  useEffect(() => {
    const init = async () => {
      // Load stations
      const stations = await odpt.getAllGroupedStations();
      setGroupedStations(stations);

      // Initialize network
      await initializeNetwork();
      setIsNetworkLoaded(true);
    };
    init();
  }, []);

  // Set default selection when stations are loaded
  useEffect(() => {
    if (groupedStations.length > 0 && !selectedStation && stationInput === '銀座') {
      const match = groupedStations.find(s => s.name === '銀座');
      if (match) setSelectedStation(match);
    }
  }, [groupedStations]);



  const handleStationSelect = (station: GroupedStation) => {
    setSelectedStation(station);
    setStationInput(station.name);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {

    let target = selectedStation;
    if (!target && stationInput) {
      target = groupedStations.find(s => s.name === stationInput) || null;
    }

    if (!isNetworkLoaded || !target) {
      return;
    }
    setLoading(true);

    // Calculate nights for params
    const d1 = new Date(selectedDate);
    const d2 = new Date(checkOutDate);
    const diff = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

    setSearchedParams({ adultCount, nightCount: diff, roomCount, selectedDate });
    setResults([]);
    setHasSearched(true);

    // 1. 経路計算 (乗り換えなし: maxTransfers=0)
    const routeResults = findRoutesToDestination(target.name, 0);

    // 2. 運賃取得
    const representativeId = target.stations[0].id;

    let faresMap;
    try {
      faresMap = await getFaresFromStation(representativeId);
    } catch (e) {
      // console.error('Failed to get fares', e);
      faresMap = new Map();
    }

    const tempResults: ExtendedResult[] = [];

    // routeResults (Map<stationId, RouteResult>) をループ
    // hotelsは各駅（routeResultsのキー）にあると仮定
    for (const [stationId, route] of routeResults.entries()) {
      // 自分自身（目的地）はスキップしない
      // if (route.totalTime === 0 && stationId === representativeId) continue;

      // ... (省略なし、しかしコンテキストのためループ内は変更しないが、target変数を使う必要がある箇所をチェック)
      // representativeId は target から取っているのOK
    }

    // 駅名単位でベストなルートを集約する
    const bestRoutesByName = new Map<string, RouteResult>();
    for (const [id, route] of routeResults.entries()) {
      const stationName = groupedStations.find(g => g.stations.some(s => s.id === id))?.name;
      if (!stationName) continue;

      // 目的地そのものはスキップしない（ユーザー要望）
      // if (stationName === target.name) continue;

      if (!bestRoutesByName.has(stationName) || bestRoutesByName.get(stationName)!.totalTime > route.totalTime) {
        bestRoutesByName.set(stationName, route);
      }
    }

    // ... (後半の処理は変更なし)


    // 目的地を最初に検索し、残りは移動時間が短い順（近い順）に並び替える
    const sortedRoutes = new Map<string, RouteResult>();

    // 1. Destination first
    if (bestRoutesByName.has(target.name)) {
      sortedRoutes.set(target.name, bestRoutesByName.get(target.name)!);
    }

    // 2. Sort others by totalTime
    const otherStations = Array.from(bestRoutesByName.entries())
      .filter(([name]) => name !== target.name)
      .sort((a, b) => a[1].totalTime - b[1].totalTime);

    otherStations.forEach(([name, route]) => {
      sortedRoutes.set(name, route);
    });

    let processedCount = 0;
    const totalStations = sortedRoutes.size;

    for (const [name, route] of sortedRoutes.entries()) {
      processedCount++;
      setLoadingProgress(`周辺駅を検索中... (${processedCount}/${totalStations})`);
      // ...
      const group = groupedStations.find(g => g.name === name);
      if (!group) continue;

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Find best station in group for lat/lng (usually the first one)
        const lat = group.stations.length > 0 ? group.stations[0].lat : 35.6812;
        const lng = group.stations.length > 0 ? group.stations[0].lng : 139.7671;

        const hotels = await searchHotels(lat, lng, selectedDate, checkOutDate, adultCount, roomCount);
        if (hotels.length === 0) {
          // 楽天APIで見つからなかった場合は結果に含めない
          // console.log(`No hotels found for ${name}`);
          continue;
        }

        // ヒットしたすべてのホテルごとに結果を作成する (各駅最大5件まで)
        const targetHotels = hotels.slice(0, 5);
        for (let i = 0; i < targetHotels.length; i++) {
          const h = targetHotels[i];
          const hotel = {
            ...h, // hotelName, price, hotelUrl, hotelImageUrl, reviewAverage
            stationId: route.stationId
          };

          let icFare = 200;
          let ticketFare = 200;

          if (name === target.name) {
            icFare = 0;
            ticketFare = 0;
          } else {
            const fareData = faresMap.get(route.stationId);
            icFare = fareData ? fareData.icFare : 200;
            ticketFare = fareData ? fareData.ticketFare : 200;
          }

          // const timeCost = route.totalTime * VALUE_OF_TIME_PER_MINUTE; // Removed
          // Total Cost = Hotel Price (Total for stay) + Transport (Round trip * Adult Count * Days(Nights))
          // ユーザー要望: 泊数分だけ往復料金を加算する (通勤利用などを想定)
          const totalCost = hotel.price + (icFare * 2 * adultCount * diff);

          let trainSchedule: FirstLastTrainInfo | undefined;

          // 直通（乗り換えなし）の場合のみ、終電・始発情報を取得
          if (route.transfers === 0 && route.lines.length > 0) {
            const lineId = route.lines[0];
            const line = METRO_LINES.find(l => l.id === lineId);
            const targetStation = target.stations.find(s => s.lineId === lineId);

            if (line && targetStation) {
              // 駅の順序を取得して方向を判定
              // Note: getLineStations is cached so this is efficient
              const response = await odpt.getLineStations(line);
              const stations = response.stations;
              const hotelIndex = stations.findIndex(s => s.id === route.stationId);
              const targetIndex = stations.findIndex(s => s.id === targetStation.id);

              if (hotelIndex !== -1 && targetIndex !== -1) {
                let dirToHotel = '';
                let dirToDest = '';

                // indexが小さい方が「路線図の左側/上側」、大きい方が「路線図の右側/下側」
                // directionAsc: indexが増える方向 (例: 荻窪 -> 池袋)
                // directionDesc: indexが減る方向 (例: 池袋 -> 荻窪)

                if (hotelIndex < targetIndex) {
                  // Hotel < Target. 
                  // Hotel -> Target is Ascending (Target is "after" Hotel)
                  // Target -> Hotel is Descending (Hotel is "before" Target)
                  dirToDest = line.directionAsc;
                  dirToHotel = line.directionDesc;
                } else {
                  // Hotel > Target
                  // Hotel -> Target is Descending
                  // Target -> Hotel is Ascending
                  dirToDest = line.directionDesc;
                  dirToHotel = line.directionAsc;
                }

                if (dirToHotel && dirToDest) {
                  trainSchedule = await getFirstLastTrains(
                    targetStation.id,
                    route.stationId,
                    dirToHotel,
                    dirToDest,
                    new Date(selectedDate),
                    route.totalTime
                  );
                }
              }
            }
          }

          tempResults.push({
            id: `${route.stationId}_${i}`, // ユニークIDにするためにインデックス不可
            name: name,
            romaji: '',
            kana: '',
            lat: 0,
            lng: 0,
            stationCountFromShinjuku: 0,
            hotel,
            transportCost: icFare,
            icFare,
            ticketFare,
            trainTime: route.totalTime,
            walkTime: 0,
            transfers: route.transfers,
            lines: route.lines,
            totalCost,
            trainSchedule,
            numberOfStops: route.numberOfStops
          });
        }

        // インクリメンタル表示更新
        const destResult = tempResults.find(r => r.name === target.name);
        if (destResult) {
          tempResults.forEach(r => r.savings = destResult.totalCost - r.totalCost);
        }
        setResults([...tempResults].sort((a, b) => a.totalCost - b.totalCost));

      } catch (e) {
        // console.error(`Error fetching hotels for ${name}`, e);
        // エラー時もスキップ
        continue;
      }
    }

    // 目的地（ターゲット駅）のコストを探す
    const destinationResult = tempResults.find(r => r.name === target.name);
    const destinationCost = destinationResult ? destinationResult.totalCost : undefined;

    // お得額 (savings) を計算: 目的地コスト - 現在地コスト
    // 目的地自身や、目的地より高い場所はマイナスになる（「割高」）
    if (destinationCost !== undefined) {
      tempResults.forEach(r => {
        r.savings = destinationCost - r.totalCost;
      });
    }

    // コストが安い順にソート (Total Score = Total Cost now)
    tempResults.sort((a, b) => a.totalCost - b.totalCost);
    setResults(tempResults);
    setLoading(false);
  };

  // validation
  const isSearchable = isNetworkLoaded && (!!selectedStation || groupedStations.some(s => s.name === stationInput));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ... header ... */}
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 sm:gap-0">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">東京メトロ沿線ホテル検索</h1>
          </div>
          <div className="text-[10px] text-blue-200 text-center sm:text-right space-y-1">
            <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-white block transition-colors">
              Supported by Rakuten Developers
            </a>
            <p className="leading-tight">
              公共交通オープンデータセンター<br />のデータを利用しています
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {!isNetworkLoaded ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">ネットワークデータを構築中...</p>
            <p className="text-xs text-gray-400 mt-2">初回のみ数秒かかります</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-md p-5 mb-6">

              {/* Inputs */}
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">目的地</label>
                  <input
                    type="text"
                    value={stationInput}
                    onChange={(e) => {
                      setStationInput(e.target.value);
                      setShowSuggestions(true);
                      const match = groupedStations.find(s => s.name === e.target.value);
                      if (match) setSelectedStation(match);
                      else setSelectedStation(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="駅名を入力 (例: 新宿)"
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3"
                    disabled={loading}
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((station) => (
                        <button
                          key={station.name}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleStationSelect(station);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="font-medium">{station.name}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {station.stations.map(s => (
                              <span key={s.id} className="text-xs px-2 py-0.5 rounded text-white" style={{ backgroundColor: getLineColor(s.lineId) }}>
                                {s.lineName}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">宿泊日程</label>
                    <DateRangePicker
                      checkInDate={selectedDate}
                      checkOutDate={checkOutDate}
                      onDateChange={(checkIn, checkOut) => {
                        setSelectedDate(checkIn);
                        setCheckOutDate(checkOut);
                      }}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">人数 (大人)</label>
                    <select
                      value={adultCount}
                      onChange={(e) => setAdultCount(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      disabled={loading}
                    >
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}名</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">部屋数</label>
                    <select
                      value={roomCount}
                      onChange={(e) => setRoomCount(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                      disabled={loading}
                    >
                      {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num}室</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              <div className="mt-6">
                <button
                  onClick={handleSearch}
                  disabled={loading || !isSearchable}
                  className={`w-full px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all 
                    ${loading || !isSearchable
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>{loadingProgress || 'ホテル検索中...'}</span>
                    </div>
                  ) : '検索開始'}
                </button>
              </div>
            </div >

            <div className="space-y-4">
              {results.length > 0 && (
                <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">
                  検索結果 <span className="text-sm font-normal text-gray-500 ml-2">{results.length}件</span>
                </h2>
              )}
              {(() => {
                const minPrice = results.length > 0
                  ? Math.min(...results.map(r => r.totalCost))
                  : Infinity;

                return results.map((result, index) => {
                  const price = result.totalCost;
                  const isCheapest = price === minPrice;
                  const isOptimal = index === 0;

                  // 代表路線の色を使用
                  const mainLineId = result.lines && result.lines.length > 0 ? result.lines[0] : undefined;
                  const lineColor = getLineColor(mainLineId);

                  return (
                    <ResultCard
                      key={result.id}
                      result={result}
                      rank={index + 1}
                      lineColor={lineColor}
                      trainSchedule={result.trainSchedule}
                      selectedDate={searchedParams.selectedDate}
                      isCheapest={isCheapest}
                      isOptimal={isOptimal}
                      ticketFare={result.ticketFare}
                      numberOfStops={result.numberOfStops}
                      adultCount={searchedParams.adultCount}
                      nightCount={searchedParams.nightCount}
                      roomCount={searchedParams.roomCount}
                    />
                  );
                });
              })()}
            </div>
            {
              hasSearched && results.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl shadow-md">
                  <p className="text-gray-500 font-bold mb-2">検索結果が見つかりませんでした</p>
                  <p className="text-sm text-gray-400">
                    日付や場所を変えて再度お試しください。
                  </p>
                </div>
              )
            }
          </>
        )}
      </main >
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 focus:outline-none"
          aria-label="ページトップへ戻る"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div >
  );
};

export default App;
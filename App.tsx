import React, { useState, useEffect, useMemo } from 'react';
import * as odpt from './services/odptService';
import { searchHotels } from './services/rakutenService';
import { getFaresFromStation } from './services/fareService';
import { getFirstLastTrains } from './services/travelTimeService';
import { initializeNetwork, findRoutesToDestination, isNetworkInitialized, RouteResult } from './services/networkService';
import { getWalkingTimeToStation } from './services/walkingService';
import { GroupedStation, ExtendedResult } from './types';
import { METRO_LINES } from './constants';
import { calculateAndSortResults } from './utils/sort';

import { Header } from './components/Layout/Header';
import { ScrollToTopButton } from './components/Layout/ScrollToTopButton';
import { SearchForm } from './components/Search/SearchForm';
import { ResultList } from './components/Result/ResultList';

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

  // Search parameters snapshot
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
  const [sortMode, setSortMode] = useState<'price' | 'review' | 'cospa'>('cospa');

  // Suggestions logic
  const suggestions = useMemo(() => {
    if (!stationInput.trim()) return groupedStations;
    const query = stationInput.toLowerCase();
    return groupedStations.filter(s =>
      s.name.includes(stationInput) ||
      s.romaji.toLowerCase().includes(query) ||
      (s.kana && s.kana.includes(query))
    ).slice(0, 8);
  }, [stationInput, groupedStations]);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      const stations = await odpt.getAllGroupedStations();
      setGroupedStations(stations);
      await initializeNetwork();
      setIsNetworkLoaded(true);
    };
    init();
  }, []);

  // Set default selection
  useEffect(() => {
    if (groupedStations.length > 0 && !selectedStation && stationInput === '銀座') {
      const match = groupedStations.find(s => s.name === '銀座');
      if (match) setSelectedStation(match);
    }
  }, [groupedStations]);

  // Re-sort when sortMode changes
  useEffect(() => {
    if (results.length === 0) return;
    // Use helper utility
    // Need target station name to identify baseline/destination
    // Assuming stationInput is the target name (as per original logic logic: const destHotels = sorted.filter(r => r.name === stationInput);)
    const sorted = calculateAndSortResults(results, sortMode, stationInput);
    setResults(sorted);
  }, [sortMode]);


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
    setLoadingProgress('検索準備中...');

    // Calculate nights
    const d1 = new Date(selectedDate);
    const d2 = new Date(checkOutDate);
    const diff = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

    setSearchedParams({ adultCount, nightCount: diff, roomCount, selectedDate });
    setResults([]);
    setHasSearched(true);

    // 1. Route Calculation
    const routeResults = findRoutesToDestination(target.name, 0);

    // 2. Fares
    const representativeId = target.stations[0].id;
    let faresMap;
    try {
      faresMap = await getFaresFromStation(representativeId);
    } catch (e) {
      faresMap = new Map();
    }

    const tempResults: ExtendedResult[] = [];

    // Filter best routes by name
    const bestRoutesByName = new Map<string, RouteResult>();
    for (const [id, route] of routeResults.entries()) {
      const stationName = groupedStations.find(g => g.stations.some(s => s.id === id))?.name;
      if (!stationName) continue;

      if (!bestRoutesByName.has(stationName) || bestRoutesByName.get(stationName)!.totalTime > route.totalTime) {
        bestRoutesByName.set(stationName, route);
      }
    }

    // Sort routes for search order
    const sortedRoutes = new Map<string, RouteResult>();
    // Destination first
    if (bestRoutesByName.has(target.name)) {
      sortedRoutes.set(target.name, bestRoutesByName.get(target.name)!);
    }
    // Sort others
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

      const group = groupedStations.find(g => g.name === name);
      if (!group) continue;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const lat = group.stations.length > 0 ? group.stations[0].lat : 35.6812;
        const lng = group.stations.length > 0 ? group.stations[0].lng : 139.7671;

        const hotels = await searchHotels(lat, lng, selectedDate, checkOutDate, adultCount, roomCount);
        if (hotels.length === 0) continue;

        const targetHotels = sortMode === 'review' ? hotels : hotels.slice(0, 5);
        for (let i = 0; i < targetHotels.length; i++) {
          const h = targetHotels[i];
          const hotel = {
            ...h,
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

          const totalCost = hotel.price + (icFare * 2 * adultCount * diff);
          let trainSchedule;

          // Train Schedule Logic
          if (route.transfers === 0 && route.lines.length > 0) {
            const lineId = route.lines[0];
            const line = METRO_LINES.find(l => l.id === lineId);
            const targetStation = target.stations.find(s => s.lineId === lineId);
            if (line && targetStation) {
              const response = await odpt.getLineStations(line);
              const stations = response.stations;
              const hotelIndex = stations.findIndex(s => s.id === route.stationId);
              const targetIndex = stations.findIndex(s => s.id === targetStation.id);

              if (hotelIndex !== -1 && targetIndex !== -1) {
                let dirToHotel = '';
                let dirToDest = '';
                if (hotelIndex < targetIndex) {
                  dirToDest = line.directionAsc;
                  dirToHotel = line.directionDesc;
                } else {
                  dirToDest = line.directionDesc;
                  dirToHotel = line.directionAsc;
                }
                if (dirToHotel && dirToDest) {
                  trainSchedule = await getFirstLastTrains(
                    targetStation.id, route.stationId, dirToHotel, dirToDest,
                    new Date(selectedDate), route.totalTime
                  );
                }
              }
            }
          }

          let walkTime = 0;
          if (h.hotelLat && h.hotelLng && lat && lng) {
            const walkResult = await getWalkingTimeToStation(h.hotelLat, h.hotelLng, lat, lng);
            walkTime = walkResult || 0;
          }

          tempResults.push({
            id: `${route.stationId}_${i}`,
            name: name,
            romaji: '',
            kana: '',
            lat: h.hotelLat || 0,
            lng: h.hotelLng || 0,
            stationCountFromShinjuku: 0,
            hotel,
            transportCost: icFare,
            icFare,
            ticketFare,
            trainTime: route.totalTime,
            walkTime,
            transfers: route.transfers,
            lines: route.lines,
            totalCost,
            trainSchedule,
            numberOfStops: route.numberOfStops
          });
        }

        // Incremental Update
        // Use utility to sort and calculate scores
        const sorted = calculateAndSortResults(tempResults, sortMode, target.name);
        setResults(sorted);

      } catch (e) {
        continue;
      }
    }

    // Final update (usually redundant due to incremental, but ensures consistency)
    const finalSorted = calculateAndSortResults(tempResults, sortMode, target.name);
    setResults(finalSorted);
    setLoading(false);
    setLoadingProgress('');
  };

  const isSearchable = isNetworkLoaded && (!!selectedStation || groupedStations.some(s => s.name === stationInput));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-3xl mx-auto p-4">
        {!isNetworkLoaded ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">路線データを取得中...</p>
          </div>
        ) : (
          <>
            <SearchForm
              stationInput={stationInput}
              setStationInput={setStationInput}
              groupedStations={groupedStations}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              handleStationSelect={handleStationSelect}
              suggestions={suggestions}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              checkOutDate={checkOutDate}
              setCheckOutDate={setCheckOutDate}
              adultCount={adultCount}
              setAdultCount={setAdultCount}
              roomCount={roomCount}
              setRoomCount={setRoomCount}
              loading={loading}
              isSearchable={isSearchable}
              handleSearch={handleSearch}
              loadingProgress={loadingProgress}
            />

            <ResultList
              results={results}
              sortMode={sortMode}
              setSortMode={setSortMode}
              searchedParams={searchedParams}
            />

            {hasSearched && results.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <p className="text-gray-500 font-bold mb-2">検索結果が見つかりませんでした</p>
                <p className="text-sm text-gray-400">
                  日付や場所を変えて再度お試しください。
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <ScrollToTopButton />
    </div>
  );
};

export default App;
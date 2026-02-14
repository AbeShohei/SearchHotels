import { useState, useEffect, useCallback, useRef } from 'react';
import * as odpt from '../services/odptService';
import { searchHotels } from '../services/rakutenService';
import { getFaresFromStation } from '../services/fareService';
import { getFirstLastTrains } from '../services/travelTimeService';
import { initializeNetwork, findRoutesToDestination, RouteResult } from '../services/networkService';
import { getWalkingTimeToStation } from '../services/walkingService';
import { GroupedStation, ExtendedResult } from '../types';
import { METRO_LINES } from '../constants';
import { calculateAndSortResults } from '../utils/sort';
import { SortMode } from '../components/Result/SortTabs';

interface SearchParams {
    adultCount: number;
    nightCount: number;
    roomCount: number;
    selectedDate: string;
}

interface UseHotelSearchResult {
    // Station data
    groupedStations: GroupedStation[];
    isNetworkLoaded: boolean;

    // Search state
    loading: boolean;
    loadingProgress: string;
    progressPercent: number;
    results: ExtendedResult[];
    hasSearched: boolean;
    searchedParams: SearchParams;

    // Sort state
    sortMode: SortMode;
    setSortMode: (mode: SortMode) => void;

    // Toast state
    showToast: boolean;
    toastMessage: string;
    setShowToast: (show: boolean) => void;

    // Actions
    handleSearch: (
        target: GroupedStation,
        selectedDate: string,
        checkOutDate: string,
        adultCount: number,
        roomCount: number
    ) => Promise<void>;
}

/**
 * Custom hook for hotel search functionality.
 * Encapsulates all search state, network initialization, and search logic.
 */
export const useHotelSearch = (): UseHotelSearchResult => {
    // Station data
    const [groupedStations, setGroupedStations] = useState<GroupedStation[]>([]);
    const [isNetworkLoaded, setIsNetworkLoaded] = useState(false);

    // Search state
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [results, setResults] = useState<ExtendedResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchedParams, setSearchedParams] = useState<SearchParams>({
        adultCount: 2,
        nightCount: 1,
        roomCount: 1,
        selectedDate: new Date().toISOString().split('T')[0]
    });

    // Sort state
    const [sortMode, setSortMode] = useState<SortMode>('price');
    const sortModeRef = useRef<SortMode>(sortMode); // Ref for real-time access in async loops
    const [targetStationName, setTargetStationName] = useState<string>('');
    const targetStationRef = useRef<string>(''); // Ref for real-time access

    // Toast state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Initialize network and load stations (from static JSON or API fallback)
    useEffect(() => {
        const init = async () => {
            // Try static data first, fallback to API
            const { getAllGroupedStationsFromStatic } = await import('../services/odptService');
            const { initializeNetworkFromStatic } = await import('../services/networkService');

            const stations = await getAllGroupedStationsFromStatic();
            setGroupedStations(stations);
            await initializeNetworkFromStatic();
            setIsNetworkLoaded(true);
        };
        init();
    }, []);

    // Re-sort when sortMode changes (uses stored targetStationName)
    useEffect(() => {
        sortModeRef.current = sortMode; // Keep ref in sync
        if (results.length === 0 || !targetStationName) return;
        const sorted = calculateAndSortResults(
            results,
            sortMode,
            targetStationName,
            searchedParams.adultCount,
            searchedParams.nightCount
        );
        setResults(sorted);
    }, [sortMode]);

    const handleSearch = useCallback(async (
        target: GroupedStation,
        selectedDate: string,
        checkOutDate: string,
        adultCount: number,
        roomCount: number
    ) => {
        setLoading(true);
        setLoadingProgress('検索準備中...');
        setTargetStationName(target.name); // Store destination for sort mode changes

        // Calculate nights
        const d1 = new Date(selectedDate);
        const d2 = new Date(checkOutDate);
        const diff = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

        setSearchedParams({ adultCount, nightCount: diff, roomCount, selectedDate });
        setResults([]);
        setHasSearched(true);
        setProgressPercent(0);

        // Route Calculation
        const routeResults = findRoutesToDestination(target.name, 0);

        // Fares
        const representativeId = target.stations[0].id;
        let faresMap: Map<string, { icFare: number; ticketFare: number }>;
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
        if (bestRoutesByName.has(target.name)) {
            sortedRoutes.set(target.name, bestRoutesByName.get(target.name)!);
        }
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
            const percent = Math.round((processedCount / totalStations) * 100);
            setProgressPercent(percent);
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

                const targetHotels = hotels; // 全モードで全件表示

                // 運賃計算（駅ごとに1回）
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

                // 電車スケジュール取得（駅ごとに1回だけ - 並列化のため事前に取得）
                let trainSchedule;
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

                // 徒歩時間を計算（バッチ処理で並列数を制限）
                const walkTimes: (number | null)[] = [];
                const BATCH_SIZE = 3; // 同時に3件まで

                for (let i = 0; i < targetHotels.length; i += BATCH_SIZE) {
                    const batch = targetHotels.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(h => {
                        if (h.hotelLat && h.hotelLng && lat && lng) {
                            return getWalkingTimeToStation(h.hotelLat, h.hotelLng, lat, lng)
                                .catch(() => {
                                    // APIエラー時は距離ベースで推定（80m/分で計算）
                                    const dx = (h.hotelLng - lng) * 91000; // 経度差→メートル
                                    const dy = (h.hotelLat - lat) * 111000; // 緯度差→メートル
                                    const distance = Math.sqrt(dx * dx + dy * dy);
                                    return Math.ceil(distance / 80);
                                });
                        }
                        return Promise.resolve(0);
                    });
                    const batchResults = await Promise.all(batchPromises);
                    walkTimes.push(...batchResults);
                }

                // 結果をまとめて追加
                targetHotels.forEach((h, i) => {
                    const hotel = { ...h, stationId: route.stationId };
                    const totalCost = hotel.price + (icFare * 2 * adultCount * diff);
                    const walkTime = walkTimes[i] || 0;

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
                });

                // Incremental Update - use ref for current sort mode
                const sorted = calculateAndSortResults(tempResults, sortModeRef.current, target.name, adultCount, diff);
                setResults(sorted);

            } catch (e) {
                continue;
            }
        }

        // Final update - use ref for current sort mode
        // 同じホテルの場合、所要時間が最短のものと総コストが最安のものを残す
        const shortestTimeMap = new Map<string, typeof tempResults[0]>();
        const lowestCostMap = new Map<string, typeof tempResults[0]>();

        for (const result of tempResults) {
            const hotelName = result.hotel.hotelName;
            const totalTravelTime = result.trainTime + result.walkTime;

            // 所要時間が最短のもの
            const existingTime = shortestTimeMap.get(hotelName);
            if (!existingTime || (existingTime.trainTime + existingTime.walkTime) > totalTravelTime) {
                shortestTimeMap.set(hotelName, result);
            }

            // 総コストが最安のもの
            const existingCost = lowestCostMap.get(hotelName);
            if (!existingCost || existingCost.totalCost > result.totalCost) {
                lowestCostMap.set(hotelName, result);
            }
        }

        // 重複を避けてマージ（ID が異なる場合のみ両方追加）
        const deduplicatedResults: typeof tempResults = [];
        const addedIds = new Set<string>();

        for (const [hotelName, shortestResult] of shortestTimeMap) {
            deduplicatedResults.push(shortestResult);
            addedIds.add(shortestResult.id);

            const lowestCostResult = lowestCostMap.get(hotelName);
            if (lowestCostResult && !addedIds.has(lowestCostResult.id)) {
                deduplicatedResults.push(lowestCostResult);
                addedIds.add(lowestCostResult.id);
            }
        }

        const finalSorted = calculateAndSortResults(deduplicatedResults, sortModeRef.current, target.name, adultCount, diff);
        setResults(finalSorted);
        setLoading(false);
        setLoadingProgress('');
        setProgressPercent(100);

        // Show completion toast
        setToastMessage(`検索完了！ ${finalSorted.length}件のホテルが見つかりました`);
        setShowToast(true);
    }, [groupedStations, sortMode]);

    return {
        groupedStations,
        isNetworkLoaded,
        loading,
        loadingProgress,
        progressPercent,
        results,
        hasSearched,
        searchedParams,
        sortMode,
        setSortMode,
        showToast,
        toastMessage,
        setShowToast,
        handleSearch
    };
};

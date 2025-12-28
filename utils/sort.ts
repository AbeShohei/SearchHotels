import { ExtendedResult } from '../types';

export type SortMode = 'price' | 'review' | 'cospa';

/**
 * Find baseline result with fallback logic:
 * 1. First, check destination station
 * 2. If no hotels, check nearest station by trainTime
 * 3. Repeat until a station with hotels is found
 */
const findBaselineResult = (
    results: ExtendedResult[],
    targetStationName: string
): ExtendedResult | undefined => {
    if (results.length === 0) return undefined;

    // Group results by station name
    const stationGroups = new Map<string, ExtendedResult[]>();
    results.forEach(r => {
        const existing = stationGroups.get(r.name) || [];
        existing.push(r);
        stationGroups.set(r.name, existing);
    });

    // Check destination station first
    const destHotels = stationGroups.get(targetStationName);
    if (destHotels && destHotels.length > 0) {
        // Return cheapest at destination
        return destHotels.reduce((min, h) => h.totalCost < min.totalCost ? h : min, destHotels[0]);
    }

    // Get unique station names sorted by trainTime (nearest first)
    const stationsByDistance = Array.from(stationGroups.entries())
        .map(([name, hotels]) => ({
            name,
            hotels,
            minTrainTime: Math.min(...hotels.map(h => h.trainTime))
        }))
        .sort((a, b) => a.minTrainTime - b.minTrainTime);

    // Find first station with hotels
    for (const station of stationsByDistance) {
        if (station.hotels.length > 0) {
            return station.hotels.reduce((min, h) => h.totalCost < min.totalCost ? h : min, station.hotels[0]);
        }
    }

    return undefined;
};

export const calculateAndSortResults = (
    results: ExtendedResult[],
    mode: SortMode,
    targetStationName: string
): ExtendedResult[] => {
    // Deep copy to ensure independence between sort modes
    // Reset all calculated fields including isBaseline
    const sorted = results.map(r => ({
        ...r,
        savings: undefined as number | undefined,
        cospaIndex: 0,
        savedMoney: 0,
        extraTime: 0,
        isBaseline: false
    }));

    if (sorted.length === 0) return sorted;

    // Find baseline first (same logic for all modes)
    const baselineResult = findBaselineResult(sorted, targetStationName);
    const baselineId = baselineResult?.id;

    if (mode === 'review') {
        // レビュー順: レビュー評価の高い順（降順）
        sorted.sort((a, b) => (b.hotel.reviewAverage || 0) - (a.hotel.reviewAverage || 0));

        // Find baseline's review for comparison
        const bestReview = baselineResult?.hotel.reviewAverage || sorted[0]?.hotel.reviewAverage || 0;

        sorted.forEach(r => {
            r.savings = ((r.hotel.reviewAverage || 0) - bestReview) * 100;
            // Mark only the actual baseline hotel
            r.isBaseline = r.id === baselineId;
        });

        return sorted;

    } else if (mode === 'cospa') {
        // コスパ順: 基準ホテルを探す（目的地→隣駅の順）
        if (baselineResult) {
            // 基準ホテルを再選定：同じ駅で最も所要時間が短いホテルを選ぶ
            const sameStationHotels = sorted.filter(r => r.name === baselineResult.name);
            const baselineHotel = sameStationHotels.reduce((min, h) => {
                const minTime = min.trainTime + min.walkTime;
                const hTime = h.trainTime + h.walkTime;
                if (hTime < minTime) return h;
                if (hTime === minTime && h.hotel.price < min.hotel.price) return h;
                return min;
            }, sameStationHotels[0]);

            const cospaBaselineId = baselineHotel.id;
            const baselineCost = baselineHotel.hotel.price;
            const baselineTravelTime = baselineHotel.trainTime + baselineHotel.walkTime;

            sorted.forEach(r => {
                let totalTravelTime = r.trainTime + r.walkTime;
                const hotelCostWithFare = r.hotel.price + (r.icFare * 2);

                if (r.id !== cospaBaselineId && totalTravelTime === baselineTravelTime) {
                    totalTravelTime += 1;
                }

                r.savedMoney = baselineCost - hotelCostWithFare;
                r.extraTime = totalTravelTime - baselineTravelTime;

                if (r.extraTime > 0) {
                    r.cospaIndex = Math.round(r.savedMoney / r.extraTime);
                } else {
                    r.cospaIndex = 0;
                }

                // Mark only the actual baseline hotel
                r.isBaseline = r.id === cospaBaselineId;
            });

            sorted.sort((a, b) => {
                const idxA = a.cospaIndex ?? -Infinity;
                const idxB = b.cospaIndex ?? -Infinity;
                if (idxA === idxB) {
                    if (idxA === Infinity && idxB === Infinity) {
                        return (b.savedMoney ?? 0) - (a.savedMoney ?? 0);
                    }
                    return 0;
                }
                if (idxA === Infinity) return -1;
                if (idxB === Infinity) return 1;
                return idxB - idxA;
            });
        } else {
            // Fallback to price sort
            sorted.sort((a, b) => a.totalCost - b.totalCost);
        }
        return sorted;

    } else {
        // 料金順: 料金の安い順（昇順）
        sorted.sort((a, b) => a.totalCost - b.totalCost);

        // Calculate savings and mark baseline
        if (baselineResult) {
            sorted.forEach(r => {
                r.savings = baselineResult.totalCost - r.totalCost;
                // Mark only the actual baseline hotel
                r.isBaseline = r.id === baselineId;
            });
        }

        return sorted;
    }
};

/**
 * Process results with baseline comparison but WITHOUT sorting.
 * Used during incremental search updates to show processed data while maintaining insertion order.
 */
export const processResultsWithoutSort = (
    results: ExtendedResult[],
    mode: SortMode,
    targetStationName: string
): ExtendedResult[] => {
    // Deep copy and reset calculated fields
    const processed = results.map(r => ({
        ...r,
        savings: undefined as number | undefined,
        cospaIndex: 0,
        savedMoney: 0,
        extraTime: 0,
        isBaseline: false
    }));

    if (processed.length === 0) return processed;

    // Find baseline (same logic as calculateAndSortResults)
    const baselineResult = findBaselineResult(processed, targetStationName);
    const baselineId = baselineResult?.id;

    if (mode === 'review') {
        const bestReview = baselineResult?.hotel.reviewAverage || processed[0]?.hotel.reviewAverage || 0;
        processed.forEach(r => {
            r.savings = ((r.hotel.reviewAverage || 0) - bestReview) * 100;
            r.isBaseline = r.id === baselineId;
        });
    } else if (mode === 'cospa') {
        if (baselineResult) {
            const sameStationHotels = processed.filter(r => r.name === baselineResult.name);
            const baselineHotel = sameStationHotels.reduce((min, h) => {
                const minTime = min.trainTime + min.walkTime;
                const hTime = h.trainTime + h.walkTime;
                if (hTime < minTime) return h;
                if (hTime === minTime && h.hotel.price < min.hotel.price) return h;
                return min;
            }, sameStationHotels[0]);

            const cospaBaselineId = baselineHotel.id;
            const baselineCost = baselineHotel.hotel.price;
            const baselineTravelTime = baselineHotel.trainTime + baselineHotel.walkTime;

            processed.forEach(r => {
                let totalTravelTime = r.trainTime + r.walkTime;
                const hotelCostWithFare = r.hotel.price + (r.icFare * 2);

                if (r.id !== cospaBaselineId && totalTravelTime === baselineTravelTime) {
                    totalTravelTime += 1;
                }

                r.savedMoney = baselineCost - hotelCostWithFare;
                r.extraTime = totalTravelTime - baselineTravelTime;

                if (r.extraTime > 0) {
                    r.cospaIndex = Math.round(r.savedMoney / r.extraTime);
                } else {
                    r.cospaIndex = 0;
                }

                r.isBaseline = r.id === cospaBaselineId;
            });
        }
    } else {
        // price mode
        if (baselineResult) {
            processed.forEach(r => {
                r.savings = baselineResult.totalCost - r.totalCost;
                r.isBaseline = r.id === baselineId;
            });
        }
    }

    // Return WITHOUT sorting - maintains insertion order
    return processed;
};

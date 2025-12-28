import { ExtendedResult } from '../types';

export type SortMode = 'price' | 'review' | 'cospa';

/**
 * Find baseline result with fallback logic:
 * 1. First, check destination station
 * 2. If no hotels, check nearest station by trainTime
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

/**
 * Core processing logic - calculates savings, cospaIndex, and marks baseline.
 * Shared by both calculateAndSortResults and processResultsWithoutSort.
 */
const processResultsCore = (
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

    // Find baseline
    const baselineResult = findBaselineResult(processed, targetStationName);
    const baselineId = baselineResult?.id;

    if (mode === 'review') {
        // Use baseline's review as the reference point
        const baselineReview = baselineResult?.hotel.reviewAverage || 0;
        processed.forEach(r => {
            // Calculate difference from baseline (positive = better than baseline)
            r.savings = (r.hotel.reviewAverage || 0) - baselineReview;
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
                r.cospaIndex = r.extraTime > 0 ? Math.round(r.savedMoney / r.extraTime) : 0;
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

    return processed;
};

/**
 * Sort results based on mode
 */
const sortResults = (results: ExtendedResult[], mode: SortMode): ExtendedResult[] => {
    const sorted = [...results];

    if (mode === 'review') {
        sorted.sort((a, b) => (b.hotel.reviewAverage || 0) - (a.hotel.reviewAverage || 0));
    } else if (mode === 'cospa') {
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
        sorted.sort((a, b) => a.totalCost - b.totalCost);
    }

    return sorted;
};

/**
 * Process results with baseline comparison AND sorting.
 * Used for final results and sort mode changes.
 */
export const calculateAndSortResults = (
    results: ExtendedResult[],
    mode: SortMode,
    targetStationName: string
): ExtendedResult[] => {
    const processed = processResultsCore(results, mode, targetStationName);
    return sortResults(processed, mode);
};

/**
 * Process results with baseline comparison but WITHOUT sorting.
 * Used during incremental search updates.
 */
export const processResultsWithoutSort = (
    results: ExtendedResult[],
    mode: SortMode,
    targetStationName: string
): ExtendedResult[] => {
    return processResultsCore(results, mode, targetStationName);
};

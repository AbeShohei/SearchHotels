import React, { useMemo } from 'react';
import { ExtendedResult } from '../../types';
import { ResultCard } from '../ResultCard';
import { SortTabs, SortMode } from './SortTabs';
import { getLineColor } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultListProps {
    results: ExtendedResult[];
    sortMode: SortMode;
    setSortMode: (mode: SortMode) => void;
    searchedParams: {
        adultCount: number;
        nightCount: number;
        roomCount: number;
        selectedDate: string;
    };
    loading?: boolean;
}

/**
 * Displays search results with sorting controls and tag badges.
 * Tags (cheapest, highest rated, optimal) only appear when loading is complete.
 */
export const ResultList: React.FC<ResultListProps> = ({
    results,
    sortMode,
    setSortMode,
    searchedParams,
    loading = false
}) => {
    // Memoized calculations for tag detection
    const minPrice = useMemo(() =>
        results.length > 0 ? Math.min(...results.map(r => r.totalCost)) : Infinity,
        [results]
    );

    const maxReview = useMemo(() =>
        results.length > 0 ? Math.max(...results.map(r => r.hotel.reviewAverage || 0)) : 0,
        [results]
    );

    const baselineResult = results.find(r => r.isBaseline);

    const scrollToBaseline = () => {
        if (baselineResult) {
            const el = document.getElementById(`hotel-${baselineResult.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (results.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Header with count and sort tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 mb-4 gap-3 sm:gap-0">
                <h2 className="text-lg font-bold text-gray-800">
                    検索結果 <span className="text-sm font-normal text-gray-500 ml-2">{results.length}件</span>
                </h2>
                <SortTabs sortMode={sortMode} setSortMode={setSortMode} />
            </div>

            {/* Jump to Baseline Button */}
            {baselineResult && (
                <div className="px-2 mb-2">
                    <motion.button
                        onClick={scrollToBaseline}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 neu-flat text-gray-600 rounded-xl font-bold hover:text-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <span>▼</span> 基準ホテルへジャンプ
                    </motion.button>
                </div>
            )}

            {/* Results List */}
            <AnimatePresence>
                {results.map((result, index) => {
                    const price = result.totalCost;
                    // Only show tags when search is complete (not loading)
                    const isCheapest = !loading && price === minPrice;
                    const isOptimal = !loading && sortMode === 'cospa' && index === 0;
                    const isHighestRated = !loading && (result.hotel.reviewAverage || 0) === maxReview && maxReview > 0;

                    const mainLineId = result.lines && result.lines.length > 0 ? result.lines[0] : undefined;
                    const lineColor = getLineColor(mainLineId);

                    return (
                        <motion.div
                            layout
                            id={`hotel-${result.id}`}
                            key={result.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ResultCard
                                result={result}
                                rank={index + 1}
                                lineColor={lineColor}
                                trainSchedule={result.trainSchedule}
                                selectedDate={searchedParams.selectedDate}
                                isCheapest={isCheapest}
                                isOptimal={isOptimal}
                                isHighestRated={isHighestRated}
                                ticketFare={result.ticketFare}
                                numberOfStops={result.numberOfStops}
                                adultCount={searchedParams.adultCount}
                                nightCount={searchedParams.nightCount}
                                roomCount={searchedParams.roomCount}
                                sortMode={sortMode}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

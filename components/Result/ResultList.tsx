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
    onlyHighRated?: boolean;
    setOnlyHighRated?: (val: boolean) => void;
    maxTimeFilter: number;
    setMaxTimeFilter: (val: number) => void;
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
    loading = false,
    onlyHighRated = false,
    setOnlyHighRated,
    maxTimeFilter,
    setMaxTimeFilter
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
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800">
                        検索結果 <span className="text-sm font-normal text-gray-500 ml-2">{results.length}件</span>
                    </h2>

                    {setOnlyHighRated && (
                        <button
                            onClick={() => setOnlyHighRated(!onlyHighRated)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${onlyHighRated
                                ? 'bg-yellow-50 text-yellow-600 border-yellow-200 shadow-sm ring-1 ring-yellow-100'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className={onlyHighRated ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                            <span>評価4.0以上</span>
                        </button>
                    )}
                </div>
                <SortTabs sortMode={sortMode} setSortMode={setSortMode} />
            </div>

            {/* Time Filter Slider */}
            <div className="px-2 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                            所要時間で絞り込み
                        </label>
                        <span className="text-sm font-bold text-blue-600">
                            {maxTimeFilter === 90 ? '制限なし' : `${maxTimeFilter}分以内`}
                        </span>
                    </div>
                    <div className="relative h-6 flex items-center">
                        {/* Track background */}
                        <div className="absolute w-full h-2 bg-gray-300 rounded-full" />
                        {/* Filled track */}
                        <div
                            className="absolute h-2 bg-blue-500 rounded-full transition-all duration-150"
                            style={{ width: `${((maxTimeFilter - 5) / (90 - 5)) * 100}%` }}
                        />
                        {/* Thumb */}
                        <div
                            className="absolute w-5 h-5 bg-blue-500 rounded-full shadow-md border-2 border-white transition-all duration-150 pointer-events-none"
                            style={{ left: `calc(${((maxTimeFilter - 5) / (90 - 5)) * 100}% - 10px)` }}
                        />
                        {/* Invisible input for interaction */}
                        <input
                            type="range"
                            min="5"
                            max="90"
                            step="5"
                            value={maxTimeFilter}
                            onChange={(e) => setMaxTimeFilter(Number(e.target.value))}
                            className="absolute w-full h-6 opacity-0 cursor-pointer z-10"
                        />
                    </div>
                    <div className="relative h-4 mt-2">
                        <span className="absolute left-0 text-xs text-gray-400 -translate-x-0">5分</span>
                        <span className="absolute text-xs text-gray-400 -translate-x-1/2" style={{ left: '29.4%' }}>30分</span>
                        <span className="absolute text-xs text-gray-400 -translate-x-1/2" style={{ left: '64.7%' }}>60分</span>
                        <span className="absolute right-0 text-xs text-gray-400 translate-x-0">制限なし</span>
                    </div>
                </div>
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

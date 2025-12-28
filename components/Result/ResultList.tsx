import React, { useMemo } from 'react';
import { ExtendedResult } from '../../types';
import { ResultCard } from '../ResultCard';
import { getLineColor } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultListProps {
    results: ExtendedResult[];
    sortMode: 'price' | 'review' | 'cospa';
    setSortMode: (mode: 'price' | 'review' | 'cospa') => void;
    searchedParams: {
        adultCount: number;
        nightCount: number;
        roomCount: number;
        selectedDate: string;
    };
    loading?: boolean;
}

export const ResultList: React.FC<ResultListProps> = ({ results, sortMode, setSortMode, searchedParams, loading = false }) => {
    const minPrice = useMemo(() =>
        results.length > 0 ? Math.min(...results.map(r => r.totalCost)) : Infinity,
        [results]);

    const maxReview = useMemo(() =>
        results.length > 0 ? Math.max(...results.map(r => r.hotel.reviewAverage || 0)) : 0,
        [results]);

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 mb-4 gap-3 sm:gap-0">
                <h2 className="text-lg font-bold text-gray-800">
                    検索結果 <span className="text-sm font-normal text-gray-500 ml-2">{results.length}件</span>
                </h2>
                <div className="flex w-full sm:w-auto p-1.5 neu-pressed rounded-xl relative isolate gap-2">
                    {(['price', 'review', 'cospa'] as const).map((mode) => {
                        const label = mode === 'price' ? '料金順' : mode === 'review' ? 'レビュー順' : 'タイパ順';
                        const activeColor = mode === 'price' ? 'text-blue-600' : mode === 'review' ? 'text-orange-600' : 'text-green-600';
                        const isActive = sortMode === mode;

                        return (
                            <motion.button
                                key={mode}
                                onClick={() => setSortMode(mode)}
                                whileTap={{ scale: 0.95 }}
                                className={`relative flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors z-10 ${isActive ? activeColor : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeSortTab"
                                        className="absolute inset-0 neu-flat-sm rounded-lg -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {label}
                            </motion.button>
                        );
                    })}
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

            <AnimatePresence>
                {results.map((result, index) => {
                    const price = result.totalCost;
                    // Only show tags when search is complete (not loading)
                    const isCheapest = !loading && price === minPrice;
                    const isOptimal = !loading && sortMode === 'cospa' && index === 0;
                    const isHighestRated = !loading && (result.hotel.reviewAverage || 0) === maxReview && maxReview > 0;

                    // 代表路線の色を使用
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

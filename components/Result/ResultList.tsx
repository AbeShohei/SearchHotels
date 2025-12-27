import React, { useMemo } from 'react';
import { ExtendedResult } from '../../types';
import { ResultCard } from '../ResultCard';
import { getLineColor } from '../../constants';

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
}

export const ResultList: React.FC<ResultListProps> = ({ results, sortMode, setSortMode, searchedParams }) => {
    const minPrice = useMemo(() =>
        results.length > 0 ? Math.min(...results.map(r => r.totalCost)) : Infinity,
        [results]);

    const maxReview = useMemo(() =>
        results.length > 0 ? Math.max(...results.map(r => r.hotel.reviewAverage || 0)) : 0,
        [results]);

    if (results.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 mb-4 gap-3 sm:gap-0">
                <h2 className="text-lg font-bold text-gray-800">
                    検索結果 <span className="text-sm font-normal text-gray-500 ml-2">{results.length}件</span>
                </h2>
                <div className="flex w-full sm:w-auto gap-1 bg-gray-100 rounded-lg p-1 justify-between sm:justify-start">
                    <button
                        onClick={() => setSortMode('price')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortMode === 'price'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        料金順
                    </button>
                    <button
                        onClick={() => setSortMode('review')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortMode === 'review'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        レビュー順
                    </button>
                    <button
                        onClick={() => setSortMode('cospa')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${sortMode === 'cospa'
                            ? 'bg-white text-green-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        コスパ順
                    </button>
                </div>
            </div>

            {results.map((result, index) => {
                const price = result.totalCost;
                const isCheapest = price === minPrice;
                const isOptimal = index === 0;
                const isHighestRated = (result.hotel.reviewAverage || 0) === maxReview && maxReview > 0;

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
                        isHighestRated={isHighestRated}
                        ticketFare={result.ticketFare}
                        numberOfStops={result.numberOfStops}
                        adultCount={searchedParams.adultCount}
                        nightCount={searchedParams.nightCount}
                        roomCount={searchedParams.roomCount}
                        sortMode={sortMode}
                    />
                );
            })}
        </div>
    );
};

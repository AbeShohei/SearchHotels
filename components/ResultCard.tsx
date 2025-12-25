import React from 'react';
import { ScoredResult } from '../types';

interface ResultCardProps {
  result: ScoredResult;
  rank: number;
  lineColor?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, rank, lineColor = '#3B82F6' }) => {
  const isBest = rank === 1;
  const hotelPlusFare = result.hotel.price + (result.icFare * 2);

  return (
    <div className={`relative p-6 rounded-xl border transition-all duration-300 ${isBest
        ? 'bg-white border-orange-400 shadow-lg scale-[1.02] z-10'
        : 'bg-white border-gray-200 hover:shadow-md'
      }`}>
      {isBest && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          最安・最適
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isBest ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
            }`}>
            #{rank}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{result.name} <span className="text-sm font-normal text-gray-500">({result.romaji})</span></h3>
            <p className="text-sm text-gray-500 truncate">{result.hotel.hotelName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {result.totalScore.toLocaleString()} <span className="text-sm font-normal text-gray-500">pt</span>
          </div>
          <p className="text-xs text-gray-400">総合スコア</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
        <div className="text-center border-r border-gray-200">
          <p className="text-gray-500 text-xs mb-1">宿泊費</p>
          <p className="font-semibold text-gray-700">¥{result.hotel.price.toLocaleString()}</p>
        </div>
        <div className="text-center border-r border-gray-200">
          <p className="text-gray-500 text-xs mb-1">往復運賃</p>
          <div className="flex justify-center gap-3">
            <div>
              <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">IC</span>
              <span className="font-semibold text-gray-700 ml-1">¥{(result.icFare * 2).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">切符</span>
              <span className="font-semibold text-gray-700 ml-1">¥{(result.ticketFare * 2).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">片道: ¥{result.icFare} / ¥{result.ticketFare}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">時間コスト</p>
          <p className="font-semibold text-gray-700">¥{result.timeCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Footer with travel info and total */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">移動:</span> 電車 {result.trainTime}分
        </div>
        <div className="text-right">
          <span className="text-gray-400">宿泊+往復運賃</span>
          <span className="font-bold text-lg text-gray-800 ml-2">¥{hotelPlusFare.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

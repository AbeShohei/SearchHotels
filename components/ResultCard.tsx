import React from 'react';
import { ScoredResult } from '../types';
import { FirstLastTrainInfo } from '../services/travelTimeService';

interface ResultCardProps {
  result: ScoredResult;
  rank: number;
  lineColor?: string;
  trainSchedule?: FirstLastTrainInfo;
  selectedDate?: string;
  isCheapest?: boolean;
  isOptimal?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  rank,
  lineColor = '#3B82F6',
  trainSchedule,
  selectedDate,
  isCheapest = false,
  isOptimal = false
}) => {
  const hotelPlusFare = result.hotel.price + (result.icFare * 2);

  const getNextDayStr = () => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const currentDayStr = selectedDate ? (() => {
    const d = new Date(selectedDate);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  })() : '';

  return (
    <div className={`relative p-6 rounded-xl border transition-all duration-300 ${isOptimal
      ? 'bg-white border-orange-400 shadow-lg scale-[1.02] z-10'
      : 'bg-white border-gray-200 hover:shadow-md'
      }`}>
      <div className="absolute -top-3 -right-3 flex gap-2">
        {isOptimal && (
          <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            最適
          </div>
        )}
        {isCheapest && (
          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            最安
          </div>
        )}
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isOptimal ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
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

      {/* Train schedule and travel time */}
      {/* Train schedule and travel time & Total Cost */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div className="flex-1 w-full text-xs text-gray-500">
          <div className="mb-1">
            <span className="font-medium text-gray-700">移動:</span>
            <span className="ml-1">{result.trainTime}分</span>
          </div>

          {/* First/Last train info */}
          {trainSchedule && (trainSchedule.lastTrain || trainSchedule.firstTrain) && (
            <div className="mt-2 text-xs space-y-2">
              {trainSchedule.lastTrain && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">終電</span>
                  <span className="text-gray-600">
                    {currentDayStr} {trainSchedule.lastTrain.departureTime}発
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-purple-700">
                    {trainSchedule.lastTrain.arrivalTime}着
                  </span>
                </div>
              )}
              {trainSchedule.firstTrain && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold border border-orange-200">始発</span>
                  <span className="text-gray-600">{getNextDayStr()}</span>
                  <span className="font-bold text-orange-700">
                    {trainSchedule.firstTrain.departureTime}発
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600">
                    {trainSchedule.firstTrain.arrivalTime}着
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-right min-w-[140px] bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-0.5">宿泊費 + 往復運賃</p>
          <div className="text-xl font-bold text-gray-800">
            ¥{hotelPlusFare.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

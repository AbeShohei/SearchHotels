import { METRO_LINES } from '../constants';
import { ScoredResult } from '../types';
import { FirstLastTrainInfo } from '../services/travelTimeService';

const lineMap = new Map<string, { name: string, color: string }>();
METRO_LINES.forEach(l => lineMap.set(l.id, { name: l.name, color: l.color }));

const getLineInfo = (lineId: string) => {
  return lineMap.get(lineId) || { name: '不明', color: '#cccccc' };
};

interface ResultCardProps {
  result: ScoredResult;
  rank: number;
  lineColor?: string;
  trainSchedule?: FirstLastTrainInfo;
  selectedDate: string;
  isCheapest: boolean;
  isOptimal: boolean;
  ticketFare?: number;
  numberOfStops?: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  rank,
  trainSchedule,
  selectedDate,
  isCheapest,
  isOptimal,
  ticketFare,
  numberOfStops
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

      {/* Badges */}
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

            <h3 className="text-xl font-bold text-gray-800">{result.name} {result.romaji && <span className="text-sm font-normal text-gray-500">({result.romaji})</span>}</h3>
            {result.hotel.hotelUrl ? (
              <a href={result.hotel.hotelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                {result.hotel.hotelName}
                {result.hotel.reviewAverage && <span className="ml-2 text-orange-500">★{result.hotel.reviewAverage}</span>}
              </a>
            ) : (
              <p className="text-sm text-gray-500 truncate">{result.hotel.hotelName}</p>
            )}
            {result.hotel.hotelImageUrl && (
              <img src={result.hotel.hotelImageUrl} alt={result.hotel.hotelName} className="mt-2 h-32 w-full object-cover rounded-md" />
            )}
          </div>
        </div>
        <div className="text-right">
          {result.savings !== undefined ? (
            <>
              {result.savings > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-500">
                    {result.savings.toLocaleString()} <span className="text-sm font-normal text-gray-500">円お得！</span>
                  </div>
                  <p className="text-xs text-gray-400">目的地より</p>
                </>
              ) : result.savings < 0 ? (
                <>
                  <div className="text-lg font-bold text-gray-500">
                    {Math.abs(result.savings).toLocaleString()} <span className="text-sm font-normal text-gray-500">円割高</span>
                  </div>
                  <p className="text-xs text-gray-400">目的地より</p>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-500">
                    基準地
                  </div>
                  <p className="text-xs text-gray-400">目的地</p>
                </>
              )}
            </>
          ) : (
            <div className="text-lg font-bold text-gray-400">
              -
            </div>
          )}
        </div>
      </div>

      {/* Route Info (Lines only, no transfer badge) */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex gap-1">
          {result.lines && result.lines.map((lineId, i) => {
            const info = getLineInfo(lineId);
            return (
              <span key={i} className="text-xs text-white px-2 py-0.5 rounded" style={{ backgroundColor: info.color }}>
                {info.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
        <div className="text-center border-r border-gray-200 flex flex-col justify-center">
          <p className="text-gray-500 text-xs mb-1">宿泊費</p>
          <div className="text-center">
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded block mb-0.5 w-fit mx-auto">1泊</span>
            <span className="font-bold text-lg text-gray-800">¥{result.hotel.price.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-center flex flex-col justify-center">
          <p className="text-gray-500 text-xs mb-1">往復運賃</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-center">
              <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded block mb-0.5 w-fit mx-auto">IC</span>
              <span className="font-bold text-lg text-gray-800">¥{(result.icFare * 2).toLocaleString()}</span>
            </div>
            {(ticketFare !== undefined) && (
              <div className="text-center pl-2 border-l border-gray-100">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded border border-gray-200 block mb-0.5 w-fit mx-auto">切符</span>
                <span className="font-bold text-lg text-gray-600">¥{(ticketFare * 2).toLocaleString()}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400">
            片道: IC ¥{result.icFare.toLocaleString()} {ticketFare !== undefined ? `/ 切符 ¥${ticketFare.toLocaleString()}` : ''}
          </p>
        </div>
      </div>

      {/* Train schedule and travel time & Total Cost */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div className="flex-1 w-full text-xs text-gray-500">
          <div className="mb-2">
            <span className="font-medium text-gray-700">移動:</span>
            <span className="ml-1">{result.trainTime}分</span>
            {numberOfStops !== undefined && (
              <span className="ml-2 text-gray-500 text-[10px]">
                ({numberOfStops}駅)
              </span>
            )}
          </div>

          {/* First/Last train info (Only for direct routes, exclude destination/0min) */}
          {result.transfers === 0 && result.trainTime > 0 && trainSchedule && (trainSchedule.lastTrain || trainSchedule.firstTrain) && (
            <div className="space-y-2">
              {trainSchedule.lastTrain && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">終電</span>
                  <span className="text-gray-600 font-medium">宿泊日 ({currentDayStr})</span>
                  <span className="font-bold text-purple-700 ml-1">
                    {trainSchedule.lastTrain.departureTime}発
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">
                    {trainSchedule.lastTrain.arrivalTime}着
                  </span>
                </div>
              )}
              {trainSchedule.firstTrain && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold border border-orange-200">始発</span>
                  <span className="text-gray-600 font-medium">翌日 ({getNextDayStr()})</span>
                  <span className="font-bold text-orange-700 ml-1">
                    {trainSchedule.firstTrain.departureTime}発
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">
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

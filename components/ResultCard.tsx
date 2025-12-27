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
  adultCount: number;
  nightCount: number;
  roomCount: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  rank,
  trainSchedule,
  selectedDate,
  isCheapest,
  isOptimal,
  ticketFare,
  numberOfStops,
  adultCount,
  nightCount,
  roomCount
}) => {
  // Total costs
  const totalHotelPrice = result.hotel.price;
  // Transport Cost = Round Trip * Adult Count * Night Count
  const totalIcFare = result.icFare * 2 * adultCount * nightCount;
  const totalCost = totalHotelPrice + totalIcFare;

  // Per person costs
  const pricePerPerson = Math.round(totalHotelPrice / adultCount);
  const farePerPerson = result.icFare * 2 * nightCount;
  const costPerPerson = pricePerPerson + farePerPerson;

  // Savings Logic
  // result.savings is Total Savings. We also want per-person savings.
  const totalSavings = result.savings !== undefined ? result.savings : undefined;
  const savingsPerPerson = totalSavings !== undefined ? Math.round(totalSavings / adultCount) : undefined;

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

      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-3">
        <div className="flex items-center space-x-3 w-full">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${isOptimal ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
            }`}>
            #{rank}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-gray-800 truncate">{result.name} {result.romaji && <span className="text-sm font-normal text-gray-500">({result.romaji})</span>}</h3>
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
      </div>

      {/* Mobile: Lines and Savings side-by-side */}
      <div className="flex flex-row justify-between items-end mb-4 gap-2">
        {/* Lines */}
        <div className="flex gap-1 flex-wrap content-end pb-1">
          {result.lines && result.lines.map((lineId, i) => {
            const info = getLineInfo(lineId);
            return (
              <span key={i} className="text-xs text-white px-2 py-0.5 rounded" style={{ backgroundColor: info.color }}>
                {info.name}
              </span>
            );
          })}
        </div>

        {/* Savings Info */}
        <div className="text-right shrink-0">
          {savingsPerPerson !== undefined ? (
            <>
              {totalSavings !== undefined && totalSavings > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-500 flex flex-col items-end leading-none">
                    <span>{totalSavings.toLocaleString()} <span className="text-sm font-normal text-gray-500">円</span></span>
                    <span className="text-xs text-red-500 font-bold block mt-0.5">お得！</span>
                    <span className="text-[10px] text-red-400 mt-0.5">1名あたり {savingsPerPerson?.toLocaleString()}円 お得</span>
                  </div>
                </>
              ) : totalSavings !== undefined && totalSavings < 0 ? (
                <>
                  <div className="text-lg font-bold text-gray-500 flex flex-col items-end leading-none">
                    <span>{Math.abs(totalSavings).toLocaleString()} <span className="text-sm font-normal text-gray-500">円</span></span>
                    <span className="text-xs text-gray-500 block mt-0.5">割高</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">1名あたり {Math.abs(savingsPerPerson!).toLocaleString()}円 割高</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-500">
                    基準地
                  </div>
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

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm bg-gray-50 p-3 rounded-lg">
        <div className="text-center border-r border-gray-200 flex flex-col justify-center relative">
          <p className="text-gray-500 text-xs mb-1 leading-tight">宿泊費<br />(合計)</p>
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-1">
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">{nightCount}泊</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">{roomCount}室</span>
            </div>
            <span className="font-bold text-lg text-gray-800">¥{totalHotelPrice.toLocaleString()}</span>
            <div className="text-xs text-gray-400">1名あたり ¥{pricePerPerson.toLocaleString()}</div>
          </div>
        </div>
        <div className="text-center flex flex-col justify-center">
          <p className="text-gray-500 text-xs mb-1 leading-tight">
            往復運賃<br />(合計)
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded ml-1">×{nightCount}日</span>
          </p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-center">
              <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded block mb-0.5 w-fit mx-auto">IC</span>
              <span className="font-bold text-lg text-gray-800">¥{totalIcFare.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">1名あたり ¥{farePerPerson.toLocaleString()}</div>
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

        <div className="text-right min-w-[160px] bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800 mb-0.5 font-bold">総額 ({adultCount}名)</p>
          <div className="text-2xl font-bold text-gray-800 leading-none">
            ¥{totalCost.toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-500 mt-1 text-right">
            (1名あたり ¥{costPerPerson.toLocaleString()})
          </p>
        </div>
      </div>
    </div>
  );
};

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
  isHighestRated: boolean;
  ticketFare?: number;
  numberOfStops?: number;
  adultCount: number;
  nightCount: number;
  roomCount: number;
  sortMode: 'price' | 'review' | 'cospa';
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  rank,
  trainSchedule,
  selectedDate,
  isCheapest,
  isOptimal,
  isHighestRated,
  ticketFare,
  numberOfStops,
  adultCount,
  nightCount,
  roomCount,
  sortMode
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

  // Determine if this card should be highlighted (has a special tag)
  const isHighlighted = isOptimal ||
    (isCheapest && sortMode === 'price') ||
    (isHighestRated && sortMode === 'review');

  // Get highlight color based on mode
  const getHighlightBorderColor = () => {
    if (isOptimal) return 'border-orange-400';
    if (isCheapest && sortMode === 'price') return 'border-red-400';
    if (isHighestRated && sortMode === 'review') return 'border-yellow-400';
    return 'border-gray-200';
  };

  const getRankBgColor = () => {
    if (isOptimal) return 'bg-orange-100 text-orange-600';
    if (isCheapest && sortMode === 'price') return 'bg-red-100 text-red-600';
    if (isHighestRated && sortMode === 'review') return 'bg-yellow-100 text-yellow-600';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <a
      href={result.hotel.hotelUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative p-6 rounded-2xl transition-all duration-300 block cursor-pointer ${isHighlighted
        ? `neu-flat ${getHighlightBorderColor()} border-2 scale-[1.02] z-10 hover:scale-[1.03]`
        : 'neu-flat hover:-translate-y-1'
        }`}
    >

      {/* Badges */}
      <div className="absolute -top-3 -right-3 flex gap-2">
        {isOptimal && (
          <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            最適
          </div>
        )}
        {isCheapest && sortMode === 'price' && (
          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            最安
          </div>
        )}
        {isHighestRated && sortMode === 'review' && (
          <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            最高評価
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-3">
        <div className="flex items-center space-x-3 w-full">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${getRankBgColor()
            }`}>
            #{rank}
          </div>
          <div className="min-w-0 flex-1">
            {result.hotel.hotelUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-baseline min-w-0">
                <span className="text-xl font-bold text-gray-800 truncate">
                  {result.hotel.hotelName}
                </span>
                {result.hotel.reviewAverage && (
                  <span className="text-orange-500 text-lg sm:ml-2 shrink-0">
                    ★{result.hotel.reviewAverage}
                  </span>
                )}
              </div>
            ) : (
              <h3 className="text-xl font-bold text-gray-800 truncate">{result.hotel.hotelName}</h3>
            )}
            <p className="text-sm text-gray-700">
              {result.name}駅
              {result.walkTime > 0 && <span className="text-gray-500 ml-1">徒歩{result.walkTime}分</span>}
            </p>
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
          {sortMode === 'review' ? (
            // レビューモード: 評価差を表示
            <>
              {result.hotel.reviewAverage ? (
                <div className="flex flex-col items-end leading-none">
                  <div className="text-2xl font-bold text-orange-500">
                    ★{result.hotel.reviewAverage.toFixed(2)}
                  </div>
                  {totalSavings !== undefined && totalSavings > 0 ? (
                    <span className="text-xs text-green-600 font-bold mt-0.5">+{(totalSavings / 100).toFixed(2)} ★</span>
                  ) : totalSavings !== undefined && totalSavings < 0 ? (
                    <span className="text-xs text-gray-400 mt-0.5">{(totalSavings / 100).toFixed(2)} ★</span>
                  ) : result.isBaseline ? (
                    <span className="text-xs text-gray-500 mt-0.5">基準</span>
                  ) : null}
                </div>
              ) : (
                <div className="text-lg font-bold text-gray-400">レビューなし</div>
              )}
            </>
          ) : sortMode === 'cospa' ? (
            // コスパモード: コスパ指標を表示
            <div className="flex flex-col items-end leading-none">
              {result.savedMoney !== undefined && result.extraTime !== undefined ? (
                <>
                  {/* 基準ホテルは特別アイコン */}
                  {result.isBaseline ? (
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-gray-400">-</div>
                      <span className="text-xs text-gray-500 mt-0.5">基準</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className={`text-2xl font-bold ${(result.cospaIndex ?? 0) > 0 ? 'text-green-600' :
                        (result.cospaIndex ?? 0) < 0 ? 'text-red-500' : 'text-gray-500'
                        }`}>
                        {result.cospaIndex === Infinity ? '-' : result.cospaIndex?.toLocaleString() || '0'}
                      </div>
                      <span className="text-xs text-gray-500 mt-0.5">pt</span>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 mt-1 text-right">
                    {/* 金額差分 */}
                    <span className={result.savedMoney > 0 ? 'text-green-600' : result.savedMoney < 0 ? 'text-red-500' : ''}>
                      {result.savedMoney > 0 ? '+' : ''}{result.savedMoney.toLocaleString()}円
                    </span>
                    <span className="mx-1">/</span>
                    {/* 時間差分 */}
                    <span className={result.extraTime <= 0 ? 'text-green-600' : ''}>
                      {result.extraTime > 0 ? '+' : ''}{result.extraTime}分
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold text-gray-400">-</div>
              )}
            </div>
          ) : (
            // 料金モード: お得額を表示
            savingsPerPerson !== undefined ? (
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
                ) : result.isBaseline ? (
                  <>
                    <div className="text-lg font-bold text-gray-500">
                      基準
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <div className="text-lg font-bold text-gray-400">
                -
              </div>
            )
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm neu-pressed p-4 rounded-xl">
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
            <span className="font-bold text-gray-800 text-sm">移動: 約{result.trainTime + result.walkTime}分</span>
            <span className="ml-2 text-gray-500 text-xs">
              (🚃{result.trainTime}分 + 徒歩{result.walkTime}分
              {numberOfStops !== undefined && `, ${numberOfStops}駅`})
            </span>
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

        <div className="text-right min-w-[160px] neu-flat-sm px-4 py-3 rounded-xl">
          <p className="text-xs text-blue-800 mb-0.5 font-bold">総額 ({adultCount}名)</p>
          <div className="text-2xl font-bold text-gray-800 leading-none">
            ¥{totalCost.toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-500 mt-1 text-right">
            (1名あたり ¥{costPerPerson.toLocaleString()})
          </p>
        </div>
      </div>
    </a>
  );
};

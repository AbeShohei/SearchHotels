import { useState } from 'react';
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
  ticketFare: propTicketFare,
  numberOfStops,
  adultCount,
  nightCount,
  roomCount,
  sortMode
}) => {
  const [displayImage, setDisplayImage] = useState<string>(result.hotel.roomImageUrl || result.hotel.hotelImageUrl || '');

  // Cost Calculations
  const baseOneWayFare = result.ticketFare || result.icFare;
  const icOneWayFare = result.icFare;

  const totalHotelPrice = result.hotel.price; // 宿泊期間全体の料金
  const totalTransportFare = baseOneWayFare * 2 * adultCount * nightCount; // 宿泊数分の往復運賃
  const totalCost = totalHotelPrice + totalTransportFare;

  const pricePerPerson = Math.round(totalHotelPrice / adultCount);
  const transportPerPerson = baseOneWayFare * 2;
  const icTransportPerPerson = icOneWayFare * 2;
  const costPerPerson = pricePerPerson + (transportPerPerson * nightCount);

  const totalSavings = result.savings !== undefined ? result.savings : undefined;

  const isHighlighted = isOptimal ||
    (isCheapest && sortMode === 'price') ||
    (isHighestRated && sortMode === 'review');

  const getHighlightBorderColor = () => {
    if (isOptimal) return 'border-orange-500';
    if (isCheapest && sortMode === 'price') return 'border-red-500';
    if (isHighestRated && sortMode === 'review') return 'border-yellow-500';
    return 'border-transparent';
  };

  const getRankBadgeStyle = () => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md scale-110';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow';
    return 'bg-gray-100 text-gray-500 border border-gray-200';
  };

  return (
    <a
      href={result.hotel.hotelUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative block rounded-xl overflow-visible transition-all duration-300 mb-4 mx-1 ${isHighlighted
        ? `bg-white ${getHighlightBorderColor()} border-2 shadow-xl z-10 custom-highlight`
        : 'bg-white/90 border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1'
        }`}
    >
      {/* Absolute Badges */}
      <div className="absolute -top-2.5 right-3 flex gap-1 z-20">
        {isOptimal && (
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap">
            最適
          </span>
        )}
        {isCheapest && sortMode === 'price' && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap">
            最安
          </span>
        )}
        {isHighestRated && sortMode === 'review' && (
          <span className="bg-yellow-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap">
            最高評価
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row h-full overflow-hidden rounded-xl">
        {/* Left: Image Section */}
        <div className="w-full h-[140px] sm:h-auto sm:w-40 bg-gray-200 relative group shrink-0">
          {displayImage ? (
            <img
              src={displayImage}
              alt={result.hotel.hotelName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
              🏨
            </div>
          )}

          {/* Image Switcher */}
          {result.hotel.hotelImageUrl && result.hotel.roomImageUrl && (
            <div className="absolute top-2 right-2 flex gap-1 z-20 bg-black/20 p-1 rounded-full backdrop-blur-sm">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDisplayImage(result.hotel.hotelImageUrl || '');
                }}
                className={`w-2.5 h-2.5 rounded-full border border-white/40 transition-all ${displayImage === result.hotel.hotelImageUrl ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/80'}`}
                title="ホテル外観"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDisplayImage(result.hotel.roomImageUrl || '');
                }}
                className={`w-2.5 h-2.5 rounded-full border border-white/40 transition-all ${displayImage === result.hotel.roomImageUrl ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/80'}`}
                title="客室"
              />
            </div>
          )}

          {/* Rank Badge */}
          <div className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-1 ring-white/50 ${getRankBadgeStyle()}`}>
            {rank}
          </div>
        </div>

        {/* Right: Info Section */}
        <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">

          {/* Header */}
          <div className="flex justify-between items-start mb-1.5 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1 leading-none">
                {/* Lines */}
                {result.lines && result.lines.slice(0, 3).map((lineId, i) => {
                  const info = getLineInfo(lineId);
                  return (
                    <span key={i} className="text-xs text-white px-1.5 py-0.5 rounded shadow-sm font-medium whitespace-nowrap" style={{ backgroundColor: info.color }}>
                      {info.name}
                    </span>
                  );
                })}
                <span className="text-base font-bold text-gray-700 whitespace-nowrap">{result.name}駅</span>

                {result.hotel.reviewAverage && (
                  <span className="text-xs text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                    ★{result.hotel.reviewAverage.toFixed(1)}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight tracking-tight line-clamp-1">
                {result.hotel.hotelName}
              </h3>
            </div>

            {/* Top Right: Info (Review / Cospa / Savings) */}
            <div className="shrink-0 ml-1">
              {sortMode === 'cospa' && (result.savedMoney !== undefined || result.extraTime !== undefined) ? (
                <div className="text-right">
                  {result.isBaseline ? (
                    <div className="text-sm font-bold text-orange-500">基準ホテル</div>
                  ) : (
                    (() => {
                      const isGoodDeal = (result.savedMoney ?? 0) > 0;
                      const isBadDeal = (result.savedMoney ?? 0) < 0;
                      const isFarther = (result.extraTime ?? 0) > 0;
                      const isNearer = (result.extraTime ?? 0) < 0;
                      const textColor = isGoodDeal ? 'text-green-600' : isBadDeal ? 'text-red-600' : 'text-gray-600';
                      const valueColor = isGoodDeal ? 'text-green-700' : isBadDeal ? 'text-red-700' : 'text-gray-700';

                      return (
                        <>
                          <div className={`text-sm font-bold ${textColor} whitespace-nowrap`}>
                            {isFarther && isGoodDeal && <>最寄りのホテルより{result.extraTime}分遠いけど</>}
                            {isFarther && isBadDeal && <>最寄りのホテルより{result.extraTime}分遠いし</>}
                            {isFarther && !isGoodDeal && !isBadDeal && <>最寄りのホテルより{result.extraTime}分遠い</>}
                            {!isFarther && !isNearer && isGoodDeal && <>最寄りのホテルと同じ距離で</>}
                            {!isFarther && !isNearer && isBadDeal && <>最寄りのホテルと同じ距離で</>}
                            {!isFarther && !isNearer && !isGoodDeal && !isBadDeal && <>最寄りのホテルと同じ条件</>}
                            {isNearer && isGoodDeal && <>最寄りのホテルより{Math.abs(result.extraTime!)}分近くて</>}
                            {isNearer && isBadDeal && <>最寄りのホテルより{Math.abs(result.extraTime!)}分近いけど</>}
                            {isNearer && !isGoodDeal && !isBadDeal && <>最寄りのホテルより{Math.abs(result.extraTime!)}分近い</>}
                          </div>
                          <div className={`text-base font-bold ${valueColor} whitespace-nowrap`}>
                            {isGoodDeal && <>{result.savedMoney!.toLocaleString()}円お得！</>}
                            {isBadDeal && <>{Math.abs(result.savedMoney!).toLocaleString()}円高い...</>}
                            {!isGoodDeal && !isBadDeal && <>-</>}
                          </div>
                          {result.cospaIndex ? (
                            <div className="text-xs text-gray-400">タイパ {result.cospaIndex.toFixed(2)}pt</div>
                          ) : null}
                        </>
                      );
                    })()
                  )}
                </div>
              ) : sortMode === 'review' && result.hotel.reviewAverage ? (
                <div className="bg-yellow-50 px-1.5 py-0.5 rounded text-right border border-yellow-100">
                  <div className="text-sm text-yellow-600 font-bold whitespace-nowrap">評価スコア</div>
                  <div className="text-lg font-bold text-yellow-700 whitespace-nowrap">★{result.hotel.reviewAverage.toFixed(1)}</div>
                </div>
              ) : (
                totalSavings && totalSavings > 0 ? (
                  <div className="bg-green-50 px-1.5 py-0.5 rounded text-right border border-green-100">
                    <div className="text-sm text-green-600 font-bold whitespace-nowrap">お得額</div>
                    <div className="text-lg font-bold text-green-700 whitespace-nowrap">+{totalSavings.toLocaleString()}円</div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base bg-gray-50 p-3 rounded-lg border border-gray-100 mb-1.5">
            {/* Cost Detail */}
            <div>
              <div className="font-bold text-gray-600 mb-0.5 border-b border-gray-200 pb-0.5 text-sm">料金内訳 (1名あたり)</div>
              <div className="flex justify-between text-gray-500 mb-0.5 text-sm">
                <span>宿泊費:</span> <span>¥{pricePerPerson.toLocaleString()}</span>
              </div>
              <div className="flex flex-col mb-0.5">
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>交通費(往復):</span> <span>¥{(transportPerPerson * nightCount).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 text-right leading-none">
                  (IC: ¥{(icTransportPerPerson * nightCount).toLocaleString()})
                </div>
              </div>
              <div className="flex justify-between font-bold text-gray-700 border-t border-gray-200 mt-0.5 pt-0.5 text-sm">
                <span>1名合計:</span> <span>¥{costPerPerson.toLocaleString()}</span>
              </div>
            </div>

            {/* Train Info */}
            <div className="sm:pl-2 sm:border-l sm:border-gray-200 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-200 mt-1 sm:mt-0 flex flex-col justify-between">
              <div>
                <div className="font-bold text-gray-600 mb-0.5 border-b border-gray-200 pb-0.5 text-sm">移動情報</div>
                {trainSchedule && result.trainTime > 0 ? (
                  (() => {
                    const formatDate = (dateStr: string, addDays: number = 0) => {
                      if (!dateStr) return '';
                      const parts = dateStr.split('-');
                      if (parts.length !== 3) return dateStr;
                      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                      d.setDate(d.getDate() + addDays);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    };
                    return (
                      <>
                        <div className="grid grid-cols-[24px_1fr] gap-x-1 mb-1 items-center">
                          <div className="flex flex-col items-center">
                            <span className="bg-red-100 text-red-600 px-0.5 rounded text-[10px] text-center whitespace-nowrap w-full">終電</span>
                            <span className="text-[9px] text-gray-400 leading-none mt-0.5">{formatDate(selectedDate)}</span>
                          </div>
                          <div className="flex justify-center gap-2 items-center text-sm">
                            <span className="font-mono text-gray-700 leading-none">{trainSchedule.lastTrain.departureTime}<span className="text-[10px] text-gray-400 ml-0.5">発</span></span>
                            <span className="text-gray-300 transform scale-x-50">→</span>
                            <span className="font-mono text-gray-700 leading-none">{trainSchedule.lastTrain.arrivalTime}<span className="text-[10px] text-gray-400 ml-0.5">着</span></span>
                          </div>
                        </div>
                        <div className="grid grid-cols-[24px_1fr] gap-x-1 items-center">
                          <div className="flex flex-col items-center">
                            <span className="bg-blue-100 text-blue-600 px-0.5 rounded text-[10px] text-center whitespace-nowrap w-full">始発</span>
                            <span className="text-[9px] text-gray-400 leading-none mt-0.5">{formatDate(selectedDate, 1)}</span>
                          </div>
                          <div className="flex justify-center gap-2 items-center text-sm">
                            <span className="font-mono text-gray-700 leading-none">{trainSchedule.firstTrain.departureTime}<span className="text-[10px] text-gray-400 ml-0.5">発</span></span>
                            <span className="text-gray-300 transform scale-x-50">→</span>
                            <span className="font-mono text-gray-700 leading-none">{trainSchedule.firstTrain.arrivalTime}<span className="text-[10px] text-gray-400 ml-0.5">着</span></span>
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : result.trainTime > 0 ? (
                  <div className="text-gray-400 text-center py-1 text-sm">- 時刻表取得中 -</div>
                ) : null}
              </div>

              {/* Moved Travel Time Info */}
              <div className="mt-1 pt-1 border-t border-gray-200">
                <div className="font-bold text-gray-700 text-sm flex flex-wrap items-baseline gap-1 leading-tight justify-end sm:justify-start">
                  <span className="whitespace-nowrap">⏱️約{result.trainTime + result.walkTime}分</span>
                  <span className="text-xs text-gray-400 font-normal whitespace-nowrap">
                    ({result.trainTime > 0 ? `電車${result.trainTime}分/${numberOfStops}駅+` : ''}徒歩{result.walkTime}分)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Footer - Horizontal Layout for Compactness */}
          <div className="mt-auto flex items-end justify-between pt-1 gap-2">

            {/* Left: Metro Ticket Info */}
            <div className="flex flex-col justify-end">
              {/* Metro Multi-day Ticket Comparison */}
              {
                (() => {
                  if (baseOneWayFare === 0) return null;

                  // Ticket prices
                  const tickets = [
                    { hours: 24, price: 800, forNights: 1 },
                    { hours: 48, price: 1200, forNights: 2 },
                    { hours: 72, price: 1500, forNights: 3 },
                  ];

                  // Select appropriate ticket based on nightCount
                  const ticket = nightCount >= 3 ? tickets[2] : nightCount === 2 ? tickets[1] : tickets[0];

                  // Total round trip cost for the stay
                  const roundTripTotal = baseOneWayFare * 2 * nightCount;

                  // How many extra rides needed beyond round trips?
                  const extraCostNeeded = ticket.price - roundTripTotal;
                  const extraRidesNeeded = extraCostNeeded > 0 ? Math.ceil(extraCostNeeded / baseOneWayFare) : 0;

                  const ticketLabel = `東京メトロ${ticket.hours}時間券(${ticket.price}円)`;

                  if (extraRidesNeeded <= 0) {
                    // Already worthwhile with just round trips
                    return (
                      <div className="bg-pink-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-pink-100 text-xs sm:text-sm font-bold text-pink-600 animate-pulse">
                        🎫 {ticketLabel}がお得！
                      </div>
                    );
                  } else {
                    // Need extra rides to break even
                    return (
                      <div className="bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-blue-100 text-xs sm:text-sm font-bold text-blue-600">
                        💡往復+{extraRidesNeeded}回なら{ticketLabel}がお得！
                      </div>
                    );
                  }
                })()
              }
            </div>

            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 mb-0 leading-none">
                {sortMode === 'price' && isCheapest && (
                  <span className="text-xs text-red-500 font-bold animate-pulse whitespace-nowrap">最安値!</span>
                )}
                <div className="text-xs text-gray-500 font-bold">合計支払い額</div>
              </div>
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-sm text-gray-600 font-bold whitespace-nowrap mr-0.5">{nightCount}泊{adultCount}名</span>
                <span className="text-xl font-bold text-gray-800 tracking-tight leading-none">
                  ¥{totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </a >
  );
};

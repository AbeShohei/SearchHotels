import { ExtendedResult } from '../types';

export type SortMode = 'price' | 'review' | 'cospa';

export const calculateAndSortResults = (
    results: ExtendedResult[],
    mode: SortMode,
    targetStationName: string
): ExtendedResult[] => {
    // Shallow copy to avoid mutating original array order immediately (though objects are mutated)
    const sorted = [...results];

    if (mode === 'review') {
        sorted.sort((a, b) => (b.hotel.reviewAverage || 0) - (a.hotel.reviewAverage || 0));
        // 目的地駅の最高評価を基準に
        const destHotels = sorted.filter(r => r.name === targetStationName);
        const bestDestReview = destHotels.length > 0
            ? Math.max(...destHotels.map(r => r.hotel.reviewAverage || 0))
            : (sorted[0]?.hotel.reviewAverage || 0);
        sorted.forEach(r => {
            r.savings = ((r.hotel.reviewAverage || 0) - bestDestReview) * 100;
        });
    } else if (mode === 'cospa') {
        // コスパ順: 目的地駅の最安ホテルを基準に計算
        const destHotels = sorted.filter(r => r.name === targetStationName);

        if (destHotels.length > 0) {
            // 基準ホテル: 目的地駅で最も「所要時間」が短いホテル
            // 時間が同じなら価格が安い方を優先（サブ条件）
            const baselineHotel = destHotels.reduce((min, h) => {
                const minTime = min.trainTime + min.walkTime;
                const hTime = h.trainTime + h.walkTime;
                if (hTime < minTime) return h;
                if (hTime === minTime && h.hotel.price < min.hotel.price) return h;
                return min;
            }, destHotels[0]);

            const baselineCost = baselineHotel.hotel.price;
            const baselineTravelTime = baselineHotel.trainTime + baselineHotel.walkTime;

            // 各ホテルのコスパ指標を計算
            sorted.forEach(r => {
                let totalTravelTime = r.trainTime + r.walkTime;
                const hotelCostWithFare = r.hotel.price + (r.icFare * 2);

                // 基準ホテル以外で所要時間が同じ場合、+1分して区別する
                if (r.id !== baselineHotel.id && totalTravelTime === baselineTravelTime) {
                    totalTravelTime += 1;
                }

                // 浮いた金額
                r.savedMoney = baselineCost - hotelCostWithFare;

                // 追加時間 (基準が最短なので、常に 0 以上になるはず)
                r.extraTime = totalTravelTime - baselineTravelTime;

                // コスパ指標 = 浮いた金額 ÷ 追加時間
                if (r.extraTime > 0) {
                    r.cospaIndex = Math.round(r.savedMoney / r.extraTime);
                } else {
                    // 基準ホテル自身 (extraTime === 0)
                    r.cospaIndex = 0;
                }
            });

            // コスパ指標が高い順にソート（正が良い、負は下位）
            sorted.sort((a, b) => {
                const idxA = a.cospaIndex ?? -Infinity;
                const idxB = b.cospaIndex ?? -Infinity;

                // 普通に降順 (Infinity -> 100 -> 0 -> -50 -> -100)
                if (idxA === idxB) {
                    // スコアが同じならお得額が大きい方を優先（同じ0ptでも金額浮いてる方が偉い？）
                    // Baseline(0,0) vs SamePrice(-500,+500 -> ~-1pt)
                    if (idxA === Infinity && idxB === Infinity) {
                        return (b.savedMoney ?? 0) - (a.savedMoney ?? 0);
                    }
                    // 基準ホテル(extraTime=0)を優先するか？今は単純に元のロジック通り
                    return 0;
                }
                if (idxA === Infinity) return -1;
                if (idxB === Infinity) return 1;
                return idxB - idxA;
            });
        } else {
            // 目的地ホテルがない場合は価格順フォールバック（またはエラー？）
            // 既存ロジックにはないが安全策として価格順
            sorted.sort((a, b) => a.totalCost - b.totalCost);
        }
    } else {
        sorted.sort((a, b) => a.totalCost - b.totalCost);
        // 目的地駅のコストを基準に
        const destResult = sorted.find(r => r.name === targetStationName);
        if (destResult) {
            sorted.forEach(r => {
                r.savings = destResult.totalCost - r.totalCost;
            });
        }
    }
    return sorted;
};

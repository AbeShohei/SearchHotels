import React, { useState } from 'react';

interface HomePageProps {
    isLoading: boolean;
    isReady: boolean;
    onStart: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        setIsPressed(true);
        // Press down animation
        setTimeout(() => {
            // Release animation
            setIsPressed(false);
            // Then transition after release animation completes
            setTimeout(() => {
                onStart();
            }, 200);
        }, 200);
    };

    return (
        <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            {/* Features - Direct text, no cards */}
            <div className="text-center space-y-1 text-gray-600 text-sm">
                <p>✓ 東京メトロ全路線のホテルを一括検索</p>
                <p>✓ 宿泊費＋運賃の合計で比較</p>
                <p>✓ 終電・始発時刻も表示</p>
            </div>

            {/* Large Glossy Red Button */}
            <button
                onClick={handleClick}
                className={`relative w-80 h-80 rounded-full font-bold text-2xl transition-all duration-150 
                    bg-gradient-to-b from-red-400 via-red-500 to-red-800 text-white
                    ${isPressed
                        ? 'shadow-[inset_0_8px_30px_rgba(255,255,255,0.3),inset_0_-16px_40px_rgba(0,0,0,0.5),0_0px_0_0_#7f1d1d,0_8px_20px_rgba(0,0,0,0.4)] translate-y-5'
                        : 'shadow-[inset_0_10px_35px_rgba(255,255,255,0.5),inset_0_-14px_35px_rgba(0,0,0,0.4),0_20px_0_0_#7f1d1d,0_30px_50px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_10px_35px_rgba(255,255,255,0.5),inset_0_-14px_35px_rgba(0,0,0,0.4),0_10px_0_0_#7f1d1d,0_20px_40px_rgba(0,0,0,0.5)] hover:translate-y-2.5'
                    }`}
            >
                <span className="relative z-10">🔍 検索開始</span>
            </button>

            {/* License - Very Compact */}
            <div className="text-[10px] text-gray-400 text-center space-y-0.5 pt-4">
                <p>路線データ: <a href="https://www.odpt.org/" className="text-blue-400 hover:underline">ODPT</a> | ホテル情報: <a href="https://webservice.rakuten.co.jp/" className="text-blue-400 hover:underline">楽天トラベルAPI</a></p>
                <p>公共交通オープンデータチャレンジ2025エントリー作品</p>
            </div>
        </div>
    );
};

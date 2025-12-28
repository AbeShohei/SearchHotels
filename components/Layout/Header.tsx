import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="relative mb-2 z-20" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}>
            {/* Background with Inverted Arch Mask */}
            <div
                className="absolute inset-0 bg-white/60 backdrop-blur-xl -z-10"
                style={{
                    maskImage: 'radial-gradient(ellipse 150% 100% at 50% 115%, transparent 50%, black 50.1%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 150% 100% at 50% 115%, transparent 50%, black 50.1%)',
                    borderRadius: '0 0 20px 20px' // Keep slight rounding at corners if mask doesn't cut them
                }}
            />

            <div className="pt-6 px-6 pb-20 max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 sm:gap-0">
                <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-blue-600">東京メトロ沿線ホテル検索</h1>
                </div>
                <div className="text-[10px] text-gray-400 text-center sm:text-right space-y-1">
                    <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 block transition-colors">
                        Supported by Rakuten Developers
                    </a>
                    <p className="leading-tight">
                        公共交通オープンデータセンター<br />のデータを利用しています
                    </p>
                </div>
            </div>
        </header>
    );
};

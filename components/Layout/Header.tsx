import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-blue-600 text-white p-6 shadow-lg">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 sm:gap-0">
                <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">東京メトロ沿線ホテル検索</h1>
                </div>
                <div className="text-[10px] text-blue-200 text-center sm:text-right space-y-1">
                    <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-white block transition-colors">
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

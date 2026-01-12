import React from 'react';

/**
 * Footer component displaying data usage disclaimer
 * Required notice for public transportation open data usage
 */
export const Footer: React.FC = () => {
    return (
        <footer className="relative z-30 mt-8 pb-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-sm text-gray-600 leading-relaxed">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        公共交通データに関するお知らせ
                    </h3>
                    <p className="mb-3">
                        本アプリケーションが利用する公共交通データは、公共交通オープンデータセンターにおいて提供されるものです。
                    </p>
                    <p className="mb-3">
                        公共交通事業者により提供されたデータを元にしていますが、必ずしも正確・完全なものとは限りません。
                        本アプリケーションの表示内容について、公共交通事業者への直接の問合せは行わないでください。
                    </p>
                    <p className="mb-2">
                        本アプリケーションに関するお問い合わせは、以下のメールアドレスにお願いします。
                    </p>
                    <p className="font-medium text-gray-700">
                        📧{' '}
                        <a
                            href="mailto:shokoi0618@gmail.com"
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                            shokoi0618@gmail.com
                        </a>
                    </p>
                </div>

                <div className="text-center mt-4 text-xs text-gray-500">
                    <p>© 2025 東京メトロ沿線ホテル検索</p>
                </div>
            </div>
        </footer>
    );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type StepType = 'station' | 'date' | 'guests' | 'search' | 'card';

interface OnboardingStep {
    id: StepType;
    title: string;
    description: string;
    targetSelector?: string;
}

const steps: OnboardingStep[] = [
    {
        id: 'station',
        title: '① 目的地の最寄り駅を入力',
        description: 'イベント会場やオフィスの最寄り駅を入力・選択してください。東京メトロ全線から検索できます。',
        targetSelector: '[data-onboarding="station"]'
    },
    {
        id: 'date',
        title: '② 宿泊日程を選択',
        description: 'チェックイン日とチェックアウト日を選択してください。',
        targetSelector: '[data-onboarding="date"]'
    },
    {
        id: 'guests',
        title: '③ 人数・部屋数を設定',
        description: '宿泊する人数と必要な部屋数を設定してください。',
        targetSelector: '[data-onboarding="guests"]'
    },
    {
        id: 'search',
        title: '④ 検索開始',
        description: '検索ボタンを押すと、沿線全体のホテルを一括検索します。',
        targetSelector: '[data-onboarding="search"]'
    },
    {
        id: 'card',
        title: '⑤ 検索結果の見方',
        description: '検索結果カードの各項目について説明します。'
    }
];

// Mock hotel card component for tutorial with annotations
const MockHotelCardWithAnnotations: React.FC = () => {
    return (
        <div className="relative pt-4 px-4 pb-2">
            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-visible border-2 border-orange-400 relative mx-auto" style={{ maxWidth: '320px' }}>
                {/* Badge - 最適 */}
                <div className="absolute -top-2.5 right-2 flex gap-1 z-10">
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                        最適
                    </span>
                </div>

                <div className="flex">
                    {/* Image area */}
                    <div className="w-20 bg-gradient-to-br from-blue-100 to-blue-200 relative shrink-0 flex items-center justify-center">
                        <div className="text-4xl">🏨</div>
                        {/* Rank badge */}
                        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                            1
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-2.5">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">銀座線</span>
                                    <span className="font-bold text-gray-700 text-xs">三越前駅</span>
                                    <span className="text-orange-500 font-bold bg-orange-50 px-1 rounded text-[10px]">★3.9</span>
                                </div>
                                <h3 className="font-bold text-gray-800 text-sm">○○ホテル</h3>
                            </div>
                            {/* お得額 */}
                            <div className="bg-green-50 px-1.5 py-1 rounded border border-green-200 text-right">
                                <div className="text-[9px] text-green-600 font-bold">お得額</div>
                                <div className="text-xs font-bold text-green-700">+3,288円</div>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded text-[10px]">
                            <div>
                                <div className="font-bold text-gray-600 border-b border-gray-200 pb-0.5 mb-1">料金内訳(1名)</div>
                                <div className="space-y-0.5 text-gray-500">
                                    <div className="flex justify-between"><span>宿泊費:</span><span>¥3,000</span></div>
                                    <div className="flex justify-between"><span>交通費:</span><span>¥360</span></div>
                                </div>
                                <div className="flex justify-between font-bold text-gray-700 border-t border-gray-200 mt-1 pt-1">
                                    <span>1名合計:</span><span>¥3,360</span>
                                </div>
                            </div>
                            <div className="border-l border-gray-200 pl-2">
                                <div className="font-bold text-gray-600 border-b border-gray-200 pb-0.5 mb-1">移動情報</div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                        <span className="bg-red-100 text-red-600 px-1 rounded text-[8px]">終電</span>
                                        <span className="text-gray-600 text-[9px]">00:22→00:30</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="bg-blue-100 text-blue-600 px-1 rounded text-[8px]">始発</span>
                                        <span className="text-gray-600 text-[9px]">05:05→05:13</span>
                                    </div>
                                </div>
                                <div className="font-bold text-gray-700 mt-1 text-[10px]">⏱️約21分</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OnboardingGuide: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);


    useEffect(() => {
        if (!isVisible) return;

        const step = steps[currentStep];
        if (step.targetSelector) {
            const element = document.querySelector(step.targetSelector);
            if (element) {
                const rect = element.getBoundingClientRect();
                setHighlightRect(rect);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setHighlightRect(null);
            }
        } else {
            setHighlightRect(null);
        }
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const step = steps[currentStep];
    const isCardStep = step.id === 'card';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50">
                {/* Dark overlay - only for non-highlighted areas */}
                {!highlightRect && (
                    <div
                        className="absolute inset-0"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                    />
                )}

                {/* Spotlight effect */}
                {highlightRect && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute pointer-events-none z-10"
                        style={{
                            left: highlightRect.left - 8,
                            top: highlightRect.top - 8,
                            width: highlightRect.width + 16,
                            height: highlightRect.height + 16,
                            borderRadius: '16px',
                            border: '3px solid #3B82F6',
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.5)',
                        }}
                    />
                )}

                {/* Tooltip / Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute z-20 ${isCardStep ? 'inset-4 flex items-center justify-center' : ''}`}
                    style={!isCardStep && highlightRect ? {
                        left: Math.min(Math.max(16, highlightRect.left), window.innerWidth - 356),
                        top: highlightRect.bottom + 16,
                    } : !isCardStep ? {
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                    } : undefined}
                >
                    <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${isCardStep ? 'max-w-md w-full max-h-[90vh] overflow-y-auto' : 'max-w-sm w-full'}`}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                            <div className="flex justify-between items-center">
                                <h2 className="font-bold">{step.title}</h2>
                                <button
                                    onClick={handleComplete}
                                    className="text-white/70 hover:text-white text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Progress */}
                            <div className="flex gap-1.5 mt-2">
                                {steps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-1 rounded-full transition-all duration-300 flex-1 ${index <= currentStep ? 'bg-white' : 'bg-white/30'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-gray-600 text-sm mb-4">{step.description}</p>

                            {/* Mock card for card step */}
                            {isCardStep && (
                                <div className="space-y-3">
                                    <MockHotelCardWithAnnotations />

                                    {/* 各項目の説明 */}
                                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                                        <h4 className="font-bold text-gray-700 text-sm mb-2">📋 カードの見方</h4>
                                        <div className="grid grid-cols-1 gap-1.5 text-xs">
                                            <div className="flex items-start gap-2">
                                                <span className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                                                <div><span className="font-bold text-gray-700">順位</span> - 実質価格が安い順に表示</div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">銀座線</span>
                                                <div><span className="font-bold text-gray-700">路線・駅名</span> - ホテル最寄りの路線と駅</div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0">最適</span>
                                                <div><span className="font-bold text-gray-700">バッジ</span> - 「最適」「最安」などおすすめ表示</div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">+3,288円</span>
                                                <div><span className="font-bold text-gray-700">お得額</span> - 最寄り駅ホテルより安くなる金額</div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-gray-500 text-[10px] shrink-0">💰</span>
                                                <div><span className="font-bold text-gray-700">料金内訳</span> - 宿泊費＋交通費（往復）の1名あたり合計</div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-gray-500 text-[10px] shrink-0">🚃</span>
                                                <div><span className="font-bold text-gray-700">移動情報</span> - 終電・始発時刻と所要時間</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-2.5 text-xs text-blue-700">
                                        💡 カードをタップすると楽天トラベルの予約ページに移動します
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 pb-4 flex justify-between items-center">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentStep === 0
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                ← 戻る
                            </button>

                            <button
                                onClick={handleComplete}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                スキップ
                            </button>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-600 transition-colors"
                            >
                                {currentStep === steps.length - 1 ? '始める 🚀' : '次へ →'}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

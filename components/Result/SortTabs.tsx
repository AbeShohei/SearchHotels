import React from 'react';
import { motion } from 'framer-motion';

export type SortMode = 'price' | 'review' | 'cospa';

interface SortTabsProps {
    sortMode: SortMode;
    setSortMode: (mode: SortMode) => void;
}

const SORT_OPTIONS: { mode: SortMode; label: string; activeColor: string }[] = [
    { mode: 'price', label: '料金順', activeColor: 'text-blue-600' },
    { mode: 'review', label: 'レビュー順', activeColor: 'text-orange-600' },
    { mode: 'cospa', label: 'タイパ順', activeColor: 'text-green-600' },
];

/**
 * Animated sort tab selector with neumorphic styling
 */
export const SortTabs: React.FC<SortTabsProps> = ({ sortMode, setSortMode }) => {
    return (
        <div className="flex w-full sm:w-auto p-1.5 neu-pressed rounded-xl relative isolate gap-2">
            {SORT_OPTIONS.map(({ mode, label, activeColor }) => {
                const isActive = sortMode === mode;

                return (
                    <motion.button
                        key={mode}
                        onClick={() => setSortMode(mode)}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors z-10 ${isActive ? activeColor : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeSortTab"
                                className="absolute inset-0 neu-flat-sm rounded-lg -z-10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        {label}
                    </motion.button>
                );
            })}
        </div>
    );
};

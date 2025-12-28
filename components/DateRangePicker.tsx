import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface DateRangePickerProps {
    checkInDate: string;
    checkOutDate: string;
    onDateChange: (checkIn: string, checkOut: string) => void;
    disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    checkInDate,
    checkOutDate,
    onDateChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectingCheckOut, setSelectingCheckOut] = useState(false);
    const [tempCheckIn, setTempCheckIn] = useState(checkInDate);
    const [tempCheckOut, setTempCheckOut] = useState(checkOutDate);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date(checkInDate);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const nights = useMemo(() => {
        const d1 = new Date(checkInDate);
        const d2 = new Date(checkOutDate);
        return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    }, [checkInDate, checkOutDate]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    const formatDateFull = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const handleOpen = () => {
        if (disabled) return;
        setTempCheckIn(checkInDate);
        setTempCheckOut(checkOutDate);
        setSelectingCheckOut(false);
        setCurrentMonth(new Date(new Date(checkInDate).getFullYear(), new Date(checkInDate).getMonth(), 1));
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleConfirm = () => {
        onDateChange(tempCheckIn, tempCheckOut);
        setIsOpen(false);
    };

    const handleDateClick = (dateStr: string) => {
        const clickedDate = new Date(dateStr);

        if (!selectingCheckOut) {
            // Selecting check-in date
            setTempCheckIn(dateStr);
            // Auto-set check-out to next day if current check-out is before new check-in
            const nextDay = new Date(clickedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().split('T')[0];

            if (dateStr >= tempCheckOut) {
                setTempCheckOut(nextDayStr);
            }
            setSelectingCheckOut(true);
        } else {
            // Selecting check-out date
            if (dateStr <= tempCheckIn) {
                // If selected date is before or same as check-in, treat as new check-in
                setTempCheckIn(dateStr);
                const nextDay = new Date(clickedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setTempCheckOut(nextDay.toISOString().split('T')[0]);
                // Stay in check-out selection mode
            } else {
                setTempCheckOut(dateStr);
                // Selection complete
            }
        }
    };

    const isDateInRange = (dateStr: string) => {
        return dateStr > tempCheckIn && dateStr < tempCheckOut;
    };

    const isCheckIn = (dateStr: string) => dateStr === tempCheckIn;
    const isCheckOut = (dateStr: string) => dateStr === tempCheckOut;

    const isPastDate = (dateStr: string) => {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d < today;
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days: React.ReactNode[] = [];

        // Empty cells for days before the first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPast = isPastDate(dateStr);
            const isStart = isCheckIn(dateStr);
            const isEnd = isCheckOut(dateStr);
            const inRange = isDateInRange(dateStr);

            let bgClass = 'hover:bg-gray-100';
            let textClass = 'text-gray-900 font-bold'; // Darker text by default

            if (isPast) {
                bgClass = '';
                textClass = 'text-gray-400 font-normal cursor-not-allowed'; // Slightly darker for visibility
            } else if (isStart) {
                bgClass = 'bg-blue-600 text-white rounded-l-xl shadow-md z-10'; // Stronger highlight
                textClass = 'text-white font-bold';
            } else if (isEnd) {
                bgClass = 'bg-blue-600 text-white rounded-r-xl shadow-md z-10'; // Stronger highlight
                textClass = 'text-white font-bold';
            } else if (inRange) {
                bgClass = 'bg-blue-200'; // Darker blue for range
                textClass = 'text-blue-900 font-bold';
            }

            days.push(
                <motion.button
                    key={day}
                    onClick={() => !isPast && handleDateClick(dateStr)}
                    disabled={isPast}
                    whileTap={{ scale: 0.95 }}
                    className={`h-9 w-full flex items-center justify-center text-sm ${bgClass} ${textClass} transition-all relative`}
                >
                    {day}
                </motion.button>
            );
        }

        return days;
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const canGoPrev = () => {
        const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return prevMonthDate >= thisMonth;
    };

    const tempNights = useMemo(() => {
        const d1 = new Date(tempCheckIn);
        const d2 = new Date(tempCheckOut);
        return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    }, [tempCheckIn, tempCheckOut]);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <motion.button
                onClick={handleOpen}
                disabled={disabled}
                whileTap={{ scale: 0.95 }}
                className={`w-full neu-pressed text-sm font-medium rounded-xl p-3 text-left flex items-center justify-between gap-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/40'}`}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">
                        {formatDate(checkInDate)} → {formatDate(checkOutDate)}
                    </span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded shrink-0">
                    {nights}泊
                </span>
            </motion.button>

            {/* Popover */}
            {isOpen && (
                <>
                    {/* Transparent Backdrop for click-outside */}
                    <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={handleClose} />

                    <div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-[350px] z-50 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 sm:absolute sm:top-full sm:translate-y-0 sm:mt-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="border-b border-gray-100 p-4 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-base font-extrabold text-gray-800">日程を選択</h3>
                                <motion.button onClick={handleClose} whileTap={{ scale: 0.95 }} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Selected Dates Display */}
                            <div className="flex items-center gap-2 text-xs">
                                <div
                                    onClick={() => setSelectingCheckOut(false)}
                                    className={`flex-1 p-2 rounded-xl transition-all cursor-pointer ${!selectingCheckOut ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className="text-[10px] text-gray-500 font-bold mb-0.5 whitespace-nowrap">チェックイン</div>
                                    <div className="font-bold text-gray-900 text-sm">{formatDate(tempCheckIn)}</div>
                                </div>
                                <span className="text-gray-300 font-bold">→</span>
                                <div
                                    onClick={() => setSelectingCheckOut(true)}
                                    className={`flex-1 p-2 rounded-xl transition-all cursor-pointer ${selectingCheckOut ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className="text-[10px] text-gray-500 font-bold mb-0.5 whitespace-nowrap">チェックアウト</div>
                                    <div className="font-bold text-gray-900 text-sm">{formatDate(tempCheckOut)}</div>
                                </div>
                                <div className="bg-gray-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold flex flex-col items-center justify-center min-w-[3rem]">
                                    <span className="text-lg leading-none">{tempNights}</span>
                                    <span className="text-[9px]">泊</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="p-4 bg-white">
                            {/* Month Navigation */}
                            <div className="flex justify-between items-center mb-4">
                                <motion.button
                                    onClick={prevMonth}
                                    disabled={!canGoPrev()}
                                    whileTap={{ scale: 0.95 }}
                                    className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${!canGoPrev() ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </motion.button>
                                <span className="font-bold text-gray-800 text-sm tracking-wide">
                                    {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                                </span>
                                <motion.button
                                    onClick={nextMonth}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </motion.button>
                            </div>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-gray-400">
                                {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                                    <div key={day} className={`h-6 flex items-center justify-center ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''}`}>{day}</div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendar()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                            <motion.button
                                onClick={handleConfirm}
                                whileTap={{ scale: 0.95 }}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm tracking-widest shadow-lg"
                            >
                                確定する
                            </motion.button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

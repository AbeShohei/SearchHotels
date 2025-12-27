import React, { useState, useMemo } from 'react';

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
            let textClass = 'text-gray-800';

            if (isPast) {
                bgClass = '';
                textClass = 'text-gray-300 cursor-not-allowed';
            } else if (isStart) {
                bgClass = 'bg-blue-600 text-white rounded-l-full';
                textClass = 'text-white font-bold';
            } else if (isEnd) {
                bgClass = 'bg-blue-600 text-white rounded-r-full';
                textClass = 'text-white font-bold';
            } else if (inRange) {
                bgClass = 'bg-blue-100';
                textClass = 'text-blue-800';
            }

            days.push(
                <button
                    key={day}
                    onClick={() => !isPast && handleDateClick(dateStr)}
                    disabled={isPast}
                    className={`h-8 w-full flex items-center justify-center text-xs ${bgClass} ${textClass} transition-colors`}
                >
                    {day}
                </button>
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
        <>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm font-medium rounded-lg p-2.5 text-left flex items-center justify-between gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 focus:ring-2 focus:ring-blue-500'}`}
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
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50" onClick={handleClose}>
                    <div
                        className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-white border-b border-gray-200 p-3 rounded-t-xl">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base font-bold text-gray-800">日程を選択</h3>
                                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Selected Dates Display - Compact */}
                            <div className="flex items-center gap-1 text-xs">
                                <div className={`flex-1 p-1.5 rounded border ${!selectingCheckOut ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <div className="text-[10px] text-gray-500">チェックイン</div>
                                    <div className="font-bold text-gray-800 text-sm">{formatDate(tempCheckIn)}</div>
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className={`flex-1 p-1.5 rounded border ${selectingCheckOut ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                                    <div className="text-[10px] text-gray-500">チェックアウト</div>
                                    <div className="font-bold text-gray-800 text-sm">{formatDate(tempCheckOut)}</div>
                                </div>
                                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">
                                    {tempNights}泊
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="p-3">
                            {/* Month Navigation */}
                            <div className="flex justify-between items-center mb-2">
                                <button
                                    onClick={prevMonth}
                                    disabled={!canGoPrev()}
                                    className={`p-1 rounded-full ${canGoPrev() ? 'hover:bg-gray-100' : 'opacity-30 cursor-not-allowed'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="font-bold text-gray-800 text-sm">
                                    {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                                </span>
                                <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-0.5 mb-1 text-center text-[10px] text-gray-500">
                                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                                    <div key={day} className="h-6 flex items-center justify-center">{day}</div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {renderCalendar()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-gray-200 p-3">
                            <button
                                onClick={handleConfirm}
                                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                                確定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

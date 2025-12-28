import React from 'react';
import { motion } from 'framer-motion';
import { GroupedStation } from '../../types';
import { DateRangePicker } from '../DateRangePicker';
import { getLineColor } from '../../constants';

interface SearchFormProps {
    stationInput: string;
    setStationInput: (val: string) => void;
    groupedStations: GroupedStation[];
    selectedStation: GroupedStation | null;
    setSelectedStation: (station: GroupedStation | null) => void;
    showSuggestions: boolean;
    setShowSuggestions: (show: boolean) => void;
    handleStationSelect: (station: GroupedStation) => void;
    suggestions: GroupedStation[];

    selectedDate: string;
    setSelectedDate: (date: string) => void;
    checkOutDate: string;
    setCheckOutDate: (date: string) => void;

    adultCount: number;
    setAdultCount: (count: number) => void;
    roomCount: number;
    setRoomCount: (count: number) => void;

    loading: boolean;
    isSearchable: boolean;
    handleSearch: () => void;
    loadingProgress: string;
    progressPercent: number;
}

export const SearchForm: React.FC<SearchFormProps> = ({
    stationInput, setStationInput, groupedStations, setSelectedStation,
    showSuggestions, setShowSuggestions, handleStationSelect, suggestions,
    selectedDate, setSelectedDate, checkOutDate, setCheckOutDate,
    adultCount, setAdultCount, roomCount, setRoomCount,
    loading, isSearchable, handleSearch, loadingProgress, progressPercent
}) => {
    return (
        <div className="neu-flat rounded-2xl p-6 mb-8 relative z-30">
            {/* Inputs */}
            <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">目的地</label>
                    <input
                        type="text"
                        value={stationInput}
                        onChange={(e) => {
                            setStationInput(e.target.value);
                            setShowSuggestions(true);
                            const match = groupedStations.find(s => s.name === e.target.value);
                            if (match) setSelectedStation(match);
                            else setSelectedStation(null);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="駅名を入力 (例: 新宿)"
                        className="w-full neu-pressed text-lg font-medium rounded-xl block p-4"
                        disabled={loading}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 neu-flat rounded-xl max-h-60 overflow-y-auto">
                            {suggestions.map((station) => (
                                <button
                                    key={station.name}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleStationSelect(station);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                >
                                    <span className="font-medium">{station.name}</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {station.stations.map(s => (
                                            <span key={s.id} className="text-xs px-2 py-0.5 rounded text-white" style={{ backgroundColor: getLineColor(s.lineId) }}>
                                                {s.lineName}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">宿泊日程</label>
                        <DateRangePicker
                            checkInDate={selectedDate}
                            checkOutDate={checkOutDate}
                            onDateChange={(checkIn, checkOut) => {
                                setSelectedDate(checkIn);
                                setCheckOutDate(checkOut);
                            }}
                            disabled={loading}
                        />
                    </div>

                    {/* Counter Inputs for People & Rooms */}
                    <div className="grid grid-cols-2 gap-4 sm:col-span-2">
                        {/* Adult Count */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">人数</label>
                            <div className="flex items-center justify-between neu-pressed rounded-xl p-3">
                                <motion.button
                                    onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                                    disabled={loading || adultCount <= 1}
                                    whileTap={{ scale: 0.85, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loading || adultCount <= 1 ? 'opacity-50 cursor-not-allowed' : 'neu-flat-sm text-blue-600 hover:scale-110'}`}
                                >
                                    -
                                </motion.button>
                                <span className="font-bold text-lg text-gray-700">{adultCount}名</span>
                                <motion.button
                                    onClick={() => setAdultCount(Math.min(4, adultCount + 1))}
                                    disabled={loading || adultCount >= 4}
                                    whileTap={{ scale: 0.85, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loading || adultCount >= 4 ? 'opacity-50 cursor-not-allowed' : 'neu-flat-sm text-blue-600 hover:scale-110'}`}
                                >
                                    +
                                </motion.button>
                            </div>
                        </div>

                        {/* Room Count */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">部屋数</label>
                            <div className="flex items-center justify-between neu-pressed rounded-xl p-3">
                                <motion.button
                                    onClick={() => setRoomCount(Math.max(1, roomCount - 1))}
                                    disabled={loading || roomCount <= 1}
                                    whileTap={{ scale: 0.85, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loading || roomCount <= 1 ? 'opacity-50 cursor-not-allowed' : 'neu-flat-sm text-blue-600 hover:scale-110'}`}
                                >
                                    -
                                </motion.button>
                                <span className="font-bold text-lg text-gray-700">{roomCount}室</span>
                                <motion.button
                                    onClick={() => setRoomCount(Math.min(4, roomCount + 1))}
                                    disabled={loading || roomCount >= 4}
                                    whileTap={{ scale: 0.85, boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)" }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loading || roomCount >= 4 ? 'opacity-50 cursor-not-allowed' : 'neu-flat-sm text-blue-600 hover:scale-110'}`}
                                >
                                    +
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-6">
                <motion.button
                    onClick={handleSearch}
                    disabled={loading || !isSearchable}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-full px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all overflow-hidden
            ${loading
                            ? 'bg-blue-300 cursor-wait'
                            : !isSearchable
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                        }`}
                >
                    {/* Train animation */}
                    {loading && (
                        <>
                            {/* Track Background */}
                            <div className="absolute top-0 left-0 w-full h-full bg-black/5" />

                            {/* Progress Fill (Orange - Chuo Line color) */}
                            <div
                                className="absolute top-0 left-0 h-full bg-orange-500/30 transition-all duration-1000 ease-linear"
                                style={{ width: `${progressPercent}%` }}
                            />

                            {/* Running Train (8 cars) 
                                - Positioned at bottom
                                - Cleanly transitions with progress
                                - translate-x-full ensures the train is "behind" the leading edge (on top of the processed part)
                            */}
                            <div
                                className="absolute bottom-0 text-xl whitespace-nowrap transition-all duration-1000 ease-linear"
                                style={{
                                    left: `${progressPercent}%`,
                                    transform: 'translateX(-100%)'
                                }}
                            >
                                🚃🚃🚃🚃🚃🚃🚃🚃
                            </div>
                        </>
                    )}

                    {/* Button content */}
                    <span className="relative z-10 mb-2 block">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                <span>{loadingProgress || 'ホテル検索中...'}</span>
                            </div>
                        ) : '検索開始'}
                    </span>
                </motion.button>
            </div>


        </div>
    );
};

import React, { useState, useMemo, useCallback } from 'react';
import { GroupedStation } from './types';
import { useHotelSearch } from './hooks/useHotelSearch';

import { Header } from './components/Layout/Header';
import { ScrollToTopButton } from './components/Layout/ScrollToTopButton';
import { Toast } from './components/Layout/Toast';
import { SearchForm } from './components/Search/SearchForm';
import { ResultList } from './components/Result/ResultList';
import { LiquidBackground } from './components/Layout/LiquidBackground';
import { OnboardingGuide } from './components/Layout/OnboardingGuide';

/**
 * Main application component.
 * Uses useHotelSearch hook for search functionality.
 */
const App: React.FC = () => {
  // Use custom hook for search functionality
  const {
    groupedStations,
    isNetworkLoaded,
    loading,
    loadingProgress,
    progressPercent,
    results,
    hasSearched,
    searchedParams,
    sortMode,
    setSortMode,
    showToast,
    toastMessage,
    setShowToast,
    handleSearch
  } = useHotelSearch();

  // Date input state

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Guest/room count
  const [adultCount, setAdultCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);

  // Station selection state
  const [stationInput, setStationInput] = useState('半蔵門');
  const [selectedStation, setSelectedStation] = useState<GroupedStation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtering state
  const [onlyHighRated, setOnlyHighRated] = useState(false);

  // Station suggestions
  const suggestions = useMemo(() => {
    if (!stationInput.trim()) return groupedStations;
    const query = stationInput.toLowerCase();
    return groupedStations.filter(s =>
      s.name.includes(stationInput) ||
      s.romaji.toLowerCase().includes(query) ||
      (s.kana && s.kana.includes(query))
    ).slice(0, 8);
  }, [stationInput, groupedStations]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!onlyHighRated) return results;
    return results.filter(r => (r.hotel.reviewAverage || 0) >= 4.0);
  }, [results, onlyHighRated]);

  // Station selection handler
  const handleStationSelect = useCallback((station: GroupedStation) => {
    setSelectedStation(station);
    setStationInput(station.name);
    setShowSuggestions(false);
  }, []);

  // Search handler - wraps the hook's handleSearch with local state
  const onSearch = useCallback(async () => {
    let target = selectedStation;
    if (!target && stationInput) {
      target = groupedStations.find(s => s.name === stationInput) || null;
    }
    if (!isNetworkLoaded || !target) return;

    await handleSearch(target, selectedDate, checkOutDate, adultCount, roomCount);
  }, [selectedStation, stationInput, groupedStations, isNetworkLoaded, handleSearch, selectedDate, checkOutDate, adultCount, roomCount]);

  const isSearchable = isNetworkLoaded && (!!selectedStation || groupedStations.some(s => s.name === stationInput));

  return (
    <div className="min-h-screen pb-12">
      <LiquidBackground />
      <Header />
      <main className="max-w-3xl mx-auto p-4 -mt-12 relative z-30">
        <SearchForm
          stationInput={stationInput}
          setStationInput={setStationInput}
          groupedStations={groupedStations}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          handleStationSelect={handleStationSelect}
          suggestions={suggestions}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          checkOutDate={checkOutDate}
          setCheckOutDate={setCheckOutDate}
          adultCount={adultCount}
          setAdultCount={setAdultCount}
          roomCount={roomCount}
          setRoomCount={setRoomCount}
          loading={loading}
          isSearchable={isSearchable}
          handleSearch={onSearch}
          loadingProgress={loadingProgress}
          progressPercent={progressPercent}
        />

        <ResultList
          results={filteredResults}
          sortMode={sortMode}
          setSortMode={setSortMode}
          searchedParams={searchedParams}
          loading={loading}
          onlyHighRated={onlyHighRated}
          setOnlyHighRated={setOnlyHighRated}
        />

        {hasSearched && results.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 font-bold mb-2">検索結果が見つかりませんでした</p>
            <p className="text-sm text-gray-400">
              日付や場所を変えて再度お試しください。
            </p>
          </div>
        )}
      </main>
      <ScrollToTopButton />
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        type="success"
      />
      <OnboardingGuide />
    </div >
  );
};

export default App;
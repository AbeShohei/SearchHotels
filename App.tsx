import React, { useState, useEffect, useMemo } from 'react';
import { getLineStations } from './services/odptService';
import { generateHotelPrice } from './services/mockHotelApi';
import { prefetchAllFares, getBothFares, getFareCacheSize, calculateTravelTimeByStationCount } from './services/fareService';
import { ScoredResult, Station } from './types';
import { ResultCard } from './components/ResultCard';
import { METRO_LINES, MetroLine } from './constants';

const VALUE_OF_TIME_PER_MINUTE = 30;

const App: React.FC = () => {
  const [selectedLine, setSelectedLine] = useState<MetroLine>(METRO_LINES[0]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isFareLoaded, setIsFareLoaded] = useState(false);
  const [dataError, setDataError] = useState<{ isFallback: boolean; message?: string }>({ isFallback: false });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScoredResult[]>([]);

  // Autocomplete state
  const [stationInput, setStationInput] = useState('');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestions
  const suggestions = useMemo(() => {
    if (!stationInput.trim()) return stations; // 空の場合は全駅
    const query = stationInput.toLowerCase();
    return stations.filter(s =>
      s.name.includes(stationInput) ||
      s.romaji.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [stationInput, stations]);

  // Load data when line changes
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoaded(false);
      setIsFareLoaded(false);
      setResults([]);
      setStationInput('');
      setSelectedStationId('');

      const { stations: lineStations, isFallback, error } = await getLineStations(selectedLine);
      setStations(lineStations);
      setDataError({ isFallback, message: error });
      setIsDataLoaded(true);

      // Set default station
      const refStation = lineStations.find(s => s.id === selectedLine.referenceStationId);
      if (refStation) {
        setSelectedStationId(refStation.id);
        setStationInput(refStation.name);
      } else if (lineStations.length > 0) {
        setSelectedStationId(lineStations[0].id);
        setStationInput(lineStations[0].name);
      }

      if (lineStations.length > 0) {
        await prefetchAllFares(lineStations.map(s => s.id));
        setIsFareLoaded(true);
      }
    };
    loadData();
  }, [selectedLine]);

  const handleStationSelect = (station: Station) => {
    setSelectedStationId(station.id);
    setStationInput(station.name);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    if (!isDataLoaded || !selectedStationId) return;
    setLoading(true);
    setResults([]);

    const targetStation = stations.find(s => s.id === selectedStationId);
    if (!targetStation) {
      alert("目的地駅が見つかりません");
      setLoading(false);
      return;
    }

    const targetIndex = stations.findIndex(s => s.id === selectedStationId);

    const tempResults: ScoredResult[] = stations.map((candidate, i) => {
      const hotel = {
        hotelName: `${candidate.name}駅前ホテル`,
        price: generateHotelPrice(candidate.lng),
        stationId: candidate.id
      };

      const { icFare, ticketFare } = getBothFares(candidate.id, selectedStationId);
      const stationCount = Math.abs(targetIndex - i);
      const trainTime = calculateTravelTimeByStationCount(stationCount);
      const timeCost = trainTime * VALUE_OF_TIME_PER_MINUTE;
      const totalScore = hotel.price + (icFare * 2) + timeCost;

      return {
        ...candidate,
        hotel,
        transportCost: icFare,
        icFare,
        ticketFare,
        timeCost,
        trainTime,
        walkTime: 0,
        totalScore
      };
    });

    tempResults.sort((a, b) => a.totalScore - b.totalScore);
    setResults(tempResults);
    setLoading(false);
  };

  const selectedStation = stations.find(s => s.id === selectedStationId);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header
        className="text-white p-6 shadow-lg sticky top-0 z-50"
        style={{ background: `linear-gradient(135deg, ${selectedLine.color}, ${selectedLine.color}dd)` }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">{selectedLine.name}ホテル検索</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {!isDataLoaded ? (
          <div className="text-center py-12">
            <p className="text-gray-500">駅データを読み込み中...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              {/* Line Selection */}
              <div className="mb-6">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {METRO_LINES.map((line) => (
                    <button
                      key={line.id}
                      onClick={() => setSelectedLine(line)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedLine.id === line.id
                        ? 'text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      style={selectedLine.id === line.id ? { backgroundColor: line.color } : {}}
                    >
                      {line.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Station Autocomplete */}
              <div className="mb-4 relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">目的地の最寄り駅</label>
                <input
                  type="text"
                  value={stationInput}
                  onChange={(e) => {
                    setStationInput(e.target.value);
                    setShowSuggestions(true);
                    // Clear selection if input doesn't match
                    const match = stations.find(s => s.name === e.target.value);
                    if (match) {
                      setSelectedStationId(match.id);
                    } else {
                      setSelectedStationId('');
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="駅名を入力..."
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3"
                  disabled={loading}
                />

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((station) => (
                      <button
                        key={station.id}
                        onClick={() => handleStationSelect(station)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-medium">{station.name}</span>
                        <span className="text-gray-400 text-sm ml-2">({station.romaji})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Status line - simplified */}
                {selectedStation && isFareLoaded && (
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: selectedLine.color }}>
                      {selectedLine.name}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex-1 w-full">
                  <div className="text-sm font-medium text-gray-800">
                    スコア = 宿泊費 + 往復運賃 + (乗車時間 × 30円/分)
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading || !selectedStation}
                  className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5
                    ${loading || !selectedStation
                      ? 'bg-gray-400 cursor-not-allowed shadow-none'
                      : 'hover:shadow-lg'
                    }`}
                  style={!loading && selectedStation ? { backgroundColor: selectedLine.color } : {}}
                >
                  検索開始
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {results.length > 0 && (
                <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">
                  おすすめ宿泊地ランキング <span className="text-sm font-normal text-gray-500 ml-2">目的地: {selectedStation?.name}駅</span>
                </h2>
              )}
              {results.map((result, index) => (
                <ResultCard key={result.id} result={result} rank={index + 1} lineColor={selectedLine.color} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
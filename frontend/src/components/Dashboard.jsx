import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Watchlist from './Watchlist';
import SentimentChart from './SentimentChart';
import SentimentBreakdown from './SentimentBreakdown';
import NewsFeed from './NewsFeed';
import { Activity, TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, Bell, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  
  // Primary ticker data
  const [sentimentData, setSentimentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Comparison mode states
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonTicker, setComparisonTicker] = useState('');
  const [comparisonData, setComparisonData] = useState([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watchlist`);
      setWatchlistStocks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSentimentData = async (ticker) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/sentiment/${ticker}`);
      if (res.data.length === 0) {
        const fresh = await axios.post(`${API_BASE}/sentiment/fetch/${ticker}`);
        setSentimentData([fresh.data]);
      } else {
        setSentimentData(res.data);
      }
    } catch (err) {
      console.error("Error fetching sentiment:", err);
      setSentimentData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async (ticker) => {
    setLoadingCompare(true);
    try {
      const res = await axios.get(`${API_BASE}/sentiment/${ticker}`);
      if (res.data.length === 0) {
        const fresh = await axios.post(`${API_BASE}/sentiment/fetch/${ticker}`);
        setComparisonData([fresh.data]);
      } else {
        setComparisonData(res.data);
      }
    } catch (err) {
      console.error("Error fetching comparison sentiment:", err);
      setComparisonData([]);
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedTicker || refreshing) return;
    setRefreshing(true);
    try {
      await axios.post(`${API_BASE}/sentiment/fetch/${selectedTicker}`);
      await fetchSentimentData(selectedTicker);
      if (compareMode && comparisonTicker) {
        await axios.post(`${API_BASE}/sentiment/fetch/${comparisonTicker}`);
        await fetchComparisonData(comparisonTicker);
      }
      fetchWatchlist(); // refresh thresholds/watchlist details
    } catch (err) {
      console.error("Error refreshing:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [selectedTicker]);

  useEffect(() => {
    if (selectedTicker) {
      fetchSentimentData(selectedTicker);
      // Reset comparison when primary changes
      setComparisonTicker('');
      setComparisonData([]);
      setCompareMode(false);
    }
  }, [selectedTicker]);

  useEffect(() => {
    if (compareMode && comparisonTicker) {
      fetchComparisonData(comparisonTicker);
    } else {
      setComparisonData([]);
    }
  }, [compareMode, comparisonTicker]);

  // Calculate stats for primary ticker
  const latestData = sentimentData[0];
  const avgScore = latestData?.averageScore || 0;
  const totalArticles = latestData?.totalArticles || 0;
  const sentimentLabel = avgScore >= 0.05 ? 'Positive' : avgScore <= -0.05 ? 'Negative' : 'Neutral';

  // Find active alert details
  const activeStockDetails = watchlistStocks.find(s => s.ticker === selectedTicker);
  const alertThreshold = activeStockDetails?.sentimentAlertThreshold;
  const alertTriggered = alertThreshold !== null && alertThreshold !== undefined && avgScore < alertThreshold;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Watchlist */}
      <div className="lg:col-span-1">
        <Watchlist 
          onSelectTicker={(ticker) => {
            setSelectedTicker(ticker);
            fetchWatchlist();
          }} 
          selectedTicker={selectedTicker} 
        />
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-8">
        {!selectedTicker ? (
          <div className="glass-panel h-96 flex flex-col items-center justify-center text-slate-400">
            <Activity className="w-16 h-16 mb-4 text-slate-600" />
            <h2 className="text-xl font-semibold text-slate-300">No Stock Selected</h2>
            <p>Select or add a stock from the watchlist to view sentiment analysis.</p>
          </div>
        ) : loading ? (
          <div className="glass-panel h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Analyzing sentiment for {selectedTicker}...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {selectedTicker}{' '}
                  <span className="text-slate-400 font-medium text-xl">Overview</span>
                </h2>
                {activeStockDetails?.companyName && (
                  <p className="text-sm text-slate-400 mt-1">{activeStockDetails.companyName}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Step 4: Comparison toggles */}
                <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 gap-2">
                  <label className="text-xs text-slate-400 font-medium cursor-pointer" htmlFor="compare-toggle">
                    Compare
                  </label>
                  <input
                    id="compare-toggle"
                    type="checkbox"
                    checked={compareMode}
                    onChange={(e) => {
                      setCompareMode(e.target.checked);
                      if (!e.target.checked) {
                        setComparisonTicker('');
                        setComparisonData([]);
                      }
                    }}
                    className="w-4 h-4 rounded accent-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  {compareMode && (
                    <select
                      value={comparisonTicker}
                      onChange={(e) => setComparisonTicker(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 ml-1"
                    >
                      <option value="">Select stock...</option>
                      {watchlistStocks
                        .filter(s => s.ticker !== selectedTicker)
                        .map(s => (
                          <option key={s.ticker} value={s.ticker}>
                            {s.ticker}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 text-sm bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 px-4 py-2 rounded-lg transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Step 5: Alerts warnings */}
            {alertTriggered && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 animate-pulse">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-rose-500" />
                <div>
                  <h4 className="font-bold text-sm">Sentiment Alert Triggered</h4>
                  <p className="text-xs text-rose-300/90 mt-0.5">
                    The average sentiment score for {selectedTicker} ({avgScore.toFixed(4)}) has fallen below your custom alert threshold of {alertThreshold.toFixed(2)}.
                  </p>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Current Sentiment</p>
                <div className="flex items-center gap-2">
                  {sentimentLabel === 'Positive' ? (
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  ) : sentimentLabel === 'Negative' ? (
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                  ) : (
                    <Minus className="w-6 h-6 text-slate-400" />
                  )}
                  <span className={`text-2xl font-bold ${
                    sentimentLabel === 'Positive' ? 'text-emerald-400' :
                    sentimentLabel === 'Negative' ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {sentimentLabel}
                  </span>
                </div>
              </div>

              <div className="glass-panel p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Compound Score</p>
                <p className={`text-2xl font-bold ${
                  avgScore >= 0.05 ? 'text-emerald-400' :
                  avgScore <= -0.05 ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {avgScore.toFixed(4)}
                </p>
              </div>

              <div className="glass-panel p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Articles Analyzed</p>
                <p className="text-2xl font-bold text-cyan-400">{totalArticles}</p>
              </div>
            </div>

            {/* Main Graphs Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Step 4: Line Chart (taking 2/3 cols) */}
              <div className="glass-panel p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Sentiment Trend
                  {compareMode && comparisonTicker && (
                    <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded ml-2">
                      Comparing: {selectedTicker} vs {comparisonTicker}
                    </span>
                  )}
                </h3>
                <div className="h-72">
                  {loadingCompare ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                    </div>
                  ) : (
                    <SentimentChart 
                      data={sentimentData} 
                      comparisonData={comparisonData}
                      primaryTicker={selectedTicker}
                      comparisonTicker={comparisonTicker}
                    />
                  )}
                </div>
              </div>

              {/* Step 3: Breakdown Doughnut (taking 1/3 col) */}
              <div className="glass-panel p-6 lg:col-span-1">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  Article Sentiment Mix
                </h3>
                <div className="h-72">
                  <SentimentBreakdown articles={latestData?.articles || []} />
                </div>
              </div>
            </div>

            {/* News Feed Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">Recent Articles Analyzed</h3>
              <NewsFeed articles={latestData?.articles || []} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Watchlist from './Watchlist';
import SentimentChart from './SentimentChart';
import SentimentBreakdown from './SentimentBreakdown';
import NewsFeed from './NewsFeed';
import { API_BASE } from '../config/apiConfig';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Metric } from './ui/Metric';
import {
  Activity, TrendingUp, TrendingDown, RefreshCw, BarChart2,
  AlertTriangle, Info, Zap, Gauge, PieChart, LineChart
} from 'lucide-react';

const SENTIMENT_THRESHOLD = 0.05;

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

  // Analytics
  const [analytics, setAnalytics] = useState(null);

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

  const fetchAnalytics = async (ticker) => {
    try {
      const res = await axios.get(`${API_BASE}/analytics/${ticker}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setAnalytics(null);
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
      await fetchAnalytics(selectedTicker);
      if (compareMode && comparisonTicker) {
        await axios.post(`${API_BASE}/sentiment/fetch/${comparisonTicker}`);
        await fetchComparisonData(comparisonTicker);
      }
      fetchWatchlist();
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
      fetchAnalytics(selectedTicker);
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

  const latestData = sentimentData[0];
  const avgScore = latestData?.averageScore || 0;
  const totalArticles = latestData?.totalArticles || 0;
  const sentimentLabel = avgScore >= SENTIMENT_THRESHOLD ? 'Positive' : avgScore <= -SENTIMENT_THRESHOLD ? 'Negative' : 'Neutral';
  const sentimentVariant = sentimentLabel.toLowerCase();
  const explainability = latestData?.explainability;
  const marketData = latestData?.marketData;

  const activeStockDetails = watchlistStocks.find(s => s.ticker === selectedTicker);
  const alertThreshold = activeStockDetails?.sentimentAlertThreshold;
  const alertTriggered = alertThreshold != null && avgScore < alertThreshold;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full animate-fade-in">
      {/* Main Content Area */}
      <div className="xl:col-span-9 flex flex-col gap-6 h-full pb-8">
        {!selectedTicker ? (
          <Card className="flex flex-col items-center justify-center text-text-secondary h-full min-h-[400px]">
            <Activity className="w-16 h-16 mb-4 opacity-50 text-accent animate-pulse-slow" />
            <h2 className="text-xl font-bold text-text-primary">No Asset Selected</h2>
            <p className="mt-2 text-sm">Select or add a stock from the watchlist to initialize the terminal.</p>
          </Card>
        ) : loading ? (
          <Card className="h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-sm font-mono text-text-secondary uppercase tracking-wider">Processing Data Stream...</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Header / Actions - Main Hero */}
            <Card className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl font-bold text-text-primary tracking-tight">
                    {selectedTicker}
                  </h2>
                  {marketData && (
                    <span className="text-3xl font-mono text-text-primary tracking-tight">
                      ${marketData.price.toFixed(2)}
                    </span>
                  )}
                  <Badge variant={sentimentVariant}>{sentimentLabel} SIGNAL</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span className="font-medium tracking-wide">
                    {activeStockDetails?.companyName || 'Stock Overview'}
                  </span>
                  {marketData ? (
                    <span className="flex items-center gap-1 font-mono text-text-primary bg-background border border-border px-2 py-1 rounded-md">
                      {marketData.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-positive" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-negative" />
                      )}
                      <span className={marketData.changePercent >= 0 ? 'text-positive' : 'text-negative'}>
                        {Math.abs(marketData.changePercent).toFixed(2)}%
                      </span>
                      <span className="text-text-secondary text-[10px]">LIVE</span>
                    </span>
                  ) : analytics?.dailyChange !== undefined && (
                    <span className="flex items-center gap-1 font-mono text-text-primary bg-background border border-border px-2 py-1 rounded-md">
                      {analytics.dailyChange >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-positive" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-negative" />
                      )}
                      <span className={analytics.dailyChange >= 0 ? 'text-positive' : 'text-negative'}>
                        {Math.abs(analytics.dailyChange).toFixed(2)}%
                      </span>
                      <span className="text-text-secondary text-[10px]">24H</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="flex items-center bg-background border border-border rounded-lg p-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary px-3 cursor-pointer" htmlFor="compare-toggle">
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
                    className="w-4 h-4 rounded text-accent focus:ring-accent bg-card border-border cursor-pointer"
                  />
                  {compareMode && (
                    <select
                      value={comparisonTicker}
                      onChange={(e) => setComparisonTicker(e.target.value)}
                      className="bg-transparent border-none text-sm font-mono text-text-primary focus:ring-0 ml-2 py-1"
                    >
                      <option value="" className="bg-card">Select...</option>
                      {watchlistStocks
                        .filter(s => s.ticker !== selectedTicker)
                        .map(s => (
                          <option key={s.ticker} value={s.ticker} className="bg-card">
                            {s.ticker}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="interactive-btn flex items-center gap-2 text-sm font-semibold bg-accent text-background hover:bg-accent/90 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </Card>

            {/* Alerts warnings */}
            {alertTriggered && (
              <div className="bg-negative/10 border border-negative/30 rounded-xl p-4 flex items-center gap-4 animate-fade-in shrink-0">
                <div className="w-10 h-10 rounded-full bg-negative/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-negative" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary">CRITICAL: Sentiment Alert Triggered</h4>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Average sentiment score ({avgScore.toFixed(4)}) is below threshold ({alertThreshold.toFixed(2)}).
                  </p>
                </div>
              </div>
            )}

            {/* KPI Grid */}
            {analytics && analytics.dataPoints > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <Metric 
                  title="7D Trend" 
                  value={analytics.trend7d !== null ? Math.abs(analytics.trend7d).toFixed(4) : null}
                  trend={analytics.trend7d}
                  icon={Activity}
                />
                <Metric 
                  title="30D Trend" 
                  value={analytics.trend30d !== null ? Math.abs(analytics.trend30d).toFixed(4) : null}
                  trend={analytics.trend30d}
                  icon={Activity}
                />
                <Metric 
                  title="Volatility" 
                  value={analytics.volatility !== null ? analytics.volatility.toFixed(4) : null}
                  icon={Gauge}
                />
                <Metric 
                  title="Volume" 
                  value={totalArticles}
                  trendLabel="Sources"
                  icon={BarChart2}
                />
              </div>
            )}

            {/* Composite & Distribution Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              {/* Composite Score */}
              <Card className="flex flex-col items-center justify-center relative min-h-[220px]">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider absolute top-4 left-6">AI Composite</h3>
                <div className="relative w-32 h-32 mt-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-border" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2"></path>
                    <path 
                      className={avgScore >= SENTIMENT_THRESHOLD ? 'text-positive' : avgScore <= -SENTIMENT_THRESHOLD ? 'text-negative' : 'text-warning'} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeDasharray={`${Math.abs(avgScore) > 1 ? 100 : Math.abs(avgScore) * 100}, 100`} 
                      strokeLinecap="round" 
                      strokeWidth="2"
                    ></path>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-mono font-bold ${
                      avgScore >= SENTIMENT_THRESHOLD ? 'text-positive' : avgScore <= -SENTIMENT_THRESHOLD ? 'text-negative' : 'text-warning'
                    }`}>
                      {avgScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Explainability / Distribution */}
              <Card className="lg:col-span-2 relative">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-6">Distribution & Signals</h3>
                
                {explainability ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Distribution Bars */}
                    <div className="flex flex-col justify-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-positive w-12">BULL</span>
                        <div className="flex-1 bg-background rounded-full h-2 overflow-hidden border border-border">
                          <div className="bg-positive h-full transition-all duration-1000" style={{ width: `${explainability.breakdown.positivePercent}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-primary w-10 text-right">{explainability.breakdown.positivePercent}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-warning w-12">NEUT</span>
                        <div className="flex-1 bg-background rounded-full h-2 overflow-hidden border border-border">
                          <div className="bg-warning h-full transition-all duration-1000" style={{ width: `${explainability.breakdown.neutralPercent}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-primary w-10 text-right">{explainability.breakdown.neutralPercent}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-negative w-12">BEAR</span>
                        <div className="flex-1 bg-background rounded-full h-2 overflow-hidden border border-border">
                          <div className="bg-negative h-full transition-all duration-1000" style={{ width: `${explainability.breakdown.negativePercent}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-primary w-10 text-right">{explainability.breakdown.negativePercent}%</span>
                      </div>
                    </div>
                    
                    {/* Top Drivers */}
                    <div className="flex flex-col justify-center border-l border-border pl-6">
                      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-3">Key Drivers</p>
                      <div className="space-y-3">
                        {explainability.strongestContributors?.slice(0, 3).map((c, i) => (
                          <div key={i} className="flex items-start gap-2.5 group">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor] ${
                              c.sentimentLabel === 'Positive' ? 'text-positive bg-positive' :
                              c.sentimentLabel === 'Negative' ? 'text-negative bg-negative' : 'text-warning bg-warning'
                            }`} />
                            <span className="text-sm text-text-primary line-clamp-1 group-hover:text-accent transition-colors" title={c.title}>
                              {c.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-text-secondary text-sm">
                    Processing explainability models...
                  </div>
                )}
                
                {explainability?.confidence && (
                  <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded text-accent border border-accent/20">
                    <Zap className="w-3 h-3" />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Conf: {(explainability.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Main Graphs Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              <Card className="lg:col-span-2">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-6 flex items-center gap-2">
                  <LineChart className="w-4 h-4" />
                  Historical Trend
                </h3>
                <div className="h-[280px]">
                  {loadingCompare ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
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
              </Card>

              <Card>
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-6 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Source Density
                </h3>
                <div className="h-[280px] flex items-center justify-center">
                  <SentimentBreakdown articles={latestData?.articles || []} />
                </div>
              </Card>
            </div>

            {/* News Feed Section */}
            <Card noPadding className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
              <div className="px-6 py-4 border-b border-border bg-card/50">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  Data Streams
                </h3>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-background/30">
                <NewsFeed articles={latestData?.articles || []} />
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Sidebar: Watchlist */}
      <div className="xl:col-span-3 flex flex-col h-full overflow-hidden animate-fade-in">
        <Watchlist
          onSelectTicker={(ticker) => {
            setSelectedTicker(ticker);
            fetchWatchlist();
          }}
          selectedTicker={selectedTicker}
        />
      </div>
    </div>
  );
}

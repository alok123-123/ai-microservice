import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Metric } from '../components/ui/Metric';
import { FileText, Search, AlertCircle, Calendar } from 'lucide-react';
import { API_BASE } from '../config/apiConfig';

export default function Reports() {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await axios.get(`${API_BASE}/watchlist`, { withCredentials: true });
        setWatchlist(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load watchlist for quick select', err);
      }
    };
    fetchWatchlist();
  }, []);

  const fetchReport = async (e) => {
    e.preventDefault();
    if (!selectedTicker) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.get(`${API_BASE}/reports/${selectedTicker}`, { withCredentials: true });
      if (res.data && typeof res.data === 'object') {
        setReportData(res.data);
      }
    } catch (err) {
      const errorResponse = err.response?.data?.error;
      const errorMessage = typeof errorResponse === 'object' ? errorResponse.message : errorResponse;
      setError(errorMessage || 'Failed to fetch report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Executive Reports</h1>
        <p className="text-sm font-mono text-text-secondary uppercase tracking-widest mt-1">Generate 30-Day Sentiment Analysis</p>
      </div>

      <Card className="p-6">
        <form onSubmit={fetchReport} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Enter ticker (e.g., AAPL)"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
              className="w-full bg-background border border-border focus:border-accent rounded-lg pl-10 pr-4 py-3 font-mono text-sm uppercase"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="interactive-btn bg-accent text-background font-bold px-6 py-3 rounded-lg flex items-center gap-2 uppercase tracking-wider text-sm"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>
        
        {Array.isArray(watchlist) && watchlist.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-text-secondary mt-1">Quick Select:</span>
            {watchlist.map(item => (
              <button
                key={item.ticker}
                type="button"
                onClick={() => setSelectedTicker(item.ticker)}
                className="text-xs font-mono px-2 py-1 bg-background border border-border rounded hover:border-accent transition-colors"
              >
                {item.ticker}
              </button>
            ))}
          </div>
        )}
      </Card>

      {error && (
        <div className="flex items-center gap-3 bg-negative/10 border border-negative/30 text-negative px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {reportData && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-3xl font-bold font-mono tracking-tight">{reportData.ticker}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="neutral" className="font-mono"><Calendar className="w-3 h-3 mr-1"/> 30D Analysis</Badge>
                <Badge variant={reportData.trendDirection === 'BULLISH' ? 'positive' : reportData.trendDirection === 'BEARISH' ? 'negative' : 'neutral'} className="font-mono">
                  {reportData.trendDirection} TREND
                </Badge>
              </div>
            </div>
            <FileText className="w-12 h-12 text-border" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric 
              label="Avg Sentiment" 
              value={reportData.averageSentiment.toFixed(3)}
              trend={reportData.averageSentiment > 0 ? 'up' : 'down'}
            />
            <Metric 
              label="Total Vol" 
              value={reportData.totalArticlesAnalyzed} 
            />
            <Metric 
              label="Volatility (SD)" 
              value={reportData.volatility.toFixed(3)} 
            />
            <Metric 
              label="7D vs Prev 7D" 
              value={`${reportData.trendShift > 0 ? '+' : ''}${reportData.trendShift.toFixed(2)}`}
              trend={reportData.trendShift > 0 ? 'up' : 'down'}
            />
          </div>

          <Card className="p-6">
            <h3 className="font-bold mb-4 uppercase tracking-wider text-sm text-text-secondary border-b border-border pb-2">Historical Log (Recent 5)</h3>
            <div className="space-y-3">
              {reportData.history.slice(-5).reverse().map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="text-text-secondary">{new Date(h.date).toLocaleDateString()}</span>
                  <span className={h.score > 0 ? 'text-positive' : 'text-negative'}>{h.score.toFixed(3)}</span>
                  <span className="text-text-secondary">{h.articles} articles</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

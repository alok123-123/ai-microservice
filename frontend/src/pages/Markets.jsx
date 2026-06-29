import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { TrendingUp, TrendingDown, Activity, Globe } from 'lucide-react';
import { API_BASE } from '../config/apiConfig';

export default function Markets() {
  const [data, setData] = useState({ topBullish: [], topBearish: [], mostActive: [], totalTracked: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await axios.get(`${API_BASE}/markets/overview`, { withCredentials: true });
        if (res.data && typeof res.data === 'object') {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching market data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>;
  }

  const renderStockList = (stocks, trend) => {
    if (!Array.isArray(stocks) || stocks.length === 0) return <p className="text-text-secondary text-sm font-mono p-4">No data available</p>;
    
    return (
      <div className="divide-y divide-border">
        {stocks.map((stock, i) => (
          <div key={i} className="flex items-center justify-between p-4 hover:bg-card-hover transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-text-secondary font-mono text-xs w-4">{i + 1}</span>
              <span className="font-bold font-mono text-lg">{stock.ticker}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-text-secondary">{stock.totalArticles} srcs</span>
              <Badge variant={trend} className="font-mono w-24 justify-center">
                {stock.latestScore > 0 ? '+' : ''}{stock.latestScore?.toFixed(2)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-sm font-mono text-text-secondary uppercase tracking-widest mt-1">Aggregated Sentiment Data</p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent" />
          <span className="text-xs font-mono text-accent">{data.totalTracked} Assets Tracked Globally</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2 bg-positive/5">
            <TrendingUp className="w-5 h-5 text-positive" />
            <h2 className="font-bold text-positive">Top Bullish</h2>
          </div>
          {renderStockList(data.topBullish, 'positive')}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2 bg-negative/5">
            <TrendingDown className="w-5 h-5 text-negative" />
            <h2 className="font-bold text-negative">Top Bearish</h2>
          </div>
          {renderStockList(data.topBearish, 'negative')}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2 bg-accent/5">
            <Activity className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-accent">Most Active</h2>
          </div>
          {renderStockList(data.mostActive, 'neutral')}
        </Card>
      </div>
    </div>
  );
}

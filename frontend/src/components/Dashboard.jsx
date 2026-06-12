import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Watchlist from './Watchlist';
import SentimentChart from './SentimentChart';
import NewsFeed from './NewsFeed';
import { Activity } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [sentimentData, setSentimentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSentimentData = async (ticker) => {
    setLoading(true);
    try {
      // Fetch historical sentiment
      const res = await axios.get(`${API_BASE}/sentiment/${ticker}`);
      if (res.data.length === 0) {
        // Trigger a fresh fetch if no data
        const fresh = await axios.post(`${API_BASE}/sentiment/fetch/${ticker}`);
        setSentimentData([fresh.data]);
      } else {
        setSentimentData(res.data);
      }
    } catch (err) {
      console.error("Error fetching sentiment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicker) {
      fetchSentimentData(selectedTicker);
    }
  }, [selectedTicker]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar: Watchlist */}
      <div className="lg:col-span-1">
        <Watchlist onSelectTicker={setSelectedTicker} selectedTicker={selectedTicker} />
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            {/* Header for Selected Ticker */}
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">
                {selectedTicker} <span className="text-slate-400 font-medium text-xl">Sentiment Overview</span>
              </h2>
            </div>

            {/* Chart Section */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Sentiment Trend
              </h3>
              <div className="h-72">
                <SentimentChart data={sentimentData} />
              </div>
            </div>

            {/* News Feed Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">Recent Articles Analyzed</h3>
              <NewsFeed articles={sentimentData[0]?.articles || []} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

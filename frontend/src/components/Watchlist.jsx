import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, BarChart2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Watchlist({ onSelectTicker, selectedTicker }) {
  const [stocks, setStocks] = useState([]);
  const [newTicker, setNewTicker] = useState('');

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watchlist`);
      setStocks(res.data);
      if (res.data.length > 0 && !selectedTicker) {
        onSelectTicker(res.data[0].ticker);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    try {
      await axios.post(`${API_BASE}/watchlist`, { ticker: newTicker.toUpperCase() });
      setNewTicker('');
      fetchWatchlist();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding stock');
    }
  };

  const handleRemoveStock = async (ticker, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/watchlist/${ticker}`);
      if (selectedTicker === ticker) {
        onSelectTicker(null);
      }
      fetchWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold">Watchlist</h2>
      </div>

      <form onSubmit={handleAddStock} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ticker (e.g. AAPL)"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-100 placeholder-slate-500"
        />
        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {stocks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center mt-4">Your watchlist is empty.</p>
        ) : (
          stocks.map((stock) => (
            <div
              key={stock.ticker}
              onClick={() => onSelectTicker(stock.ticker)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                selectedTicker === stock.ticker
                  ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-800/50 border-transparent hover:bg-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${selectedTicker === stock.ticker ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-600'}`}></div>
                <div>
                  <div className="font-bold text-slate-200 tracking-wide">{stock.ticker}</div>
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveStock(stock.ticker, e)}
                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

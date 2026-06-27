import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, BarChart2, Bell } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Watchlist({ onSelectTicker, selectedTicker }) {
  const [stocks, setStocks] = useState([]);
  const [newTicker, setNewTicker] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Auto-complete states
  const [tickerMap, setTickerMap] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Alert states
  const [alertThresholds, setAlertThresholds] = useState({});

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watchlist`);
      setStocks(res.data);
      if (res.data.length > 0 && !selectedTicker) {
        onSelectTicker(res.data[0].ticker);
      }
      
      // Load thresholds into state
      const thresholds = {};
      res.data.forEach(s => {
        if (s.sentimentAlertThreshold !== undefined) {
          thresholds[s.ticker] = s.sentimentAlertThreshold;
        }
      });
      setAlertThresholds(thresholds);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailableTickers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/watchlist/tickers`);
      setTickerMap(res.data.tickers || {});
    } catch (err) {
      console.error("Failed to load auto-complete tickers:", err);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchAvailableTickers();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewTicker(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    const query = val.toUpperCase();
    const matches = Object.entries(tickerMap)
      .filter(([ticker, name]) => 
        ticker.includes(query) || name.toUpperCase().includes(query)
      )
      .slice(0, 5); // limit to top 5 suggestions

    setSuggestions(matches);
    setShowDropdown(true);
  };

  const handleSelectSuggestion = (ticker) => {
    setNewTicker(ticker);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleAddStock = async (e) => {
    if (e) e.preventDefault();
    if (!newTicker.trim()) return;
    
    const tickerUpper = newTicker.toUpperCase().strip ? newTicker.toUpperCase().strip() : newTicker.toUpperCase().trim();
    setAdding(true);
    try {
      const companyName = tickerMap[tickerUpper] || '';
      await axios.post(`${API_BASE}/watchlist`, { ticker: tickerUpper, companyName });
      toast.success(`${tickerUpper} added to watchlist`);
      setNewTicker('');
      setSuggestions([]);
      setShowDropdown(false);
      fetchWatchlist();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error adding stock');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStock = async (ticker, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/watchlist/${ticker}`);
      toast.success(`${ticker} removed from watchlist`);
      if (selectedTicker === ticker) {
        onSelectTicker(null);
      }
      fetchWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  // Step 5: Alerts threshold configuration
  const handleUpdateThreshold = async (ticker, thresholdVal) => {
    try {
      const numVal = parseFloat(thresholdVal);
      if (isNaN(numVal) || numVal < -1 || numVal > 1) {
        toast.error("Threshold must be between -1.0 and 1.0");
        return;
      }

      await axios.put(`${API_BASE}/watchlist/threshold/${ticker}`, {
        sentimentAlertThreshold: numVal
      });
      setAlertThresholds(prev => ({ ...prev, [ticker]: numVal }));
      toast.success(`Alert set for ${ticker} when sentiment < ${numVal}`);
    } catch (err) {
      toast.error("Failed to update alert threshold");
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold">Watchlist</h2>
      </div>

      <div className="relative mb-6" ref={dropdownRef}>
        <form onSubmit={handleAddStock} className="flex gap-2">
          <input
            type="text"
            placeholder="Add ticker (e.g. AAPL)"
            value={newTicker}
            onChange={handleInputChange}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className={`w-5 h-5 ${adding ? 'animate-spin' : ''}`} />
          </button>
        </form>

        {/* Dynamic Auto-Complete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700/80 rounded-lg shadow-xl overflow-hidden z-50">
            {suggestions.map(([ticker, name]) => (
              <div
                key={ticker}
                onClick={() => handleSelectSuggestion(ticker)}
                className="px-4 py-2 hover:bg-slate-700/50 cursor-pointer flex justify-between items-center text-sm transition-colors"
              >
                <span className="font-bold text-slate-200">{ticker}</span>
                <span className="text-xs text-slate-400 truncate max-w-[150px]">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {stocks.length === 0 ? (
          <div className="text-center mt-8">
            <BarChart2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Your watchlist is empty.</p>
            <p className="text-xs text-slate-600 mt-1">Add a stock ticker above to get started.</p>
          </div>
        ) : (
          stocks.map((stock) => {
            const currentThreshold = alertThresholds[stock.ticker] !== undefined ? alertThresholds[stock.ticker] : '';
            return (
              <div
                key={stock._id}
                onClick={() => onSelectTicker(stock.ticker)}
                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 border flex flex-col gap-2 ${
                  selectedTicker === stock.ticker
                    ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-800/50 border-transparent hover:bg-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                      selectedTicker === stock.ticker
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                        : 'bg-slate-600'
                    }`}></div>
                    <div>
                      <div className="font-bold text-slate-200 tracking-wide">{stock.ticker}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{stock.companyName}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveStock(stock.ticker, e)}
                    className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Step 5: Alerts configuration inline on hover/select */}
                <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Bell className="w-3 h-3 text-cyan-400" />
                    <span>Alert if compound &lt;</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="-1"
                    max="1"
                    placeholder="None"
                    value={currentThreshold}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleUpdateThreshold(stock.ticker, e.target.value)}
                    className="w-12 bg-slate-900/80 border border-slate-750 text-[10px] text-center rounded px-1 py-0.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

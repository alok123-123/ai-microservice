import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, BarChart2, Bell, BellRing, Search } from 'lucide-react';
import { API_BASE } from '../config/apiConfig';

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
      .slice(0, 5);

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
    
    const tickerUpper = newTicker.toUpperCase().trim();
    setAdding(true);
    try {
      const companyName = tickerMap[tickerUpper] || '';
      await axios.post(`${API_BASE}/watchlist`, { ticker: tickerUpper, companyName });
      toast.success(`${tickerUpper} added to watchlist`, { icon: '✨' });
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
      toast.success(`${ticker} removed`);
      if (selectedTicker === ticker) {
        onSelectTicker(null);
      }
      fetchWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

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
      toast.success(`Alert set for ${ticker}`);
    } catch (err) {
      toast.error("Failed to update alert threshold");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border shadow-glass overflow-hidden">
      <div className="p-4 border-b border-border bg-card/50 shrink-0">
        <form onSubmit={handleAddStock} className="relative group" ref={dropdownRef}>
          <div className="flex items-center w-full h-10 bg-background border border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent rounded-lg transition-all overflow-hidden">
            <Search className="w-4 h-4 ml-3 text-text-secondary group-focus-within:text-accent" />
            <input
              type="text"
              placeholder="Add Ticker..."
              value={newTicker}
              onChange={handleInputChange}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              className="w-full bg-transparent border-none px-3 text-sm text-text-primary placeholder-text-secondary focus:ring-0 outline-none uppercase font-mono"
            />
            <button
              type="submit"
              disabled={adding || !newTicker.trim()}
              className="mr-1 interactive-btn p-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <Plus className={`w-4 h-4 ${adding ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-glass-hover overflow-hidden z-50">
              {suggestions.map(([ticker, name]) => (
                <div
                  key={ticker}
                  onClick={() => handleSelectSuggestion(ticker)}
                  className="px-4 py-3 hover:bg-card-hover cursor-pointer flex justify-between items-center transition-colors border-b border-border/50 last:border-0"
                >
                  <span className="text-sm font-mono font-bold text-text-primary">{ticker}</span>
                  <span className="text-xs text-text-secondary truncate max-w-[140px]">{name}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {stocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-3">
              <BarChart2 className="w-6 h-6 text-text-secondary opacity-50" />
            </div>
            <p className="text-sm text-text-secondary">Watchlist empty</p>
          </div>
        ) : (
          stocks.map((stock) => {
            const currentThreshold = alertThresholds[stock.ticker] !== undefined ? alertThresholds[stock.ticker] : '';
            const isSelected = selectedTicker === stock.ticker;
            const hasAlert = currentThreshold !== '';

            return (
              <div
                key={stock._id}
                onClick={() => onSelectTicker(stock.ticker)}
                className={`group cursor-pointer transition-all flex flex-col relative overflow-hidden rounded-xl border ${
                  isSelected
                    ? 'bg-card border-accent/30 shadow-[0_4px_20px_rgba(22,224,189,0.05)]'
                    : 'bg-background border-border hover:bg-card-hover hover:border-border-hover'
                }`}
              >
                {isSelected && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent"></div>
                )}

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-bold text-text-primary">{stock.ticker}</span>
                        {hasAlert && <BellRing className="w-3 h-3 text-warning" />}
                      </div>
                      <div className="text-[11px] text-text-secondary truncate max-w-[150px] font-medium mt-0.5">
                        {stock.companyName}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveStock(stock.ticker, e)}
                      className="p-1.5 text-text-secondary hover:text-negative hover:bg-negative/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
                      <Bell className="w-3.5 h-3.5" />
                      <span>Alert &lt;</span>
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
                      className="w-14 bg-background border border-border hover:border-accent focus:border-accent text-xs font-mono text-center rounded-md px-1 py-1 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

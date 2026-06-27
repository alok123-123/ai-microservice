import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { LogOut, User, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                SentimentAnalyzer
              </span>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-slate-300 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400 transition-colors bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-700/50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>
    </div>
  );
}

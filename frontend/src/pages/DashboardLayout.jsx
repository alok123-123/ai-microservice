import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  Search, 
  Bell, 
  LayoutDashboard, 
  LineChart, 
  FileText, 
  Settings,
  Activity
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Markets', path: '/markets', icon: LineChart },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="bg-background min-h-screen flex flex-col text-text-primary">
      {/* TopNavBar */}
      <nav className="h-16 fixed top-0 right-0 left-0 md:left-[260px] z-40 flex justify-between items-center px-6 bg-card/50 backdrop-blur-xl border-b border-border transition-all">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight md:hidden">TERMINAL</span>
        </div>

        {/* Command Palette Search */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          <div className="relative flex items-center w-full h-10 rounded-lg bg-background border border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all group">
            <Search className="w-4 h-4 ml-3 text-text-secondary group-focus-within:text-accent" />
            <input 
              className="w-full bg-transparent border-none text-sm text-text-primary placeholder-text-secondary focus:ring-0 px-3 h-full outline-none" 
              placeholder="Search Ticker, Sector, or Keyword (Ctrl+K)" 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-positive animate-pulse-slow"></div>
            <span className="text-xs font-mono text-text-secondary uppercase tracking-wider">System Online</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-card-hover transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-accent rounded-full"></span>
            </button>
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent/10 text-accent font-bold text-sm uppercase cursor-pointer border border-accent/20 hover:bg-accent/20 transition-colors" title={user?.name}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="w-[260px] h-full fixed left-0 top-0 bg-background border-r border-border hidden md:flex flex-col py-6 z-50">
        {/* Brand / Header */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-premium border border-accent/20 flex items-center justify-center shadow-[0_0_15px_rgba(22,224,189,0.15)]">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TERMINAL</h1>
            <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-0.5">AI Sentiment</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-left group ${isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-card hover:text-text-primary'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'group-hover:text-text-primary transition-colors'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Tabs */}
        <div className="px-4 pb-2 mt-auto space-y-1.5">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-left group ${isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-card hover:text-text-primary'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'group-hover:text-text-primary transition-colors'}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary font-medium hover:bg-card hover:text-negative transition-colors text-left group">
            <LogOut className="w-4 h-4 group-hover:text-negative transition-colors" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <main className="md:ml-[260px] mt-16 p-6 h-[calc(100vh-64px)] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

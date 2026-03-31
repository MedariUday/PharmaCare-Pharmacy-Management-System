import React from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

export default function Navbar({ title }) {
  const { user } = useAuth();
  const { toggleSidebar, isSidebarOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4"
      style={{ borderBottom: '1px solid rgba(99,102,241,0.1)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)' }}>
      
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-[150px] sm:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Responsive Search - Hidden on small mobile */}
        <div className="relative hidden md:block group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
          <input
            className="bg-slate-800/40 border border-slate-700/50 text-white placeholder-slate-400 pl-11 pr-4 py-2.5 text-sm rounded-xl focus:bg-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none w-48 lg:w-64 shadow-inner"
            placeholder="Search..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
            <button className="relative p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Bell size={18} style={{ color: '#818cf8' }} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[80px]">
                  {user?.name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-[10px]" style={{ color: '#64748b' }}>{user?.role}</div>
            </div>
            </div>
        </div>
      </div>
    </header>
  );
}

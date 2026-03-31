import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';

export default function MainLayout({ children, title }) {
  const { isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Sidebar - Positioned for responsiveness */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out pl-0 lg:pl-[260px]`}
      >
        <Navbar title={title} />
        
        <main className="flex-1 p-2 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-[#020617]/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}

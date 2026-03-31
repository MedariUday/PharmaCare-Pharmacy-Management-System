import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../context/SidebarContext';

export default function AdminLayout({ 
  children, 
  title, 
  bgClassName = "bg-[#0f172a]", 
  maxW = "max-w-7xl" 
}) {
  const { isSidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className={`flex min-h-screen ${bgClassName} selection:bg-indigo-500/30 overflow-x-visible relative`}>
      {/* Sidebar - Positioned for responsiveness */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out lg:pl-[260px]"
      >
        <Navbar title={title} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className={`${maxW} mx-auto`}>
            {children}
          </div>
        </main>
      </div>

      {/* Overlay Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}

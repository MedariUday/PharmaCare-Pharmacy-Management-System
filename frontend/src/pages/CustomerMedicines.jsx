import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMedicines } from '../services/api';
import { 
  Pill, Search, ChevronLeft, ChevronRight, FilterX, 
  MousePointerClick, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/MainLayout';

/**
 * CUSTOMER MEDICINES PORTAL
 * Unified Premium Dark Theme
 */
export default function CustomerMedicines() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  // Data Loading Implementation
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { 
        search: search.trim().toLowerCase(), 
        category: category, 
        page, 
        limit 
      };
      const response = await getMedicines(params);
      setMedicines(response.data.data || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error("Catalog Load Failure:", error);
      toast.error("Internal service error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  // Debounced Effect for Search & Immediate for Filters
  useEffect(() => {
    const timer = setTimeout(() => load(), 400);
    return () => clearTimeout(timer);
  }, [load]);

  // Event Handlers
  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(1);
  };

  return (
    <MainLayout title="Pharmacy Catalog">
        <div className="pb-24">
           {/* Hero Section */}
           <header className="mb-10 sm:mb-14">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                 <Pill size={32} />
               </div>
               <div>
                 <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase italic">
                   Browse Products
                 </h1>
                 <p className="text-slate-400 font-medium lowercase tracking-wide">Find the right treatment and view availability in real-time.</p>
               </div>
             </div>
           </header>

           {/* Filter & Search Bar */}
           <div className="flex flex-col md:flex-row gap-4 mb-10">
              <div className="relative flex-1 group">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search by name, category or manufacturer..." 
                  className="w-full pl-14 pr-6 py-4.5 bg-slate-900 border border-white/5 rounded-[1.25rem] shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-white placeholder:text-slate-600 uppercase italic text-xs"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <div className="relative min-w-[240px]">
                <select 
                  className="w-full appearance-none px-6 py-4.5 bg-slate-900 border border-white/5 rounded-[1.25rem] shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-white uppercase italic text-xs cursor-pointer"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="all">All Products</option>
                  <option value="Analgesic">Pain Relief</option>
                  <option value="Antipyretic">Fever Relief</option>
                  <option value="Antibiotic">Antibiotics</option>
                  <option value="Multivitamin">Vitamins</option>
                  <option value="Antihypertensive">Blood Pressure</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
           </div>

           {/* Product Grid State Handling */}
           {loading ? (
             <MedicineSkeletonGrid />
           ) : medicines.length > 0 ? (
             <>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                 {medicines.map(med => (
                   <MedicineCatalogCard key={med.id} med={med} />
                 ))}
               </div>

               <PaginationFooter 
                 page={page} 
                 totalPages={totalPages} 
                 onPrev={() => setPage(p => Math.max(1, p - 1))}
                 onNext={() => setPage(p => Math.min(totalPages, p + 1))}
               />
             </>
           ) : (
             <EmptyCatalogState onReset={resetFilters} />
           )}
        </div>
    </MainLayout>
  );
}

/** 
 * UI SUB-COMPONENTS 
 */

function MedicineCatalogCard({ med }) {
  return (
    <div className="group bg-slate-800/20 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 p-6">
         <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${med.stock > 0 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
           {med.stock > 0 ? 'Optimal Stock' : 'Depleted'}
         </span>
      </div>
      
      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform border border-emerald-500/20 shadow-inner">
         <Pill size={24} />
      </div>

      <div className="flex-1">
        <h3 className="font-black text-xl text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight leading-tight mb-1 italic">
          {med.name}
        </h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
          {med.category}
        </p>

        <div className="flex items-center gap-2 mb-6">
          <div className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {med.manufacturer || 'General'}
          </div>
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/5 mt-auto">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">Unit Value</p>
            <p className="text-3xl font-black text-white leading-none flex items-center italic">
              <span className="text-sm font-bold mr-0.5 not-italic">₹</span>{med.selling_price || med.price}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors border border-white/5">
            <MousePointerClick size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaginationFooter({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="mt-16 flex items-center justify-center gap-6 relative z-10">
      <button 
        disabled={page === 1}
        onClick={onPrev}
        className="group w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed hover:bg-emerald-500 hover:scale-105 transition-all active:scale-95"
      >
        <ChevronLeft size={24} className="text-white" />
      </button>
      
      <div className="bg-slate-900 px-8 py-3.5 rounded-2xl border border-white/5 shadow-inner flex items-center gap-3">
        <span className="font-black text-white tracking-tight text-lg italic">
          {String(page).padStart(2, '0')}
        </span>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <span className="font-bold text-slate-600 tracking-tight">
          {String(totalPages).padStart(2, '0')}
        </span>
      </div>

      <button 
        disabled={page === totalPages}
        onClick={onNext}
        className="group w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed hover:bg-emerald-500 hover:scale-105 transition-all active:scale-95"
      >
        <ChevronRight size={24} className="text-white" />
      </button>
    </div>
  );
}

function EmptyCatalogState({ onReset }) {
  return (
    <div className="text-center py-24 bg-slate-800/10 rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-600 mb-6 border border-white/5">
        <FilterX size={48} />
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 italic">Zero Matches Detected</h2>
      <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto text-sm">
        No pharmaceutical entities identified matching your current query parameters.
      </p>
      <button 
        onClick={onReset} 
        className="px-8 py-4 bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-xl"
      >
        Reset Filter Logic
      </button>
    </div>
  );
}

function MedicineSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="bg-slate-800/20 backdrop-blur-xl p-6 rounded-[2.5rem] h-[320px] animate-pulse border border-white/5 flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 bg-white/5 rounded-2xl mb-6" />
            <div className="w-3/4 h-8 bg-white/5 rounded-lg mb-2" />
            <div className="w-1/2 h-4 bg-white/5 rounded-lg" />
          </div>
          <div className="pt-6 border-t border-white/5 flex justify-between items-end">
            <div className="w-20 h-10 bg-white/5 rounded-lg" />
            <div className="w-10 h-10 bg-white/5 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

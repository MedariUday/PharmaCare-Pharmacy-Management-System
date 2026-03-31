import React, { useState, useEffect } from 'react';
import { getRecommendations, addMedicineToCart } from '../services/api';
import { Sparkles, ShoppingCart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then(res => setRecs(res.data.recommendations || []))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, []);



  if (loading) return (
    <div className="flex gap-4 overflow-hidden animate-pulse mb-12">
      {[1, 2, 3].map(i => (
        <div key={i} className="min-w-[280px] h-48 bg-slate-800/20 rounded-[2.5rem] border border-white/5"></div>
      ))}
    </div>
  );

  if (recs.length === 0) return null;

  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-xl shadow-amber-500/5">
            <Sparkles size={24} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Recommended for You
            </h2>
            <p className="text-slate-400 font-black lowercase tracking-[0.2em] text-[10px] opacity-60 italic">Tailored suggestions based on your clinical history</p>
          </div>
        </div>
        <Link to="/customer/medicines" className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center hover:text-white transition-colors group italic">
          Full Catalog <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-2">
        {recs.map((med) => (
          <div 
            key={med.medicine_id}
            className="min-w-[300px] bg-slate-800/20 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/5 shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all group relative overflow-hidden flex flex-col justify-between h-48"
          >
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 italic">
                {med.reason || 'Smart Pick'}
              </span>
              <h3 className="text-xl font-black text-white mb-1 group-hover:text-indigo-400 transition-colors uppercase italic tracking-tight leading-tight">
                {med.name}
              </h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{med.category}</p>
            </div>
            
            <div className="flex items-center justify-between mt-auto relative z-10 pt-4 border-t border-white/5">
              <span className="text-2xl font-black text-white italic tracking-tighter">
                 <span className="text-xs font-bold mr-0.5 not-italic opacity-50">₹</span>{med.price}
              </span>
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 border border-white/5 transition-colors">
                 <ChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

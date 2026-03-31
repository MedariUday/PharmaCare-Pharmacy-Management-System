import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarClock, ArrowUpRight, ShieldAlert, CheckCircle } from 'lucide-react';

/**
 * UNIFIED ALERT MANAGER COMPONENT
 * Displays a combined list of Expiry and Low Stock alerts with actionable workflows.
 */
export default function AlertManager({ alerts = [], title = "Active Critical Vulnerabilities" }) {
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/5 border-emerald-500/20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-emerald-500">
          <CheckCircle size={32} />
        </div>
        <h4 className="text-white font-black uppercase text-sm tracking-widest">Inventory Fully Optimized</h4>
        <p className="text-slate-500 text-xs mt-1">No critical stock depletions or imminent expirations detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0f172a] z-10 py-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
           <ShieldAlert size={14} className="text-rose-500" /> {title}
        </h3>
        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20">
          {alerts.length} FLAGGED
        </span>
      </div>

      {alerts.map((med, idx) => {
        const isExpiry = med.days_left !== undefined;
        const isCritical = med.status === 'Critical';

        return (
          <div 
            key={`${med.id}-${idx}`} 
            className={`p-5 rounded-[2rem] border transition-all duration-300 group hover:scale-[1.01] ${
              isCritical 
                ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50' 
                : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                  isExpiry ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'
                }`}>
                  {isExpiry ? <CalendarClock size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <h4 className="text-white font-black uppercase text-sm group-hover:text-white transition-colors">
                    {med.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      {isExpiry ? `Expires: ${new Date(med.expiry_date).toLocaleDateString()}` : `Current Stock: ${med.stock}`}
                    </p>
                    <div className={`w-1 h-1 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-xl font-black ${isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
                  {isExpiry ? `${med.days_left}d` : med.stock}
                </p>
                <p className="text-[8px] text-slate-500 uppercase font-black">
                  {isExpiry ? 'Remaining' : 'Units'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
               <button 
                 onClick={() => navigate('/inventory', { state: { search: med.name } })}
                 className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2"
               >
                 Auto-Procure <ArrowUpRight size={12} className="text-indigo-400" />
               </button>
               {isExpiry && (
                 <button className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-rose-500/20">
                   Schedule Disposal
                 </button>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

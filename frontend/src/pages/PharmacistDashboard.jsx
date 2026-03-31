import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { 
  getMedicines, getExpiryAlerts, getLowStockAlerts, getSuppliers, getAlertsSummary 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import InventoryHealthGauge from '../components/InventoryHealthGauge';
import AlertManager from '../components/AlertManager';
import { 
  Pill, AlertTriangle, CalendarClock, Package, 
  Truck, ArrowUpRight, BarChart2, Stethoscope, X as CloseIcon 
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, status }) {
  return (
    <div className="bg-slate-900 border border-white/5 p-5 sm:p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all h-full">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden sm:block">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-lg`} style={{ background: color }}>
          <Icon size={20} color="white" />
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{value}</h3>
        {status && <span className="inline-block mt-2 text-[9px] font-black px-2 py-0.5 rounded bg-white/5 text-slate-400 truncate w-full">{status}</span>}
      </div>
    </div>
  );
}

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [medsRes, expRes, lowRes, supRes, summaryRes] = await Promise.all([
          getMedicines({ limit: 100 }),
          getExpiryAlerts(),
          getLowStockAlerts(),
          getSuppliers(),
          getAlertsSummary()
        ]);
        setMedicines(medsRes?.data?.data || []);
        setExpiryAlerts(expRes?.data?.medicines || []);
        setLowStockAlerts(lowRes?.data?.medicines || []);
        setSuppliers(supRes?.data || []);
        setSummary(summaryRes?.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex min-h-screen bg-slate-950 text-white items-center justify-center font-black uppercase tracking-widest">Initializing Inventory Grid...</div>;

  return (
    <MainLayout title="Pharmacist Portal">
        <div className="mb-6 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">Inventory Sync</h1>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    System Online
                    </div>
                    <div className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                    Last Global Sync: Just Now
                    </div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                onClick={() => setShowManager(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-95"
                >
                    <AlertTriangle size={14} /> Resolve Conflicts
                </button>
                <button 
                onClick={() => navigate('/medicines')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
                >
                    Add New Medication
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-10 overflow-x-hidden">
            <div className="sm:col-span-1">
                <StatCard icon={Pill} label="Catalogue Size" value={medicines.length} color="#6366f1" status="Total unique SKUs" />
            </div>
            <div className="sm:col-span-2 bg-slate-900 border border-white/5 p-5 rounded-3xl flex items-center justify-around shadow-xl">
                <div className="text-center hidden sm:block">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Stock Health</p>
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${summary?.health_score || 0}%` }} />
                    </div>
                    <p className="text-white font-black mt-1 text-lg">{summary?.health_score || 0}%</p>
                </div>
                <div className="scale-75 sm:scale-100">
                    <InventoryHealthGauge score={summary?.health_score || 0} />
                </div>
                <div className="text-center">
                    <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">System Risk</p>
                    <p className={`font-black text-lg sm:text-xl ${summary?.health_score < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {summary?.health_score < 60 ? 'HIGH' : 'LOW'}
                    </p>
                    <p className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">AI Scoring</p>
                </div>
            </div>
            <StatCard icon={CalendarClock} label="Expiry Risk" value={expiryAlerts.length} color="#f59e0b" status={`${expiryAlerts.filter(m => m.status === 'Critical').length} Critical`} />
            <StatCard icon={AlertTriangle} label="Stock Loss" value={lowStockAlerts.length} color="#ef4444" status="Requires Restock" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12">
            <div className="bg-slate-900 border border-white/5 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h3 className="text-lg sm:text-xl font-black text-white italic uppercase flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-yellow-500 rounded-full flex-shrink-0"></span>
                    Expiry Tracker
                    </h3>
                    <button className="text-slate-500 text-[9px] font-black uppercase tracking-widest hover:text-white self-start sm:self-auto">View Statistics</button>
                </div>
                
                <div className="space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {expiryAlerts.length === 0 ? (
                    <div className="text-center py-16 sm:py-20 bg-white/2 rounded-3xl border border-dashed border-white/5">
                        <Stethoscope className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">All meds within safe buffer zone</p>
                    </div>
                    ) : (
                    expiryAlerts.map(med => (
                        <div key={med.id} className="p-4 sm:p-5 rounded-3xl bg-white/2 border border-white/5 group hover:bg-white/5 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl flex-shrink-0 ${med.status === 'Critical' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                    {med.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-white font-black uppercase text-xs sm:text-sm truncate">{med.name}</h4>
                                    <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold">Exp: {new Date(med.expiry_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className={`inline-block px-2.5 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-tight ${med.status === 'Critical' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                    {med.days_left}d left
                                </span>
                            </div>
                            </div>
                        </div>
                    ))
                    )}
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <h3 className="text-lg sm:text-xl font-black text-white italic uppercase flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-red-500 rounded-full flex-shrink-0"></span>
                    Restock Queue
                    </h3>
                    <button className="text-slate-500 text-[9px] font-black uppercase tracking-widest hover:text-white self-start sm:self-auto">Procurement Intel</button>
                </div>
                
                <div className="space-y-4 overflow-x-hidden">
                    {lowStockAlerts.length === 0 ? (
                    <div className="text-center py-16 sm:py-20 bg-white/2 rounded-3xl border border-dashed border-white/5">
                        <Package className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">All stock units optimized</p>
                    </div>
                    ) : (
                    lowStockAlerts.slice(0, 7).map(med => (
                        <div key={med.id} className="p-4 sm:p-5 rounded-3xl bg-white/2 border border-white/5 group hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-center mb-4 gap-3">
                            <div className="min-w-0">
                                <h4 className="text-white font-black uppercase text-xs sm:text-sm truncate">{med.name}</h4>
                                <p className="text-slate-500 text-[8px] sm:text-[10px] font-bold">SKU: {med.id.slice(-8).toUpperCase()}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className={`text-xl sm:text-2xl font-black ${med.status === 'Critical' ? 'text-red-500' : 'text-slate-300'}`}>{med.stock}</p>
                                <p className="text-[7px] sm:text-[8px] text-slate-500 uppercase font-black">Quantity Left</p>
                            </div>
                            </div>
                            <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${med.status === 'Critical' ? 'bg-red-500' : 'bg-slate-500'}`} style={{ width: `${Math.min(100, (med.stock / 20) * 100)}%` }}></div>
                            </div>
                            <button onClick={() => navigate('/inventory', { state: { search: med.name } })} className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-[8px] sm:text-[9px] font-black uppercase text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg active:scale-95">
                            Procure from {med.manufacturer} <ArrowUpRight size={12} />
                            </button>
                        </div>
                    ))
                    )}
                </div>
            </div>
        </div>

        {/* Persistence Alert Manager Overlay - Responsive Drawer */}
        {showManager && (
            <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md" onClick={() => setShowManager(false)} />
            <div className="relative w-full max-w-lg bg-slate-950 h-screen border-l border-white/5 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter truncate">Conflict Resolution</h2>
                        <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate">Inventory Intelligence Board</p>
                    </div>
                    <button onClick={() => setShowManager(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white flex-shrink-0">
                        <CloseIcon size={24} sm={28} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <AlertManager 
                    alerts={[...lowStockAlerts, ...expiryAlerts].filter(m => m.status === 'Critical' || m.status === 'Warning')} 
                    title="System-Wide Operational Conflicts"
                    />
                </div>
                <div className="p-6 sm:p-8 bg-slate-900/50 border-t border-white/5 mt-auto">
                    <button 
                    onClick={() => setShowManager(false)}
                    className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-emerald-600 text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        Confirm Synchronization
                    </button>
                </div>
            </div>
            </div>
        )}
    </MainLayout>
  );
}

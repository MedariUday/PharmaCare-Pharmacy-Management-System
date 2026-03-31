import React, { useEffect, useState, useMemo } from 'react';
import { getInventoryPredictions } from '../services/api';
import { 
  BarChart3, AlertTriangle, CheckCircle, Clock, 
  Search, ArrowRight, TrendingDown, Package,
  TrendingUp, RefreshCw, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

function PredictionCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-slate-800/40 p-5 sm:p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center" style={{ background: color }}>
          <Icon size={20} className="sm:size-6" color="white" />
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-black text-white">{value}</p>
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        </div>
      </div>
      <p className="text-[11px] sm:text-xs text-slate-400 font-medium">{sub}</p>
    </div>
  );
}

export default function PredictiveAnalytics() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, CRITICAL, WARNING, HEALTHY

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getInventoryPredictions();
      setPredictions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch predictions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return predictions.filter(p => {
      const name = p.name || '';
      const cat = p.category || '';
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                            cat.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'ALL' || p.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [predictions, search, filter]);

  const stats = useMemo(() => {
    return {
      critical: predictions.filter(p => p.status === 'CRITICAL').length,
      warning: predictions.filter(p => p.status === 'WARNING').length,
      healthy: predictions.filter(p => p.status === 'HEALTHY').length,
      avgBurn: predictions.reduce((acc, p) => acc + (p.avg_daily_sales || 0), 0) / (predictions.length || 1)
    };
  }, [predictions]);

  if (loading) {
    return (
      <AdminLayout title="Inventory Intelligence & Forecasting" bgClassName="bg-[#0f172a]">
        <div className="flex">
          <div className="m-auto animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Inventory Intelligence & Forecasting" bgClassName="bg-[#0f172a]">
      <div className="pb-24">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 italic uppercase">
              <BarChart3 className="text-indigo-500" size={28} />
              PREDICTIVE ANALYTICS
            </h1>
            <p className="text-slate-400 mt-1 uppercase tracking-[0.2em] text-[9px] sm:text-[10px] font-bold">
              Forecasting Stockout Dates based on 30-day Sales Velocity
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all w-full md:w-auto"
          >
            <RefreshCw size={16} /> Refresh Intelligence
          </button>
        </div>

        {/* Stat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <PredictionCard 
            label="Critical Stocks" 
            value={stats.critical} 
            sub="Running out in < 3 days" 
            icon={AlertTriangle} 
            color="linear-gradient(135deg, #ef4444, #b91c1c)"
          />
          <PredictionCard 
            label="Caution items" 
            value={stats.warning} 
            sub="Running out in < 7 days" 
            icon={Clock} 
            color="linear-gradient(135deg, #f59e0b, #d97706)"
          />
          <PredictionCard 
            label="Healthy Catalog" 
            value={stats.healthy} 
            sub="Stock level is optimal" 
            icon={CheckCircle} 
            color="linear-gradient(135deg, #10b981, #059669)"
          />
          <PredictionCard 
            label="Avg Store Burn" 
            value={stats.avgBurn.toFixed(1)} 
            sub="Units per day across store" 
            icon={TrendingDown} 
            color="linear-gradient(135deg, #6366f1, #4f46e5)"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 group w-full">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search medication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-800/40 border border-white/5 rounded-2xl sm:rounded-[2rem] text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 font-medium text-sm"
            />
          </div>
          
          <div className="flex p-1 bg-slate-800/40 border border-white/5 rounded-2xl sm:rounded-[2rem] backdrop-blur-sm w-full lg:w-auto overflow-x-auto custom-scrollbar">
            {['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 lg:flex-none px-4 sm:px-6 py-2 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'Everything' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Results Strategy */}
        <div className="relative">
          {filtered.length === 0 ? (
            <div className="py-32 bg-slate-800/20 backdrop-blur-xl rounded-[40px] border border-white/5 text-center shadow-2xl">
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-slate-700 mx-auto mb-6 opacity-20">
                 <Package size={36} />
              </div>
              <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-1">Intelligence Gap</h3>
              <p className="text-slate-500 text-[10px] font-bold lowercase tracking-wider">No predictive signals detected for the selected parameters.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-slate-800/30 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-white/5 whitespace-nowrap italic">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medication Asset</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Daily Burn</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current Stock</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Days left</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stockout Forecast</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                item.status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                item.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              }`}>
                                <Package size={20} />
                              </div>
                              <div>
                                <p className="text-white font-black text-sm uppercase tracking-tight">{item.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className={`p-1 rounded-md ${item.avg_daily_sales > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-500'}`}>
                                <TrendingDown size={14} />
                              </div>
                              <span className="text-white font-bold text-sm">
                                {item.avg_daily_sales} <span className="text-slate-500 text-[10px] uppercase font-bold">u/d</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col items-center">
                              <span className="text-white font-black text-sm">{item.current_stock}</span>
                              <div className="w-20 bg-slate-700 h-1 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    item.status === 'CRITICAL' ? 'bg-red-500' : 
                                    item.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${Math.min(100, (item.current_stock / 50) * 100)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              item.status === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {item.days_remaining} {typeof item.days_remaining === 'number' ? 'days' : ''}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              {item.status === 'HEALTHY' ? (
                                <CheckCircle size={14} className="text-emerald-500" />
                              ) : (
                                <Clock size={14} className={item.status === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'} />
                              )}
                              <span className={`text-sm font-bold ${
                                item.status === 'CRITICAL' ? 'text-red-500' :
                                item.status === 'WARNING' ? 'text-amber-500' :
                                'text-slate-400'
                              }`}>
                                {item.predicted_stockout}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => navigate('/inventory')}
                              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:border-indigo-500 transition-all active:scale-95"
                            >
                              Restock <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Risk Cards */}
              <div className="grid grid-cols-1 gap-5 md:hidden">
                {filtered.map((item) => (
                  <div key={item.id} className="bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                          item.status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          item.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          <Package size={22} />
                        </div>
                        <div>
                           <h3 className="text-white font-black text-base uppercase tracking-tight italic">{item.name}</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.category}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        item.status === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {item.days_remaining} {typeof item.days_remaining === 'number' ? 'days' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                           <TrendingDown size={10} /> Daily Burn
                        </p>
                        <p className="text-sm font-black text-white">{item.avg_daily_sales} <span className="text-[10px] text-slate-500">u/d</span></p>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                           <Clock size={10} /> Stockout
                        </p>
                        <p className={`text-sm font-black italic ${item.status === 'CRITICAL' ? 'text-red-400' : item.status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
                           {item.predicted_stockout}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/inventory')}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                       Initialize Restock <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}

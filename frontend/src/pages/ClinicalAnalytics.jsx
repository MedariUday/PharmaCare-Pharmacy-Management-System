import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers,
  RefreshCw,
  Activity,
  CheckCircle2,
  PackageSearch,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';
import AdminLayout from '../components/AdminLayout';
import { getClinicalAnalytics } from '../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const MetricCard = ({ title, value, icon: Icon, trend, trendValue, colorClass, statusLabel, isCritical }) => (
  <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl transition-all hover:translate-y-[-4px] hover:bg-slate-800/60 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-20 group-hover:scale-110 transition-transform flex items-center justify-center`}>
        <Icon className={colorClass.replace('bg-', 'text-').replace('500', '400')} size={24} strokeWidth={2.5} />
      </div>
      {statusLabel && (
        <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-lg ${isCritical ? 'text-rose-400 bg-rose-400/10 border border-rose-400/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20'}`}>
          {isCritical ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
          {statusLabel}
        </div>
      )}
      {trend && !statusLabel && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}
        </div>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <div className="text-2xl font-black text-white mt-1 tracking-tight">{value}</div>
  </div>
);

export default function ClinicalAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const pollInterval = useRef(null);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const res = await getClinicalAnalytics();
      console.log("📊 Reports Summary Sync:", res.data);
      setData(res.data);
      setLastSync(new Date());
    } catch (err) {
      console.error("Aggregation failure:", err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 30 Seconds Polling
    pollInterval.current = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(pollInterval.current);
  }, [fetchData]);

  const processCategoryData = () => {
    if (!data?.category_share) return [];
    const sorted = [...data.category_share].sort((a, b) => b.value - a.value);
    const topN = sorted.slice(0, 5);
    const others = sorted.slice(5);
    
    if (others.length > 0) {
      const othersValue = others.reduce((acc, curr) => acc + curr.value, 0);
      return [...topN, { name: 'Others', value: othersValue }];
    }
    return sorted;
  };

  const chartData = processCategoryData();
  const totalRevenue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (loading) {
    return (
      <AdminLayout title="Clinical Intelligence" bgClassName="bg-[#0f172a]" maxW="max-w-[1600px]">
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-800/40 rounded-3xl border border-white/5"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[450px] bg-slate-800/40 rounded-3xl border border-white/5"></div>
            <div className="h-[450px] bg-slate-800/40 rounded-3xl border border-white/5"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Clinical Intelligence" 
      bgClassName="bg-[#0f172a]" 
      maxW="max-w-[1600px]"
    >
      <div className="pb-32 space-y-8">
        {/* Header Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Performance Analytics</h1>
            <div className="flex items-center gap-3 text-slate-400 mt-2 font-medium">
              <span>Real-time clinical intelligence platform.</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className="text-xs text-slate-500 italic">Last synced: {lastSync.toLocaleTimeString()}</span>
            </div>
          </div>
          <button 
            onClick={() => fetchData()} 
            disabled={refreshing}
            className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span className="tracking-tight">{refreshing ? 'Synchronizing...' : 'Refresh Intelligence'}</span>
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="30D Revenue" 
            value={`₹${data?.revenue_30d?.toLocaleString() || 0}`} 
            icon={DollarSign} 
            trend="up" 
            trendValue="+12.5%" 
            colorClass="bg-indigo-500"
          />
          <MetricCard 
            title="30D Total Orders" 
            value={data?.orders_30d || 0} 
            icon={ShoppingCart} 
            trend="up" 
            trendValue="+4.2%" 
            colorClass="bg-violet-500"
          />
           <MetricCard 
            title="Estimated Profit (30D)" 
            value={`₹${Math.round(data?.profit_30d || 0).toLocaleString()}`} 
            icon={TrendingUp} 
            trend="up" 
            trendValue="+14.1%" 
            colorClass="bg-pink-500"
          />
          <MetricCard 
            title="Urgent Restocks Needed" 
            value={data?.urgent_restocks || 0} 
            icon={AlertCircle} 
            statusLabel={data?.urgent_restocks > 0 ? 'Action Required' : 'Healthy'} 
            isCritical={data?.urgent_restocks > 0}
            colorClass={data?.urgent_restocks > 0 ? 'bg-rose-500' : 'bg-emerald-500'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Trend */}
          <div className="lg:col-span-2 bg-slate-800/20 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Activity size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">Revenue Velocity</h3>
                  <p className="text-slate-500 text-sm font-medium mt-0.5">Transactional momentum over the last 7 days</p>
                </div>
              </div>
            </div>
            
            <div className="h-[360px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenue_trend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff03" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#475569', fontSize: 13, fontWeight: 700}}
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#475569', fontSize: 13, fontWeight: 700}}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip 
                    formatter={(v) => [`₹${v.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                    labelStyle={{ color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Split (Market Share Design Refactor) */}
          <div className="bg-slate-800/20 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl flex flex-col group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Layers size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">Market Share</h3>
                <p className="text-slate-500 text-sm font-medium mt-0.5">Category distribution by revenue</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between min-h-0 space-y-8">
              {chartData.length > 0 ? (
                <>
                  {/* The Chart Area */}
                  <div className="h-[240px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius="72%"
                          outerRadius="95%"
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={12}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <Label 
                            position="center" 
                            content={({ viewBox: { cx, cy } }) => (
                              <g>
                                <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                                  Total Revenue
                                </text>
                                <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle" className="fill-white text-xl font-black tracking-tighter">
                                  ₹{(totalRevenue/1000).toFixed(1)}k
                                </text>
                              </g>
                            )}
                          />
                        </Pie>
                        <Tooltip 
                           formatter={(v) => [`₹${v.toLocaleString()}`, "Contribution"]}
                           contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '12px' }}
                           itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Highly Polished Legend List */}
                  <div className="space-y-3 mt-4 overflow-y-auto pr-1 max-h-[160px] scrollbar-thin scrollbar-thumb-slate-700">
                    {chartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-400/5 border border-white/5 hover:bg-slate-400/10 transition-colors group/item">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-sm font-bold text-slate-300 truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                            {((item.value / totalRevenue) * 100).toFixed(1)}%
                          </span>
                          <ChevronRight size={14} className="text-slate-600 transition-transform group-hover/item:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-[32px]">
                  <PackageSearch size={48} className="text-slate-700 mb-4" />
                  <p className="text-slate-500 text-sm font-bold italic uppercase tracking-widest">No clinical datasets captured for this cycle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

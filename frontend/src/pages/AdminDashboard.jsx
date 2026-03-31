import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { SalesAreaChart } from '../components/SalesChart';
import RevenueChart from '../components/RevenueChart';
import TopMedicines from '../components/TopMedicines';
import { 
  getMedicines, getCustomers, getExpiryAlerts, getLowStockAlerts, 
  getDailyReport, getMonthlyReport, getTopMedicines, getAlertsSummary 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import InventoryHealthGauge from '../components/InventoryHealthGauge';
import AlertManager from '../components/AlertManager';
import { 
  Pill, TrendingUp, Users, AlertTriangle, CalendarClock, 
  ShoppingCart, BarChart3, ShieldCheck, X 
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-sm text-slate-400 mb-1 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-white truncate">{value}</p>
          {sub && <p className="text-[10px] sm:text-xs mt-1 text-slate-500 truncate">{sub}</p>}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: color }}>
          <Icon size={20} className="sm:size-6" color="white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [topMeds, setTopMeds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const handleGenerateAudit = async () => {
    try {
      setIsExporting(true);
      const res = await getMedicines({ limit: 10000 });
      const allMeds = res.data?.data || [];
      const rows = [['Medicine ID', 'Name', 'Category', 'Stock Level', 'Price (INR)', 'Expiry Date']];
      allMeds.forEach(m => {
        rows.push([m.id || m._id || 'N/A', `"${m.name || ''}"`, `"${m.category || 'N/A'}"`, m.stock || 0, m.price || 0, m.expiry_date || 'N/A']);
      });
      const csvContent = rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inventory_audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to generate audit report", err);
      alert("Failed to generate audit report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [medsRes, custRes, expRes, lowRes, dailyRes, monthlyRes, topRes, summaryRes] = await Promise.all([
          getMedicines({ limit: 10 }),
          getCustomers(),
          getExpiryAlerts(),
          getLowStockAlerts(),
          getDailyReport(),
          getMonthlyReport(),
          getTopMedicines(),
          getAlertsSummary()
        ]);
        setMedicines(medsRes?.data?.data || []);
        setCustomers(custRes?.data || []);
        setExpiryAlerts(expRes?.data?.medicines || []);
        setLowStockAlerts(lowRes?.data?.medicines || []);
        setDailyData(dailyRes?.data || null);
        setMonthlyData(monthlyRes?.data || null);
        setTopMeds(topRes?.data || []);
        setSummary(summaryRes?.data || null);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex min-h-screen bg-[#0f172a]"><div className="m-auto animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  const criticalLow = lowStockAlerts.filter(m => m.status === 'Critical').length;
  const criticalExp = expiryAlerts.filter(m => m.status === 'Critical').length;

  return (
    <MainLayout title="Administrator Command Center">
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 overflow-x-hidden">
            <div>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight italic-font-fix uppercase">COMMAND CENTER</h1>
                <p className="text-slate-400 mt-1 uppercase tracking-widest text-[8px] sm:text-[10px] font-bold">System Oversight & Clinical Analytics</p>
            </div>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] sm:text-xs font-bold uppercase tracking-tighter shadow-lg shadow-indigo-500/5">
                <ShieldCheck size={14} /> Root Access Verified
            </div>
        </div>

        {/* Critical Alerts Banner */}
        {(criticalLow > 0 || criticalExp > 0) && (
        <div className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x shadow-2xl shadow-red-500/20">
            <div className="bg-[#0f172a] rounded-[14px] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 sm:gap-5 w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 animate-pulse border border-red-500/20 flex-shrink-0">
                    <AlertTriangle size={24} />
                    </div>
                    <div>
                    <h4 className="font-black text-white uppercase text-sm sm:text-base tracking-wide italic">Threat Detection: {criticalLow + criticalExp} Critical Vulnerabilities</h4>
                    <p className="text-slate-400 text-[10px] sm:text-xs font-bold">{criticalLow} stock depletions and {criticalExp} expired medications require suppression.</p>
                    </div>
                </div>
                <button 
                onClick={() => setShowManager(true)}
                className="w-full md:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                >
                    Review Intelligence
                </button>
            </div>
        </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard icon={TrendingUp} label="Monthly Revenue" value={`₹${(monthlyData?.total_sales || 0).toLocaleString()}`} color="linear-gradient(135deg, #6366f1, #4f46e5)" sub="+12.5% from last month" />
            <StatCard icon={ShoppingCart} label="Daily Transactions" value={dailyData?.sales_count || 0} color="linear-gradient(135deg, #10b981, #059669)" sub={`₹${(dailyData?.total_sales || 0).toLocaleString()} net today`} />
            <StatCard icon={Users} label="Active Base" value={customers.length} color="linear-gradient(135deg, #f59e0b, #d97706)" sub="Total registered customers" />
            <StatCard icon={Pill} label="Asset Catalog" value={medicines.length} color="linear-gradient(135deg, #ec4899, #be185d)" sub="Unique product SKUs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="bg-slate-800/40 p-5 sm:p-6 rounded-3xl border border-white/5 backdrop-blur-sm shadow-xl overflow-hidden">
                <h3 className="text-sm sm:text-base font-black text-white mb-6 flex items-center gap-2 uppercase tracking-tight italic">
                <BarChart3 size={18} className="text-indigo-400" /> Sales Velocity
                </h3>
                <div className="h-[280px] sm:h-[320px] w-full">
                    <SalesAreaChart data={dailyData?.chart_data || []} />
                </div>
            </div>
            <div className="bg-slate-800/40 p-5 sm:p-6 rounded-3xl border border-white/5 backdrop-blur-sm shadow-xl overflow-hidden">
                <h3 className="text-sm sm:text-base font-black text-white mb-6 uppercase tracking-tight italic">Revenue Distribution</h3>
                <div className="h-[280px] sm:h-[320px] w-full">
                    <RevenueChart data={monthlyData?.chart_data || []} />
                </div>
            </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-hidden">
                <TopMedicines data={topMeds} />
            </div>
            <div className="bg-slate-800/40 p-6 sm:p-8 rounded-3xl border border-white/10 backdrop-blur-md shadow-xl flex flex-col items-center">
                <h3 className="text-lg sm:text-xl font-black text-white mb-4 uppercase italic self-start">Operational Health</h3>
                
                <InventoryHealthGauge score={summary?.health_score || 0} />

                <div className="space-y-4 w-full mt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setShowManager(true)}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Stock Integrity</span>
                        <span className={`text-${lowStockAlerts.length > 0 ? 'red' : 'green'}-500 text-[10px] font-black`}>{lowStockAlerts.length > 0 ? 'DANGER' : 'OPTIMAL'}</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (lowStockAlerts.length / 10) * 100)}%` }} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setShowManager(true)}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Bio-Safety / Expiry</span>
                        <span className="text-yellow-500 text-[10px] font-black">{expiryAlerts.length} FLAGGED</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (expiryAlerts.length / 5) * 100)}%` }} />
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                    onClick={handleGenerateAudit}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {isExporting ? <span className="animate-pulse">Compiling Data...</span> : 'Generate Full Audit Report'}
                    </button>
                </div>
                </div>
            </div>
        </div>

        {/* Alert Manager Overlay */}
        {showManager && (
            <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setShowManager(false)} />
            <div className="relative w-full max-w-md bg-[#0f172a] h-screen border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-white uppercase italic">Inventory Intelligence</h2>
                    <button onClick={() => setShowManager(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden p-6">
                    <AlertManager 
                    alerts={[...lowStockAlerts, ...expiryAlerts].filter(m => m.status === 'Critical' || m.status === 'Warning')} 
                    />
                </div>
                <div className="p-6 bg-slate-800/20 border-t border-white/5">
                    <button 
                    onClick={() => setShowManager(false)}
                    className="w-full py-4 rounded-2xl bg-slate-700 text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-600 transition-all"
                    >
                        Acknowledge Intelligence
                    </button>
                </div>
            </div>
            </div>
        )}
    </MainLayout>
  );
}

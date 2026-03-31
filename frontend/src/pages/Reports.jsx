import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { SalesBarChart } from '../components/SalesChart';
import { getSales } from '../services/api';
import useAdminReportSummary from '../hooks/useAdminReportSummary';
import { Download, BarChart3, TrendingUp, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';

export default function Reports() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: summary, loading: summaryLoading, error: summaryError, lastUpdated, refetch } = useAdminReportSummary(30000);

  useEffect(() => {
    getSales()
      .then(r => setSales(r.data?.bills || r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build last 30 days chart data grouped by day
  const daily = (() => {
    const map = {};
    sales.forEach(s => {
      const d = new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (!map[d]) map[d] = { name: d, revenue: 0, count: 0 };
      map[d].revenue += s.total || 0;
      map[d].count += 1;
    });
    return Object.values(map).slice(-14);
  })();

  // Month totals
  const monthly = (() => {
    const map = {};
    sales.forEach(s => {
      const m = new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!map[m]) map[m] = { name: m, revenue: 0, count: 0 };
      map[m].revenue += s.total || 0;
      map[m].count += 1;
    });
    return Object.values(map);
  })();

  const totalRev = sales.reduce((a, s) => a + (s.total || 0), 0);
  const thisMonthSales = sales.filter(s => {
    const d = new Date(s.created_at);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });

  const exportCSV = () => {
    const rows = [['ID', 'Customer ID', 'Total Amount', 'Date']];
    sales.forEach(s => rows.push([s.id, s.customer_id, s.total || 0, new Date(s.created_at).toLocaleString('en-IN')]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sales_report.csv'; a.click();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: '260px' }}>
        <Navbar title="Reports" />
        <main className="p-6">
          {/* Header & Status */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {summaryError ? (
                  <span className="text-rose-500 flex items-center gap-1"><AlertCircle size={14}/> Polling disconnected</span>
                ) : summaryLoading && !lastUpdated ? (
                  <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Synchronizing...</span>
                ) : lastUpdated ? (
                  `Live Data • Updated ${lastUpdated.toLocaleTimeString('en-IN')}`
                ) : 'Awaiting data...'}
              </p>
            </div>
            <button 
              onClick={refetch}
              disabled={summaryLoading}
              className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} className={summaryLoading ? "animate-spin" : ""} /> Manual Refresh
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Revenue", value: `₹${(summary?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'linear-gradient(135deg,#10b981,#059669)' },
              { label: "Total Sales", value: summary?.total_bills || 0, icon: ShoppingCart, color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
              { label: "Today's Revenue", value: `₹${(summary?.today_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: BarChart3, color: 'linear-gradient(135deg,#f59e0b,#d97706)' },
              { label: "Today's Sales", value: summary?.today_bills || 0, icon: BarChart3, color: 'linear-gradient(135deg,#ec4899,#be185d)' },
            ].map((s, i) => (
              <div key={i} className={`stat-card flex items-start justify-between transition-all ${summaryLoading && !lastUpdated ? 'animate-pulse opacity-50' : ''}`}>
                <div>
                  <p className="text-xs mb-1" style={{ color: '#64748b' }}>{s.label}</p>
                  <p className="text-xl font-black text-white">{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
                  <s.icon size={18} color="white" />
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Daily Sales (Last 14 days)</h3>
              </div>
              <SalesBarChart data={daily} />
            </div>
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Monthly Revenue</h3>
              <SalesBarChart data={monthly} />
            </div>
          </div>

          {/* Sales table */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 className="font-semibold text-white">All Sales</h3>
              <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm py-2"><Download size={14} /> Export CSV</button>
            </div>
            <table className="w-full text-sm">
              <thead style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <tr style={{ color: '#64748b' }}>
                  <th className="text-left px-5 py-3">Sale ID</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-right px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="table-row border-b" style={{ borderColor: 'rgba(99,102,241,0.06)' }}>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: '#6366f1' }}>{s.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3" style={{ color: '#94a3b8' }}>{s.customer_id.slice(-8)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">₹{(s.total || 0).toFixed(2)}</td>
                    <td className="px-5 py-3" style={{ color: '#64748b' }}>{new Date(s.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && <p className="text-center py-12" style={{ color: '#475569' }}>No sales data yet.</p>}
          </div>
        </main>
      </div>
    </div>
  );
}

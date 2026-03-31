import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBills } from '../services/api';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { 
  FileText, Search, Eye, TrendingUp, ShoppingBag, 
  CheckCircle, Clock, IndianRupee 
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4 backdrop-blur-sm">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color }}>
        <Icon size={22} color="white" />
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">{label}</p>
        <p className="text-white text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

export default function AdminBills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBills({ limit: 100 })
      .then(res => {
        setBills(res.data.bills || []);
        setTotal(res.data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = bills.filter(b =>
    b.bill_id?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.staff_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0);
  const paidCount = bills.filter(b => b.payment_status === 'Paid').length;
  const todayCount = bills.filter(b => {
    const d = new Date(b.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0f172a]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center" style={{ marginLeft: '260px' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: '260px' }}>
        <Navbar title="Billing Records" />
        <main className="p-8">

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">ALL BILLS</h1>
              <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">
                Complete Transaction Ledger
              </p>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
              {total} total records
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={FileText} label="Total Bills" value={total} color="linear-gradient(135deg,#6366f1,#4f46e5)" />
            <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} color="linear-gradient(135deg,#10b981,#059669)" />
            <StatCard icon={CheckCircle} label="Paid Bills" value={paidCount} color="linear-gradient(135deg,#f59e0b,#d97706)" />
            <StatCard icon={ShoppingBag} label="Today's Bills" value={todayCount} color="linear-gradient(135deg,#ec4899,#be185d)" />
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Bill ID, Customer or Staff..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-800/40 border border-white/5 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Table */}
          <div className="bg-slate-800/30 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Bill ID</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Staff</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-center px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500">
                      <FileText className="mx-auto mb-3 opacity-30" size={36} />
                      <p className="text-sm font-bold uppercase tracking-widest">No bills found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(bill => (
                    <tr key={bill.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-indigo-400 font-bold text-sm">#{bill.bill_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-semibold text-sm">{bill.customer_name || '—'}</p>
                        <p className="text-slate-500 text-xs">{bill.customer_id?.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{bill.staff_name || 'Admin'}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(bill.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-white">
                        ₹{Number(bill.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                          bill.payment_status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                          {bill.payment_status === 'Paid' ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {bill.payment_status || 'Paid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/staff/invoice/${bill.bill_id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-600/40 transition-all"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

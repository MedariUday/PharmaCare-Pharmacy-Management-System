import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { getAllBills, downloadBillPDF } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Search, Download, Eye, 
  Calendar, CreditCard, User, 
  ChevronLeft, ChevronRight, Filter, 
  CheckCircle, Clock, XCircle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

export default function AllInvoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(null);

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff';

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllBills({
        skip: (page - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        search: search || undefined,
        status: status || undefined
      });
      setInvoices(res.data.bills || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownload = async (id, number) => {
    setDownloading(id);
    try {
      const res = await downloadBillPDF(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${number || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download Error:", err);
      alert("Failed to generate or download PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'paid';
    switch (s) {
      case 'paid':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            <CheckCircle size={10} /> Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
            <Clock size={10} /> Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
            <XCircle size={10} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-500/20">
            <AlertCircle size={10} /> {status}
          </span>
        );
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <MainLayout title="Invoice Archive">
        {/* Advanced Filter Toolbar - Responsive */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 overflow-x-hidden">
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase italic mb-1">Billing Intel</h1>
                <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                    Manage and retrieve all clinical financial footprints
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative group w-full sm:w-64 flex-shrink-0">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search Record Identifier..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-800/40 border border-white/5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs sm:text-sm font-bold text-white transition-all shadow-inner"
                    />
                </div>
                
                <div className="relative group w-full sm:w-auto flex-shrink-0">
                    <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="w-full pl-11 pr-8 py-3 rounded-2xl bg-slate-800/40 border border-white/5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all appearance-none cursor-pointer shadow-inner min-w-[140px]"
                    >
                        <option value="">Full Status</option>
                        <option value="Paid">Finalized</option>
                        <option value="Pending">In-Queue</option>
                        <option value="Cancelled">Suppressed</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Global Record Table - Responsive Container */}
        <div className="bg-slate-800/20 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden mb-12">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="bg-white/2 border-b border-white/5">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Stakeholder</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Value</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/2">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-8 py-6"><div className="h-4 bg-white/5 rounded-full w-full"></div></td>
                                </tr>
                            ))
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700">
                                            <FileText size={40} />
                                        </div>
                                        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Zero matching protocols identified</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-500/10">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white font-mono tracking-tighter uppercase">{inv.bill_number}</p>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">REF: …{inv.id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 border border-white/5">
                                                <User size={12} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{inv.customer_name || 'Walk-in'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-300">
                                                {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-600 uppercase">
                                                {new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-black text-white tracking-widest">₹{Number(inv.total).toLocaleString('en-IN')}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        {getStatusBadge(inv.payment_status)}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`${isStaff ? '/staff' : '/admin'}/invoices/${inv.id}`)}
                                                title="Intel Preview"
                                                className="w-10 h-10 rounded-xl border border-white/5 bg-white/2 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center active:scale-95"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(inv.id, inv.bill_number)}
                                                disabled={downloading === inv.id}
                                                title="Suppress Data to PDF"
                                                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center active:scale-95 ${
                                                    downloading === inv.id 
                                                    ? 'bg-white/5 text-slate-600' 
                                                    : 'border border-white/5 bg-white/2 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10'
                                                }`}
                                            >
                                                <Download size={16} className={downloading === inv.id ? 'animate-bounce' : ''} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Intel - Responsive */}
            {total > ITEMS_PER_PAGE && (
                <div className="px-8 py-5 bg-white/2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Displaying {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} of {total} Records
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
        
        {/* Global Statistics Summary - Responsive Multi-Grid */}
        {!loading && total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
                <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 hover:border-indigo-500/20 transition-all shadow-xl">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                        <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5 truncate">Total Records</p>
                        <p className="text-2xl font-black text-white tracking-tighter truncate">{total.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 hover:border-emerald-500/20 transition-all shadow-xl">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                        <CreditCard size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5 truncate">Total Value</p>
                        <p className="text-2xl font-black text-white tracking-tighter truncate">₹{invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString()}+</p>
                    </div>
                </div>
                <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 hover:border-indigo-400/20 transition-all shadow-xl sm:col-span-2 lg:col-span-1">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-900/30 text-indigo-300 flex items-center justify-center border border-indigo-400/20 flex-shrink-0">
                        <Calendar size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5 truncate">Last Forensic Sync</p>
                        <p className="text-sm font-black text-white uppercase italic tracking-tighter truncate">
                            {invoices[0] ? new Date(invoices[0].created_at).toLocaleDateString() : 'Just Now'}
                        </p>
                    </div>
                </div>
            </div>
        )}
    </MainLayout>
  );
}

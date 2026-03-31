import React, { useState, useEffect } from 'react';
import { getCustomerBills, downloadBillPDF } from '../services/api';
import { FileText, Download, Search, Eye, ChevronRight, Package, Calendar, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

export default function CustomerBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleDownload = async (billId) => {
    try {
      const response = await downloadBillPDF(billId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  useEffect(() => {
    getCustomerBills()
      .then(res => setBills(res.data || []))
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredBills = bills.filter(b =>
    (b.bill_id || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <MainLayout title="My Invoices">
      <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        Synchronizing Invoice Stream...
      </div>
    </MainLayout>
  );

  return (
    <MainLayout title="My Invoices">
        <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 overflow-x-hidden">
            
            {/* Responsive Header Terminal */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-800/20 p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl transition-all">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <FileText className="text-emerald-400 group-hover:rotate-12 transition-transform" size={32} /> Invoice <span className="text-emerald-400">Archive</span>
                    </h1>
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-slate-500">Secure Cloud Ledger · Direct Asset Access</p>
                </div>
                
                <div className="relative w-full lg:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Protocol ID..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-900 border border-white/5 rounded-2xl text-sm font-bold text-white placeholder:text-slate-600 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Switcher: High-Density Table (Desktop/Tablet) vs. Card Stack (Mobile) */}
            <div className="relative">
                
                {/* 💻 HIGH-DENSITY TABLE VIEW (Hidden on Mobile) */}
                <div className="hidden md:block bg-slate-800/10 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-6">Ledger ID</th>
                                <th className="px-8 py-6">Authorization Date</th>
                                <th className="px-8 py-6">Asset Cluster</th>
                                <th className="px-8 py-6">Fiscal Total</th>
                                <th className="px-8 py-6 text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/2">
                            {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-16 h-16 rounded-full border border-dashed border-slate-500 flex items-center justify-center">
                                                <Search size={24} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Protocol Failure: No Matching Ledger Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-white/5 transition-all group">
                                        <td className="px-8 py-7">
                                            <span className="font-black text-emerald-400 italic tracking-tighter uppercase text-sm">#{bill.bill_id}</span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-widest">
                                                <Calendar size={12} className="text-slate-600" />
                                                {new Date(bill.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex -space-x-2.5">
                                                {(bill.medicines || []).slice(0, 3).map((m, i) => {
                                                    const medName = m.medicine_name || m.name || 'ASSET';
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="h-8 w-8 rounded-xl bg-emerald-500/10 border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-black text-emerald-400 uppercase shadow-lg"
                                                            title={medName}
                                                        >
                                                            {medName.charAt(0)}
                                                        </div>
                                                    );
                                                })}
                                                {(bill.medicines || []).length > 3 && (
                                                    <div className="h-8 w-8 rounded-xl bg-slate-800 border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-black text-slate-500 uppercase shadow-lg">
                                                        +{(bill.medicines || []).length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <p className="font-black text-white text-lg italic tracking-tighter">₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Incl. ₹{Number(bill.tax).toFixed(2)} Surcharge</p>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => navigate(`/customer/bill/${bill.id}`)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-xl border border-white/5 transition-all shadow-lg active:scale-90"
                                                    title="View Detailed Intelligence"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(bill.bill_id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-white/2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-xl border border-white/5 transition-all shadow-lg active:scale-90"
                                                    title="Acquire PDF Protocol"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 📱 RESPONSIVE CARD STACK (Mobile Only Rendering) */}
                <div className="md:hidden space-y-4">
                    {filteredBills.length === 0 ? (
                         <div className="p-12 text-center bg-slate-800/20 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 opacity-40">
                             <div className="w-12 h-12 rounded-full border border-dashed border-slate-500 flex items-center justify-center">
                                 <Search size={20} />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No Ledger Matches Found</p>
                         </div>
                    ) : (
                        filteredBills.map((bill) => (
                            <div key={bill.id} className="bg-slate-800/20 rounded-3xl border border-white/5 p-4 sm:p-6 space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden group active:scale-[0.98] transition-all">
                                {/* Visual Accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-16 -mt-16 rounded-full blur-2xl" />
                                
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Authorization Code</span>
                                        <h4 className="text-xl font-black text-emerald-400 italic tracking-tighter uppercase leading-none">#{bill.bill_id}</h4>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/2 rounded-2xl border border-white/5 space-y-1">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar size={10} /> Date
                                        </p>
                                        <p className="text-xs font-bold text-white uppercase tracking-tighter italic">
                                            {new Date(bill.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short'
                                            })}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/2 rounded-2xl border border-white/5 space-y-1">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <Package size={10} /> Cluster
                                        </p>
                                        <p className="text-xs font-bold text-white uppercase tracking-tighter italic">
                                            {(bill.medicines || []).length} ASSETS
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-4 border-y border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                            <Wallet size={12} className="text-emerald-400" /> Fiscal Net
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white italic tracking-tighter leading-none">₹{Number(bill.total).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => navigate(`/customer/bill/${bill.id}`)}
                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button 
                                            onClick={() => handleDownload(bill.bill_id)}
                                            className="w-12 h-12 rounded-2xl bg-emerald-600 border border-emerald-500/30 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`/customer/bill/${bill.id}`)}
                                    className="w-full flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors group"
                                >
                                    Review Synchronization Details <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Viewport Safe Spacer */}
            <div className="h-16 sm:hidden" />
        </div>
    </MainLayout>
  );
}

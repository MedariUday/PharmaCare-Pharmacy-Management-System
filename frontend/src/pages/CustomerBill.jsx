import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBillDetails, downloadBillPDF } from '../services/api';
import { 
  FileText, Download, ArrowLeft, Pill, MapPin, Phone, 
  Mail, Printer, Loader2, CheckCircle, AlertCircle, ShieldCheck,
  Info, Activity
} from 'lucide-react';
import MainLayout from '../components/MainLayout';

export default function CustomerBill() {
  const { billId } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBill() {
      try {
        setLoading(true);
        const res = await getBillDetails(billId);
        setBill(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    if (billId) fetchBill();
  }, [billId]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      // Task 5 & 11: Standardized robust download logic
      const res = await downloadBillPDF(billId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${bill.bill_number || bill.bill_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("SUCCESS: Customer invoice download complete");
    } catch (err) {
      console.error("Customer PDF Download Error:", err);
      alert('Failed to download invoice. Please contact support if this persists.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
       <div className="text-center">
         <Loader2 className="animate-spin text-indigo-500 h-12 w-12 mx-auto mb-4" />
         <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Authenticating Secure Document...</p>
       </div>
    </div>
  );

  if (error || !bill) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] flex-col p-8 text-center">
       <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6">
         <AlertCircle className="text-rose-500 h-12 w-12" />
       </div>
       <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Access Denied</h2>
       <p className="text-slate-500 mb-8 max-w-md text-sm">{error || 'The requested invoice could not be retrieved. Please ensure you have permission to view this document.'}</p>
       <button onClick={() => navigate('/customer/orders')} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl transition-all hover:bg-indigo-500 hover:text-white active:scale-95 uppercase text-xs tracking-widest">
         Return to History
       </button>
    </div>
  );

  return (
    <MainLayout title="Verified Digital Invoice">
        <div className="pb-24">
           <div className="max-w-4xl mx-auto">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                <button onClick={() => navigate(-1)} className="w-full sm:w-auto flex items-center justify-center sm:justify-start text-slate-500 hover:text-indigo-400 font-black transition-all gap-2 group text-[10px] uppercase tracking-[0.2em] bg-white/5 sm:bg-transparent py-4 sm:py-0 rounded-2xl border sm:border-0 border-white/5">
                   <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Intelligence
                </button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                   <button onClick={() => window.print()} className="hidden sm:flex items-center justify-center gap-2 bg-white/5 border border-white/5 text-slate-400 px-6 py-3 rounded-2xl font-bold hover:bg-white/10 shadow-sm transition-all text-sm">
                      <Printer size={18} /> Print Copy
                   </button>
                   <button 
                     onClick={handleDownloadPDF} 
                     disabled={downloading}
                     className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 sm:py-3 rounded-2xl font-black hover:bg-indigo-500 shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-70 text-sm w-full sm:w-auto uppercase tracking-widest text-xs"
                   >
                      {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      {downloading ? 'Encrypting...' : 'Secure Download'}
                   </button>
                </div>
             </div>

             <div className="bg-slate-800/40 backdrop-blur-3xl rounded-[32px] sm:rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 relative print:bg-white print:text-black">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                
                {/* Header Section */}
                <div className="p-8 sm:p-14 border-b border-white/5 relative">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-14">
                      <div className="flex items-center gap-5">
                         <div className="bg-indigo-600 p-5 rounded-3xl shadow-2xl shadow-indigo-600/20 text-white border border-indigo-500/20">
                            <Pill size={36} />
                         </div>
                         <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase italic">PharmaCare</h1>
                            <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mt-1.5 italic">
                               <ShieldCheck size={14} /> Encrypted Transaction
                            </div>
                         </div>
                      </div>
                      <div className="md:text-right w-full md:w-auto">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 italic px-1">Invoice Logic</p>
                         <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight bg-white/5 px-4 py-2 rounded-2xl border border-white/5 inline-block">#{bill.bill_id.slice(-8).toUpperCase()}</h2>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Issue Date</p>
                         <p className="font-black text-slate-200 text-sm uppercase italic">{new Date(bill.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Client Identity</p>
                         <p className="font-black text-slate-200 text-sm uppercase italic">{bill.customer_name || 'Anonymous'}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Mechanism</p>
                         <p className="font-black text-slate-200 text-sm uppercase italic">Digital Terminal</p>
                      </div>
                      <div className="lg:text-right">
                         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">Status</p>
                         <span className="bg-emerald-500/10 text-emerald-400 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border border-emerald-500/20 italic">Fulfilled</span>
                      </div>
                   </div>
                </div>

                {/* Table Section */}
                <div className="p-8 sm:p-14">
                   <div className="overflow-x-auto custom-scrollbar scrolling-touch">
                      <table className="w-full text-left min-w-[600px]">
                         <thead>
                            <tr className="border-b border-white/5 italic">
                               <th className="pb-8 px-2 font-black text-slate-500 uppercase tracking-[0.4em] text-[10px]">Description</th>
                               <th className="pb-8 px-2 font-black text-slate-500 uppercase tracking-[0.4em] text-[10px] text-center">Unit</th>
                               <th className="pb-8 px-2 font-black text-slate-500 uppercase tracking-[0.4em] text-[10px] text-right">Rate</th>
                               <th className="pb-8 px-2 font-black text-slate-500 uppercase tracking-[0.4em] text-[10px] text-right">Net Value</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/2">
                            {bill.medicines.map((m, i) => (
                               <tr key={i} className="group hover:bg-white/2 transition-all">
                                  <td className="py-8 px-2">
                                     <p className="font-black text-white text-base uppercase italic tracking-tight">{m.medicine_name || m.name}</p>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Sovereign Pharmaceutical Grade</p>
                                  </td>
                                  <td className="py-8 px-2 text-center font-black text-slate-400 font-mono text-base">{m.quantity}</td>
                                  <td className="py-8 px-2 text-right font-black text-slate-400 font-mono text-base">₹{m.price.toFixed(2)}</td>
                                  <td className="py-8 px-2 text-right font-black text-white text-xl font-mono italic tracking-tighter">₹{(m.price * m.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>

                   {/* Calculator Section */}
                   <div className="mt-14 flex flex-col lg:flex-row justify-between items-start gap-14">
                      <div className="flex-1 bg-white/5 p-8 rounded-[40px] border border-white/5 italic relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Info size={48} className="text-indigo-400" />
                         </div>
                         <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6 flex items-center gap-2">
                            <Activity size={14} className="text-indigo-500" /> Regulatory Protocol
                         </h3>
                         <p className="text-slate-400 text-xs leading-relaxed font-bold max-w-md">
                            This document serves as a verified pharmaceutical record for medical insurance processing. 
                            Inventory items were dispensed by a certified medical official. 
                            Maintain this encrypted logic for your clinical history.
                         </p>
                      </div>
                      <div className="w-full lg:w-80 space-y-5">
                         <div className="flex justify-between text-slate-500 font-black px-6 text-[10px] uppercase tracking-widest">
                            <span>Aggregate Net</span>
                            <span className="font-mono text-slate-400 italic">₹{bill.subtotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between text-slate-500 font-black px-6 text-[10px] uppercase tracking-widest">
                            <span>Sovereign Tax (5%)</span>
                            <span className="font-mono text-slate-400 italic">₹{bill.tax.toFixed(2)}</span>
                         </div>
                         <div className="h-px bg-white/5 my-4 mx-6"></div>
                         <div className="bg-indigo-600 p-10 rounded-[48px] shadow-3xl shadow-indigo-900/50 text-white transform hover:scale-[1.02] transition-transform relative overflow-hidden border border-indigo-500/20">
                            <ShieldCheck className="absolute -right-6 -bottom-6 text-white/5" size={160} />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-3 italic">Final Disbursement</p>
                            <div className="flex justify-between items-end relative z-10">
                               <span className="text-5xl font-black font-mono tracking-tighter italic">₹{bill.total.toFixed(2)}</span>
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 ml-3">INR</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-[#020617] p-12 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 uppercase tracking-[0.2em]"></div>
                   <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.5em] mb-4 italic">Security Assurance Logic</p>
                   <p className="text-slate-500 text-xs max-w-xl mx-auto leading-relaxed opacity-60 font-black uppercase italic tracking-tight px-4">
                      Thank you for trusting PharmaCare. This document is cryptographically signed and stored within our secure medical vault to ensure privacy and data integrity.
                   </p>
                </div>
             </div>
           </div>
        </div>
    </MainLayout>
  );
}

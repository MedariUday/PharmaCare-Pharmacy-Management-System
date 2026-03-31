import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBillDetails, downloadBillPDF } from '../services/api';
import { 
  Printer, Download, ArrowLeft, CheckCircle, 
  Activity, Calendar, User, ShieldCheck, 
  CreditCard, Package, Hash, Info
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function StaffInvoice() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    getBillDetails(billId)
      .then(res => setBill(res.data))
      .catch(() => {
        const role = localStorage.getItem('userRole');
        navigate(role === 'Admin' ? '/admin/dashboard' : '/staff/dashboard');
      })
      .finally(() => setLoading(false));
  }, [billId]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await downloadBillPDF(billId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${bill?.bill_number || billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Preview Download Error:", err);
      alert('Failed to generate PDF. Please check backend logs.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-2xl h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  if (!bill) return null;

  const dateStr = new Date(bill.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const timeStr = new Date(bill.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Hide sidebar on print */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      <div className="flex-1 md:ml-[260px] p-4 sm:p-6 lg:p-8 print:p-0 print:ml-0">
        
        {/* Action Bar — hidden on print */}
        <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
              <ArrowLeft size={16} />
            </div>
            Back to Archive
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-sm font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Download size={16} /> {pdfLoading ? '...' : 'Download'}
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden print:shadow-none print:rounded-none print:border-none">
          
          {/* Top Banner Branding */}
          <div className="bg-slate-900 px-10 py-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                  <Activity size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter">MEDICARE</h1>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Pharmacy POS Network</p>
                </div>
              </div>
              <div className="space-y-1 text-slate-400 text-xs font-semibold">
                <p>Retail Licence: DL/2024/MZ-001</p>
                <p>Support: +91 98765 43210</p>
              </div>
            </div>

            <div className="relative z-10 text-left md:text-right">
              <div className="inline-flex items-center gap-2 bg-emerald-500 text-white rounded-full px-4 py-1.5 mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {bill.payment_status || 'Paid'}
                </span>
              </div>
              <h2 className="text-5xl font-black text-white mb-2 leading-none uppercase tracking-tighter">Invoice</h2>
              <div className="flex flex-col md:items-end">
                <p className="text-indigo-400 text-sm font-black font-mono">{bill.bill_number}</p>
                <p className="text-slate-500 text-[10px] font-bold mt-1">INTERNAL ID: #{billId.slice(-6).toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Info Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-50">
            <div className="p-10">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <User size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Billed To</span>
              </div>
              <p className="text-lg font-black text-slate-800 mb-1">{bill.customer_name || 'Walk-in Customer'}</p>
              <p className="text-xs text-slate-500 font-medium">Verified Customer ID: {bill.customer_id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="p-10">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Issued By</span>
              </div>
              <p className="text-lg font-black text-slate-800 mb-1">{bill.staff_name || 'System Staff'}</p>
              <p className="text-xs text-slate-500 font-medium">Pharmacist Ref: {bill.staff_id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="p-10">
              <div className="flex items-center gap-2 text-slate-400 mb-3">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Date & Time</span>
              </div>
              <p className="text-lg font-black text-slate-800 mb-1">{dateStr}</p>
              <p className="text-xs text-slate-500 font-medium">{timeStr} (IST)</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-10 py-6">
            <div className="rounded-3xl border border-slate-100 overflow-hidden bg-slate-50/30">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Description</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(bill.medicines || []).map((med, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Package size={16} className="text-indigo-400" />
                          <div>
                            <p className="font-black text-slate-800 text-sm tracking-tight">{med.medicine_name || med.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MRP: ₹{Number(med.price).toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black font-mono">
                          {med.batch_number || 'GEN-01'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-black text-slate-700">×{med.quantity}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-sm font-black text-slate-900 tracking-tight">₹{Number(med.subtotal || med.price * med.quantity).toFixed(2)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Terms & Notes</span>
              </div>
              <ul className="text-[10px] text-slate-400 font-semibold space-y-2 leading-relaxed">
                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-slate-300 mt-1" /> Goods once sold will not be taken back or exchanged.</li>
                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-slate-300 mt-1" /> This is a computer generated invoice and requires no signature.</li>
                <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-slate-300 mt-1" /> For any queries, please visit the help center in the app.</li>
              </ul>
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment via</span>
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-indigo-600" />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{bill.payment_method || 'Cash / Online'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black uppercase tracking-widest">Gross Subtotal</span>
                  <span className="text-sm font-black tracking-tight text-slate-600">₹{Number(bill.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-xs font-black uppercase tracking-widest">Estimated Tax ({Math.round((bill.tax_rate || 0.05) * 100)}%)</span>
                  <span className="text-sm font-black tracking-tight text-slate-600">₹{Number(bill.tax).toFixed(2)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-500">
                    <span className="text-xs font-black uppercase tracking-widest">Promotional Discount</span>
                    <span className="text-sm font-black tracking-tight">- ₹{Number(bill.discount).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="pt-6 border-t-2 border-slate-50 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Grand Total Payable</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{Number(bill.total).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Hash size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="p-10 border-t border-slate-50 text-center">
            <p className="text-sm font-black text-slate-800 tracking-tight">Thank you for Choosing Medicare!</p>
            <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-[0.3em]">www.medicarepharmacy.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Download, Printer, ArrowRight, 
  FileText, ShoppingBag, Home, User
} from 'lucide-react';
import { downloadBillPDF } from '../services/api';

export default function BillSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { billId, billNumber, total, customerName, invoiceUrl } = state || {};

  if (!billId) {
    navigate('/staff/dashboard');
    return null;
  }

  const handleDownload = async () => {
    try {
      // Task 5 & 11: Robust download logic
      const res = await downloadBillPDF(billId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${billNumber || billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("SUCCESS: BillSuccess download complete");
    } catch (err) {
      console.error("BillSuccess Download failed", err);
      alert("Failed to download invoice. Please try from History.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden transform transition-all">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-10 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 animate-bounce">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Bill Generated!</h1>
              <p className="text-indigo-100 font-medium">Transaction completed successfully</p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {/* Brief Info */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Bill Number</p>
                <p className="font-bold text-slate-800 font-mono">{billNumber || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                <p className="font-black text-indigo-600">₹{Number(total || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center mb-6">
                Customer: <span className="font-bold text-slate-800">{customerName || 'Walk-in'}</span>
              </p>

              {/* Main Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/staff/invoices/${billId}`)}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                  <FileText size={18} /> View Invoice
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                >
                  <Download size={18} /> Download PDF
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <button
                  onClick={() => window.print()}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
                >
                  <Printer size={16} className="text-slate-400 group-hover:text-slate-600" />
                  <span className="text-[9px] font-black uppercase text-slate-500">Print</span>
                </button>
                <button
                  onClick={() => navigate('/staff/billing')}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
                >
                  <ShoppingBag size={16} className="text-slate-400 group-hover:text-emerald-600" />
                  <span className="text-[9px] font-black uppercase text-slate-500">New Bill</span>
                </button>
                <button
                  onClick={() => navigate('/staff/dashboard')}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
                >
                  <Home size={16} className="text-slate-400 group-hover:text-indigo-600" />
                  <span className="text-[9px] font-black uppercase text-slate-500">Home</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-6 flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1">
              <ArrowRight size={10} /> POS System Active
            </span>
            <span>MEDICARE PHARMACY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

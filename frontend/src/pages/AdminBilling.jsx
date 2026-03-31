import React, { useState, useEffect } from 'react';
import { getCustomers, generateAdminBill, downloadBillPDF, api } from '../services/api';
import { 
  ShieldCheck, FileText, User, Receipt, CreditCard, 
  ChevronRight, CheckCircle, Download, ShoppingBag, 
  Clock, ArrowRight, AlertCircle, Loader2, Printer
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

export default function AdminBilling() {
  const [cartCustomers, setCartCustomers] = useState([]);
  const [selectedCust, setSelectedCust] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [billResult, setBillResult] = useState(null);
  const [step, setStep] = useState(1); // 1: Select, 2: Review/Generate
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const loadCarts = async () => {
      try {
        setFetching(true);
        const [custRes, cartRes] = await Promise.all([
          getCustomers(),
          api.get('/admin/cart/')
        ]);
        
        const activeCarts = cartRes.data;
        const customers = custRes.data;
        
        const custsWithCarts = activeCarts.map(cart => {
          const customer = customers.find(c => c.id === cart.customer_id);
          return customer ? { ...customer, cart } : null;
        }).filter(Boolean);
        
        setCartCustomers(custsWithCarts);
      } catch (err) {
        console.error("Failed to load carts:", err);
      } finally {
        setFetching(false);
      }
    };
    
    loadCarts();
  }, [billResult]);

  const handleSelect = (cust) => {
    setSelectedCust(cust);
    setCart(cust.cart);
    setBillResult(null);
    setStep(2);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateAdminBill({
        customer_id: selectedCust.id,
        tax_rate: 0.05
      });
      setBillResult(res.data);
      setStep(1);
      setSelectedCust(null);
      setCart(null);
      showToast(`Invoice #${res.data.bill_id} generated successfully!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error generating bill', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = (medicines) => {
    return medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Toast toast={toast} />
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: '260px' }}>
        <Navbar title="Master Billing Control" />
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header & Local Workflow */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100 text-white">
                      <ShieldCheck size={24} />
                   </div>
                   <h1 className="text-3xl font-black text-slate-800 tracking-tight">Invoice Generation</h1>
                </div>
                <p className="text-slate-500 font-medium">Verify pending orders and convert them to official tax invoices.</p>
              </div>

              <div className="flex items-center bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step === 1 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>1</div>
                  <span className="text-xs font-black uppercase tracking-wider">Queue</span>
                </div>
                <div className="w-8 h-px bg-slate-100 mx-1"></div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step === 2 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>2</div>
                  <span className="text-xs font-black uppercase tracking-wider">Verification</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-italic-font-fix">
              {/* Left Column: Queue */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-8 border border-slate-50">
                   <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                      <Clock size={14} className="text-indigo-500" /> Pending Approval Queue
                   </h2>
                   
                   <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {fetching ? (
                        <div className="py-20 text-center">
                          <Loader2 className="animate-spin text-indigo-500 h-10 w-10 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold text-sm">Scanning digital carts...</p>
                        </div>
                      ) : cartCustomers.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                           <ShoppingBag className="mx-auto text-slate-200 h-12 w-12 mb-3" />
                           <p className="text-slate-400 font-bold">Queue is currently empty</p>
                        </div>
                      ) : (
                        cartCustomers.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => handleSelect(c)}
                            className={`group relative p-5 rounded-[24px] cursor-pointer transition-all duration-300 border-2 ${selectedCust?.id === c.id ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' : 'border-transparent bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-100'}`}
                          >
                             <div className="flex justify-between items-start">
                                <div>
                                   <p className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{c.name}</p>
                                   <div className="flex items-center gap-4 mt-2">
                                      <p className="text-[10px] font-black bg-white px-2 py-1 rounded-lg text-slate-500 border border-slate-100">{c.cart.medicines.length} ITEMS</p>
                                      <p className="text-indigo-600 font-black text-sm tracking-tight">₹{calculateSubtotal(c.cart.medicines).toFixed(2)}</p>
                                   </div>
                                </div>
                                <div className={`p-2 rounded-xl transition-colors ${selectedCust?.id === c.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 group-hover:text-indigo-500 shadow-sm'}`}>
                                   <ChevronRight size={18} />
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                {billResult && (
                  <div className="bg-emerald-600 rounded-[32px] p-8 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10 text-center">
                       <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                          <CheckCircle size={32} />
                       </div>
                       <h3 className="text-xl font-black mb-1">Invoice Issued!</h3>
                       <p className="text-emerald-100 text-xs font-bold mb-6 tracking-wide">Ref: #{billResult.bill_id}</p>
                       
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await downloadBillPDF(billResult.bill_id);
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `INVOICE_${billResult.bill_id}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                showToast('PDF downloaded successfully!', 'success');
                              } catch (err) { 
                                showToast("Download failed", "error"); 
                              }
                            }}
                            className="bg-white text-emerald-700 px-4 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Download size={14} /> PDF
                          </button>
                          <button className="bg-emerald-700 text-white border border-emerald-500/50 px-4 py-3 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2">
                             <Printer size={14} /> Print
                          </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Review */}
              <div className="lg:col-span-8">
                {selectedCust ? (
                  <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-50 flex flex-col min-h-[700px]">
                    <div className="p-10 bg-indigo-600 text-white relative">
                      <div className="absolute right-0 top-0 p-12 opacity-10 rotate-12">
                         <Receipt size={180} />
                      </div>
                      <div className="relative z-10 flex justify-between items-end">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Stage 02: Verification</p>
                          <h3 className="text-4xl font-black tracking-tight">Verify Order Flow</h3>
                          <div className="flex items-center gap-3 mt-4">
                             <div className="bg-white/20 p-2 rounded-lg text-white">
                                <User size={16} />
                             </div>
                             <p className="font-bold text-lg">{selectedCust.name} <span className="opacity-50 font-medium ml-2 text-sm">ID: {selectedCust.id}</span></p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Authenticated Contact</p>
                          <p className="text-2xl font-black tracking-widest bg-black/20 px-4 py-1.5 rounded-2xl border border-white/10">{selectedCust.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 flex-grow">
                      <div className="border border-slate-100 rounded-[32px] overflow-hidden mb-8 shadow-sm">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              <th className="px-8 py-5">Product Details</th>
                              <th className="px-8 py-5 text-center">Unit Qty</th>
                              <th className="px-8 py-5 text-right">M.R.P</th>
                              <th className="px-8 py-5 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {cart.medicines.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                      <p className="text-slate-700 font-black text-lg">{item.name}</p>
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-center text-slate-600 font-black text-lg">{item.quantity}</td>
                                <td className="px-8 py-6 text-right text-slate-500 font-bold">₹{item.price.toFixed(2)}</td>
                                <td className="px-8 py-6 text-right font-black text-slate-900 text-xl">₹{(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-start gap-12 mt-12 bg-slate-50/80 p-10 rounded-[40px] border border-slate-100 border-dashed">
                        <div className="flex-1 space-y-6">
                           <div className="space-y-3">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                 <CreditCard size={14} className="text-indigo-600" /> Transaction Protocol
                              </h4>
                              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                 By generating this invoice, you confirm that all medications have been properly verified against a valid prescription and stock and inventory levels will be automatically adjusted.
                              </p>
                           </div>
                           <div className="h-px bg-slate-200"></div>
                           <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GST Registered</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Legal Tender</span>
                              </div>
                           </div>
                        </div>

                        <div className="w-full md:w-80 space-y-5">
                          <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                            <span>Subtotal</span>
                            <span className="text-slate-600">₹{calculateSubtotal(cart.medicines).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                            <span>Tax (5% GST)</span>
                            <span className="text-slate-600">₹{(calculateSubtotal(cart.medicines) * 0.05).toFixed(2)}</span>
                          </div>
                          <div className="bg-indigo-600 px-8 py-10 rounded-[32px] shadow-2xl shadow-indigo-200 transform hover:scale-[1.02] transition-transform duration-500 text-white">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-2">Final Payable</p>
                             <div className="flex justify-between items-end">
                                <span className="text-4xl font-black tracking-tighter">₹{(calculateSubtotal(cart.medicines) * 1.05).toFixed(2)}</span>
                                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-lg">INR</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                       <button onClick={() => {setStep(1); setSelectedCust(null);}} className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors">
                          Cancel Verification
                       </button>
                       <button 
                         onClick={handleGenerate}
                         disabled={loading}
                         className="px-12 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 group gap-3"
                       >
                         {loading ? <Loader2 className="animate-spin" size={24} /> : (
                           <>
                             Generate Digital Invoice <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                           </>
                         )}
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[700px] flex flex-col items-center justify-center bg-white rounded-[40px] border-4 border-dashed border-slate-50 text-slate-200">
                    <div className="bg-slate-50 p-10 rounded-[40px] mb-6">
                       <Receipt className="h-24 w-24 opacity-20" />
                    </div>
                    <p className="font-black text-xl uppercase tracking-[0.2em] text-slate-300">Awaiting Cart Selection</p>
                    <p className="font-medium text-slate-400 mt-2 max-w-sm text-center">Select a pending digital cart from the queue to review and generate a finalized tax invoice.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

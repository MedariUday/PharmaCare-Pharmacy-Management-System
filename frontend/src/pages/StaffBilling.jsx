import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getCustomers, getMedicines, getCart, createCart, 
  getCustomerStats, getFrequentMedicines, generateStaffBill
} from '../services/api';
import { 
  ShoppingCart, Search, User, Trash2, Plus, Minus, CheckCircle, 
  ChevronRight, X, Info, Package, Zap, Wallet
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { SearchInput } from '../components/Input';

const CATEGORY_COLORS = {
  'Tablet': 'bg-blue-100 text-blue-700',
  'Capsule': 'bg-purple-100 text-purple-700',
  'Syrup': 'bg-orange-100 text-orange-700',
  'Injection': 'bg-red-100 text-red-700',
  'Default': 'bg-gray-100 text-gray-700'
};

export default function StaffBilling() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [frequentMedicines, setFrequentMedicines] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchCust, setSearchCust] = useState('');
  const [searchMed, setSearchMed] = useState('');
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCustomers(),
      getMedicines({ limit: 1000 }),
      getFrequentMedicines()
    ]).then(([custRes, medRes, freqRes]) => {
      const allCustomers = custRes.data || [];
      setCustomers(allCustomers);
      setMedicines(medRes.data.data || []);
      setFrequentMedicines(freqRes.data || []);

      if (location.state?.customerId) {
        const target = allCustomers.find(c => c.id === location.state.customerId);
        if (target) handleSelectCustomer(target);
      }
    }).finally(() => setLoading(false));
  }, [location.state]);

  const handleSelectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setSearchCust(customer.name);
    setCurrentStep(2);
    try {
      const statsRes = await getCustomerStats(customer.id);
      setCustomerStats(statsRes.data);
      const cartRes = await getCart(customer.id);
      setCartItems(cartRes.data.medicines || []);
    } catch {
      setCartItems([]);
      setCustomerStats(null);
    }
  };

  const addToCart = (medicine) => {
    if (!selectedCustomer) {
      alert('Please select a stakeholder first');
      setCurrentStep(1);
      return;
    }
    const existing = cartItems.find(item => item.medicine_id === medicine.id);
    if (existing) {
      updateQuantity(medicine.id, existing.quantity + 1, medicine.stock);
    } else {
      if (medicine.stock < 1) return alert('Protocol Failure: Out of Stock');
      const newItems = [...cartItems, { 
        medicine_id: medicine.id, 
        name: medicine.name, 
        quantity: 1, 
        price: medicine.selling_price,
        maxStock: medicine.stock,
        category: medicine.category
      }];
      setCartItems(newItems);
    }
    setSearchMed('');
    setShowMedSuggestions(false);
  };

  const updateQuantity = (id, newQty, maxStock) => {
    if (newQty < 1) return;
    if (newQty > maxStock) {
      alert(`Asset Limit: Only ${maxStock} units remaining`);
      return;
    }
    setCartItems(cartItems.map(item => 
      item.medicine_id === id ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (id) => setCartItems(cartItems.filter(item => item.medicine_id !== id));

  const clearCart = () => {
    if (window.confirm('Clear operational cart data?')) setCartItems([]);
  };

  const handleSaveCart = async () => {
    if (!selectedCustomer || cartItems.length === 0) return;
    setLoading(true);
    try {
      await createCart({
        customer_id: selectedCustomer.id,
        medicines: cartItems.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          price: item.price,
        }))
      });
      const res = await generateStaffBill({
        customer_id: selectedCustomer.id,
        tax_rate: 0.05,
        discount: 0.0,
        payment_status: 'Paid',
      });
      const billData = res.data;
      navigate('/staff/bill-success', { 
        state: { 
          billId: billData.id || billData.bill_id,
          billNumber: billData.bill_number,
          total: billData.total,
          customerName: selectedCustomer.name,
          invoiceUrl: billData.invoice_url
        } 
      });
    } catch (err) {
      alert(err?.response?.data?.detail || 'Protocol Error generating bill.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCust.toLowerCase()) || 
    (c.phone || '').includes(searchCust)
  );

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchMed.toLowerCase())
  ).slice(0, 5);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const getStockColor = (stock) => {
    if (stock < 10) return 'text-red-500';
    if (stock <= 20) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <MainLayout title="Terminal POS">
        {/* Responsive Workflow Hub */}
        <div className="mb-6 sm:mb-8 bg-white/2 p-1.5 sm:p-2 rounded-2xl border border-white/5 flex flex-wrap items-center justify-center sm:justify-between gap-1 overflow-x-auto custom-scrollbar scrolling-touch backdrop-blur-md">
            {[
                { step: 1, label: 'Identify', icon: User },
                { step: 2, label: 'Asset Intake', icon: Package },
                { step: 3, label: 'Review', icon: ShoppingCart },
                { step: 4, label: 'Authorize', icon: CheckCircle },
            ].map((s, i) => (
                <div key={s.step} className="flex items-center">
                    <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl transition-all ${
                        currentStep === s.step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 
                         currentStep > s.step ? 'text-emerald-400' : 'text-slate-600'
                    }`}>
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                            currentStep === s.step ? 'bg-white text-indigo-600 font-black' : 
                            currentStep > s.step ? 'bg-emerald-400 text-[#0f172a]' : 'bg-slate-800 text-slate-500'
                        }`}>
                            {currentStep > s.step ? <CheckCircle size={14} /> : s.step}
                        </div>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest hidden sm:inline whitespace-nowrap">{s.label}</span>
                    </div>
                    {i < 3 && <ChevronRight size={14} className="mx-1 sm:mx-2 text-slate-800" />}
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 overflow-x-hidden">
            
            {/* Control Sidebar: Identifying Stakeholders & Asset Intake */}
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
                
                {/* Stakeholder Authentication */}
                <div className="bg-slate-800/20 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm">
                    <h2 className="text-white font-black uppercase italic text-sm mb-4 flex items-center gap-2 tracking-tighter">
                        <User className="text-indigo-400" size={18} /> Stakeholder Profile
                    </h2>
                    {!selectedCustomer ? (
                        <div className="relative">
                            <SearchInput 
                                placeholder="Search Name/ID..."
                                value={searchCust}
                                onChange={(e) => setSearchCust(e.target.value)}
                                className="bg-slate-900 border-white/5"
                            />
                            {searchCust && (
                                <div className="mt-2 border border-white/5 rounded-2xl max-h-48 overflow-y-auto bg-[#0f172a] shadow-2xl z-20 absolute w-full custom-scrollbar">
                                    {filteredCustomers.map(c => (
                                        <div 
                                            key={c.id} 
                                            className="p-3 hover:bg-indigo-600/10 cursor-pointer text-xs border-b border-white/5 last:border-0 flex justify-between group transition-colors"
                                            onClick={() => handleSelectCustomer(c)}
                                        >
                                            <span className="font-bold text-slate-300 group-hover:text-white uppercase tracking-tighter">{c.name}</span>
                                            <span className="text-slate-600 font-mono">…{c.phone?.slice(-4)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl shadow-inner">
                                <div className="min-w-0">
                                    <p className="font-black text-white uppercase italic tracking-tighter truncate">{selectedCustomer.name}</p>
                                    <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Verified Participant</p>
                                </div>
                                <button onClick={() => {setSelectedCustomer(null); setCustomerStats(null); setCurrentStep(1);}} className="p-2 text-slate-500 hover:text-rose-500 transition-colors bg-white/5 rounded-xl"><X size={16} /></button>
                            </div>
                            {customerStats && (
                                <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <div className="p-3 bg-white/2 rounded-2xl border border-white/5">
                                        <p className="mb-1 text-slate-600">History</p>
                                        <p className="text-base text-white">{customerStats.total_orders} Txn</p>
                                    </div>
                                    <div className="p-3 bg-white/2 rounded-2xl border border-white/5">
                                        <p className="mb-1 text-slate-600">Sync Date</p>
                                        <p className="text-base text-white">{customerStats.last_purchase ? new Date(customerStats.last_purchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Intelligent Asset Search */}
                <div className="bg-slate-800/20 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-sm">
                    <h2 className="text-white font-black uppercase italic text-sm mb-4 flex items-center gap-2 tracking-tighter">
                        <Package className="text-indigo-400" size={18} /> Asset Intake
                    </h2>
                    <div className="relative">
                        <SearchInput 
                            placeholder="Medicine Protocol..."
                            value={searchMed}
                            onFocus={() => setShowMedSuggestions(true)}
                            onChange={(e) => setSearchMed(e.target.value)}
                            className="bg-slate-900 border-white/5"
                        />
                        {showMedSuggestions && searchMed && (
                            <div className="absolute w-full mt-2 bg-[#0f172a] border border-white/5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 max-h-80 overflow-y-auto custom-scrollbar">
                                {filteredMedicines.map(m => (
                                    <div key={m.id} 
                                        className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between border-b border-white/2 last:border-0 group transition-colors"
                                        onClick={() => addToCart(m)}
                                    >
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-300 group-hover:text-white uppercase tracking-tighter truncate">{m.name}</p>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1">
                                                ₹{m.selling_price} • <span className={getStockColor(m.stock)}>SKU: {m.stock}</span>
                                            </p>
                                        </div>
                                        <Plus size={16} className="text-slate-600 group-hover:text-white flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                           <Zap size={12} className="text-amber-500" /> Velocity Items
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {frequentMedicines.slice(0, 4).map(m => (
                                <button 
                                    key={m.id} 
                                    onClick={() => addToCart(m)}
                                    className="px-3 py-1.5 bg-white/2 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-indigo-600/10 hover:border-indigo-500/20 hover:text-indigo-400 transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                    <Plus size={10} /> {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Terminal: Cart Management & Authorization */}
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
                
                <div className="bg-slate-800/20 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col min-h-[500px] sm:min-h-[600px] relative">
                    <div className="p-6 sm:p-8 bg-white/2 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">Operational Terminal</h2>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Reviewing High-Precision Asset Clusters</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={clearCart} className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-95">Reset</button>
                            <span className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-indigo-500/20 flex items-center justify-center">
                                {cartItems.reduce((a, b) => a + b.quantity, 0)} Units
                            </span>
                        </div>
                    </div>

                    <div className="flex-grow p-4 sm:p-8">
                        {cartItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-6 opacity-40">
                                <div className="w-24 h-24 bg-white/2 rounded-[2rem] border border-white/5 flex items-center justify-center shadow-inner">
                                    <ShoppingCart size={48} className="rotate-[-12deg]" />
                                </div>
                                <p className="font-black text-xs uppercase tracking-[0.2em] text-center max-w-[250px]">Terminal state: Initialized. No assets identified in current session.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto custom-scrollbar scrolling-touch">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                            <th className="pb-5 px-4 font-black whitespace-nowrap">Asset Identifier</th>
                                            <th className="pb-5 px-4 font-black whitespace-nowrap">Unit Rate</th>
                                            <th className="pb-5 px-4 text-center font-black whitespace-nowrap">Operational Density</th>
                                            <th className="pb-5 px-4 text-right font-black whitespace-nowrap">Net Protocol</th>
                                            <th className="pb-5 text-right font-black whitespace-nowrap"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/2">
                                        {cartItems.map((item) => (
                                            <tr key={item.medicine_id} className="group hover:bg-white/5 transition-all">
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Default} bg-opacity-20 flex-shrink-0`}>
                                                            <Package size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-black text-white uppercase italic tracking-tighter truncate max-w-[150px]">{item.name}</p>
                                                            <span className="text-[8px] uppercase px-2 py-0.5 rounded-full font-black tracking-widest bg-white/5 text-slate-500 border border-white/5">
                                                                {item.category || 'Clinical'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-slate-300 font-mono text-xs font-black tracking-widest">₹{item.price.toLocaleString()}</td>
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button onClick={() => updateQuantity(item.medicine_id, item.quantity - 1, item.maxStock)} className="w-9 h-9 flex items-center justify-center border border-white/5 rounded-xl text-slate-600 hover:text-white hover:bg-white/5 transition-all active:scale-90"><Minus size={14} /></button>
                                                        <span className="w-8 text-center text-lg font-black text-white italic tracking-tighter">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.medicine_id, item.quantity + 1, item.maxStock)} className="w-9 h-9 flex items-center justify-center border border-white/5 rounded-xl text-slate-600 hover:text-white hover:bg-white/5 transition-all active:scale-90"><Plus size={14} /></button>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-right font-black text-white text-lg tracking-tighter italic">₹{(item.price * item.quantity).toLocaleString()}</td>
                                                <td className="py-6 text-right pl-4">
                                                    <button onClick={() => removeFromCart(item.medicine_id)} className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95"><Trash2 size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Authorization Panel - Responsive Stacking */}
                    <div className="p-8 sm:p-10 bg-white/2 border-t border-white/5 flex flex-col md:flex-row gap-8 items-center justify-between">
                        <div className="flex-1 space-y-3 w-full max-w-sm">
                            <h3 className="text-slate-500 font-black flex items-center gap-2 mb-4 uppercase text-[10px] tracking-[0.2em]"><Wallet size={16} className="text-indigo-400" /> Fiscal Metadata</h3>
                            <div className="flex justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest"><span>Cumulative Base</span><span className="text-slate-400 font-mono">₹{subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest"><span>Clinical Surcharge (5%)</span><span className="text-slate-400 font-mono">₹{tax.toLocaleString()}</span></div>
                            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-slate-400 font-black uppercase italic tracking-tighter">Grand Total Protocol</span>
                                <span className="text-3xl sm:text-4xl font-black text-indigo-500 italic tracking-tighter">₹{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="w-full md:w-auto self-stretch md:self-auto">
                            <button 
                                onClick={handleSaveCart}
                                disabled={cartItems.length === 0 || !selectedCustomer || loading}
                                className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase italic tracking-[0.2em] hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 transition-all active:scale-95 group"
                            >
                                <CheckCircle className="group-hover:scale-125 transition-transform" size={24} /> 
                                <span className="text-xs">{loading ? 'Synchronizing Intelligence...' : 'Authorize Transaction'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="animate-in slide-in-from-bottom flex items-center justify-center gap-3 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-500/10">
                        <CheckCircle size={18} /> {message}
                    </div>
                )}
            </div>
        </div>
    </MainLayout>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { getMedicines, getSuppliers, updateInventoryStock } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SearchInput } from '../components/Input';
import Toast from '../components/Toast';
import { Plus, Edit2, PackagePlus, AlertTriangle, AlertCircle, RefreshCw, Box, ChevronRight, Info } from 'lucide-react';

export default function Inventory() {
  const { user } = useAuth();
  const canEdit = ['Admin', 'Pharmacist'].includes(user?.role);
  
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [search, setSearch] = useState(location.state?.search || '');
  
  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'add' | 'reduce' | 'adjust'
  const [selectedMed, setSelectedMed] = useState(null);
  const [form, setForm] = useState({ quantity: '', reason: '', notes: '', supplier_id: '', batch_number: '', expiry_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [medRes, supRes] = await Promise.all([
        getMedicines({ limit: 1000 }),
        getSuppliers()
      ]);
      setMedicines(medRes.data?.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredMedicines = useMemo(() => {
    if (!search) return medicines;
    const q = search.toLowerCase();
    return medicines.filter(m => m.name.toLowerCase().includes(q) || m.manufacturer?.toLowerCase().includes(q));
  }, [search, medicines]);

  const openModal = (mode, med = null) => {
    setModalMode(mode);
    setSelectedMed(med);
    setForm({ quantity: '', reason: '', notes: '', supplier_id: med?.supplier_id || '', batch_number: med?.batch_number || '', expiry_date: med?.expiry_date ? med.expiry_date.split('T')[0] : '' });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedMed(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!selectedMed) throw new Error("No medicine selected");
      const payload = {
        action_type: modalMode,
        quantity: parseInt(form.quantity),
        reason: form.reason || undefined,
        notes: form.notes || undefined
      };
      
      if (modalMode === 'add') {
        payload.supplier_id = form.supplier_id || undefined;
        payload.batch_number = form.batch_number || undefined;
        payload.expiry_date = form.expiry_date ? new Date(form.expiry_date).toISOString() : undefined;
      }
      
      await updateInventoryStock(selectedMed.id, payload);
      showToast(`Stock successfully updated!`, 'success');
      closeModal();
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.detail || err.message || 'Error updating stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview Maths
  const currentStock = selectedMed?.stock || 0;
  const rawQ = parseInt(form.quantity) || 0;
  let newStock = currentStock;
  if (modalMode === 'add') newStock = currentStock + rawQ;
  if (modalMode === 'reduce') newStock = currentStock - rawQ;
  if (modalMode === 'adjust') newStock = rawQ;

  return (
    <MainLayout title="Inventory Registry">
        {toast.show && <Toast toast={toast} />}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 overflow-x-hidden">
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter mb-1">Active Assets</h1>
                <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest leading-relaxed">
                    Audit and control batch intakes, stock depletion, and supplier protocols.
                </p>
            </div>
            {canEdit && (
                <button 
                    onClick={() => openModal('add')} 
                    className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <PackagePlus size={18} /> Add Stock Intake
                </button>
            )}
        </div>
        
        <div className="bg-slate-800/40 p-4 sm:p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-96 min-w-0">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">Targeted Catalog Search</label>
                <SearchInput 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    onClear={() => setSearch('')}
                    placeholder="Find medicine or manufacturer protocol..." 
                    className="bg-slate-900/50 border-white/5"
                />
            </div>
            <button 
                onClick={loadData} 
                className="w-full md:w-auto flex items-center justify-center gap-2 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors px-6 py-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 active:scale-95"
            >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Operational Catalog
            </button>
        </div>

        <div className="bg-slate-800/20 rounded-[2.5rem] border border-white/5 shadow-2xl relative mb-12">
            <div className="w-full overflow-x-auto custom-scrollbar scrolling-touch">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto mb-4"></div>
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Synchronizing Local State...</p>
                    </div>
                ) : filteredMedicines.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700">
                            <Box size={32} />
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Zero operational assets discovered</p>
                    </div>
                ) : (
                <table className="w-full text-sm text-left min-w-[900px]">
                    <thead className="bg-white/2 border-b border-white/5">
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-8 py-5 whitespace-nowrap">Medicine Identifier</th>
                            <th className="px-8 py-5 whitespace-nowrap">Manufacturer Protocol</th>
                            <th className="px-8 py-5 whitespace-nowrap">Category</th>
                            <th className="px-8 py-5 text-center whitespace-nowrap">Batch Sequence</th>
                            <th className="px-8 py-5 text-center whitespace-nowrap">Current Asset Level</th>
                            <th className="px-8 py-5 text-right whitespace-nowrap">Operational Overrides</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/2 text-slate-300">
                    {filteredMedicines.map((m) => {
                        const isLow = m.stock <= (m.minimum_stock || 5);
                        return (
                        <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-5">
                                <p className="font-black text-white uppercase tracking-tight truncate max-w-[200px]">{m.name}</p>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">REF: …{m.id.slice(-6).toUpperCase()}</p>
                            </td>
                            <td className="px-8 py-5 text-xs font-bold text-slate-500">{m.manufacturer || 'INTERNAL'}</td>
                            <td className="px-8 py-5">
                                <span className="px-3 py-1 bg-slate-700/50 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                                    {m.category}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-center font-mono text-slate-400 text-xs tracking-tighter">{m.batch_number || 'UNDEFINED'}</td>
                            <td className="px-8 py-5 text-center">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border ${isLow ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-white/2 text-white border-white/5'}`}>
                                    {isLow && <AlertCircle size={14} className="animate-pulse" />} 
                                    <span className="font-black text-lg tracking-tighter">{m.stock}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right space-x-2">
                            {canEdit && (
                                <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal('add', m)} className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all inline-flex items-center justify-center active:scale-95" title="Protocol Intake">
                                        <Plus size={18} />
                                    </button>
                                    <button onClick={() => openModal('reduce', m)} className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all inline-flex items-center justify-center active:scale-95" title="Operational Deduction">
                                        <AlertCircle size={18} />
                                    </button>
                                    <button onClick={() => openModal('adjust', m)} className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 transition-all inline-flex items-center justify-center active:scale-95" title="System Override">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                )}
            </div>
        </div>

        {/* Dynamic Update Modal - Responsive Refinement */}
        {modalMode && (
            <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-4 pt-12 sm:pt-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={closeModal}>
            <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-top-8 sm:zoom-in-95 duration-300 flex flex-col max-h-[calc(100vh-6rem)] sm:max-h-[95vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 sm:p-8 pb-4 border-b border-white/5 flex justify-between items-center bg-white/2 flex-shrink-0">

                    <div>
                        <h3 className="font-black text-xl sm:text-2xl text-white uppercase italic tracking-tighter">
                        {modalMode === 'add' ? 'Operational Intake' : modalMode === 'reduce' ? 'Operational Deduction' : 'System Override'}
                        </h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        {selectedMed ? `Targeting: ${selectedMed.name}` : `Select Targeted Asset below`}
                        </p>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white flex-shrink-0"><AlertCircle size={24} className="rotate-45" /></button>
                </div>
                
                <form onSubmit={handleUpdate} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar pb-10">
                
                {!selectedMed && modalMode === 'add' && (
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Protocol Selection</label>
                        <select required className="w-full bg-slate-900 border border-white/10 text-white font-bold px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" onChange={e => setSelectedMed(medicines.find(m => m.id === e.target.value))}>
                            <option value="">Select Target Medicine...</option>
                            {medicines.map(m => <option key={m.id} value={m.id}>{m.name} (Cur: {m.stock})</option>)}
                        </select>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-end">
                    <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">
                            {modalMode === 'adjust' ? 'Final New Level' : 'Asset Adjustment Quantity'}
                        </label>
                        <input required type="number" min={modalMode === 'adjust' ? "0" : "1"} className="w-full bg-slate-900 border border-white/10 text-white px-5 py-4 rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-indigo-500/50" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    
                    {selectedMed && (
                        <div className="w-full sm:w-40 bg-white/2 rounded-2xl border border-white/5 p-4 flex flex-col justify-center items-center shadow-inner relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>
                            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-1 flex items-center gap-1.5"><Info size={10} /> Prediction</span>
                            <div className="flex items-center gap-2 font-mono">
                                <span className="text-slate-500 text-sm font-bold">{currentStock}</span>
                                <span className="text-slate-700">→</span>
                                <span className={`font-black text-xl ${newStock < 0 ? 'text-rose-500' : 'text-indigo-400'}`}>{newStock}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Advanced Supply Metadata (Only for Stock In) */}
                {modalMode === 'add' && (
                    <div className="p-4 sm:p-6 bg-indigo-500/5 rounded-[1.5rem] sm:rounded-[2rem] border border-indigo-500/10 space-y-4 sm:space-y-5 relative overflow-hidden shadow-inner">
                        <div className="sm:absolute top-0 right-0 px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest sm:rounded-bl-2xl shadow-lg shadow-indigo-500/20 mb-4 sm:mb-0 inline-block">Supply Protocol</div>
                        
                        <div className="pt-2">
                            <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-2 mb-2">Authenticated Supplier</label>
                            <select required className="w-full bg-slate-900 border border-white/5 text-white px-4 py-3.5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none shadow-xl" value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                                <option value="">Authorize Delivery Source...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-2 mb-2">Batch Protocol</label>
                                <input required type="text" placeholder="e.g. BATCH-99XYZ" className="w-full bg-slate-900 border border-white/5 text-white px-4 py-3.5 rounded-2xl font-mono text-xs sm:text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-2 mb-2">Bio-Expiry Protocol</label>
                                <input required type="date" className="w-full bg-slate-900 border border-white/5 text-white px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Justification - Critical Audit Trail */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">Operational Justification</label>
                        <input required type="text" placeholder="e.g. Protocol replenishment, Quality suppression..." className="w-full bg-slate-900 border border-white/10 text-white px-5 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">Audit Intelligence Notes (Deep Journal)</label>
                        <textarea rows="3" className="w-full bg-slate-900 border border-white/10 text-white px-5 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none custom-scrollbar shadow-inner" placeholder="Detailed logs for operational history..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/5 flex-shrink-0">
                    <button type="button" onClick={closeModal} className="order-2 sm:order-1 w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">Cancel Synchronization</button>
                    <button type="submit" disabled={submitting || newStock < 0 || (!selectedMed && modalMode !== 'add')} className={`order-1 sm:order-2 w-full sm:w-auto px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-white transition-all shadow-2xl active:scale-95 ${modalMode === 'add' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30' : modalMode === 'reduce' ? 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/30' : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30'} ${submitting || newStock < 0 ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}>
                    {submitting ? 'Authenticating Protocol...' : 'Finalize Audit Action'}
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}

    </MainLayout>
  );
}

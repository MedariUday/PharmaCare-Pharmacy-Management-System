import React, { useEffect, useState, useMemo } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Pencil, Trash2, Truck, Search, Loader2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { SearchInput } from '../components/Input';
import Toast from '../components/Toast';

const EMPTY = { name: '', contact: '', address: '' };

export default function Suppliers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin';
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ text: '', type: '' });

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await getSuppliers();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load supply chains.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

  const openEdit = (s) => { setForm(s); setEditId(s.id); setShowModal(true); };
  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) await updateSupplier(editId, form);
      else await createSupplier(form);
      showToast(`Supplier ${editId ? 'refined' : 'established'} successfully!`);
      setShowModal(false);
      await load();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Aggregation failure.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Terminate this supply chain relationship?')) return;
    try {
      await deleteSupplier(id);
      showToast('Supplier removed from registry.');
      await load();
    } catch {
      showToast('Failed to delete supplier.', 'error');
    }
  };

  return (
    <AdminLayout title="Supply Chain Management">
      <Toast toast={toast} />

      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Truck size={24} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Logistics Hub</h1>
          </div>
          <p className="text-slate-400 font-medium lowercase tracking-wide">Managing {suppliers.length} high-velocity pharmaceutical vendors.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="w-full sm:w-72">
            <SearchInput
              placeholder="Search vendor registry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              className="bg-slate-900 border-white/10"
            />
          </div>
          {canEdit && (
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95 w-full sm:w-auto uppercase tracking-widest text-[10px]"
            >
              <Plus size={18} /> Establish Supplier
            </button>
          )}
        </div>
      </div>

      {/* Results - Responsive Strategy */}
      <div className="relative mb-12">
        {loading ? (
          <div className="bg-slate-800/20 backdrop-blur-xl rounded-[40px] border border-white/5 py-24 text-center shadow-2xl">
            <Loader2 className="animate-spin text-indigo-500 h-10 w-10 mx-auto mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Accessing Vendor Data Registry...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block bg-slate-800/20 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white/2 border-b border-white/5 italic">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Supplier Entity</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Communication Logic</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Deployment Base</th>
                      {canEdit && <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right whitespace-nowrap">Command</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2 text-slate-300">
                    {filteredSuppliers.map(s => (
                      <tr key={s.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                              <Truck size={22} />
                            </div>
                            <div>
                              <p className="font-black text-white tracking-tight text-base uppercase italic">{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Verified Vendor</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-black text-sm uppercase tracking-tighter italic">{s.contact}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Primary Logic</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-start gap-2 max-w-[250px]">
                            <span className="text-slate-400 font-medium text-xs leading-relaxed italic">{s.address}</span>
                          </div>
                        </td>
                        {canEdit && (
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEdit(s)}
                                className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all active:scale-90"
                                title="Edit Intel"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id)}
                                className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                                title="Terminate Relationship"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card Grid - Visible on Mobile Only */}
            <div className="grid grid-cols-1 gap-5 md:hidden">
              {filteredSuppliers.map(s => (
                <div key={s.id} className="bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 shadow-xl transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                        <Truck size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-lg tracking-tight uppercase italic truncate max-w-[160px]">{s.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em]">Verified Entity</span>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                       <div className="flex gap-2">
                          <button onClick={() => openEdit(s)} className="p-3.5 bg-white/5 text-slate-400 rounded-2xl hover:text-indigo-400 transition-all active:scale-95 border border-white/5"><Pencil size={18} /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-500/20"><Trash2 size={18} /></button>
                       </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Communication Channel</p>
                       <p className="text-sm font-black text-indigo-100 uppercase italic tracking-tighter">{s.contact}</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Deployment Operations Base</p>
                       <p className="text-xs font-bold text-slate-400 italic leading-relaxed">{s.address}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredSuppliers.length === 0 && (
              <div className="py-32 bg-slate-800/20 backdrop-blur-xl rounded-[40px] border border-white/5 text-center shadow-2xl">
                <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-slate-600 border border-white/5 mx-auto mb-6 opacity-20">
                   <Search size={36} />
                </div>
                <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-1">Grid Pattern Mismatch</h3>
                <p className="text-slate-500 text-[10px] font-bold lowercase tracking-wider">No matching vendor signals detected in this sector.</p>
              </div>
            )}
          </>
        )}
      </div>


      {/* Modal - Responsive Floating Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-12 sm:pt-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-top-8 sm:zoom-in-95 duration-500 ease-out" onClick={e => e.stopPropagation()}>
            <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden flex-shrink-0">
               <Truck className="absolute right-6 top-4 opacity-10" size={140} />
               <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">{editId ? 'Refine Vendor' : 'Establish Vendor'}</h2>
                    <p className="text-indigo-100 text-[10px] sm:text-xs mt-1 font-medium uppercase tracking-widest leading-relaxed">Coordinate logistics and supply chain variables.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="absolute top-0 right-0 sm:relative p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                     <X size={20} />
                  </button>
               </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-5 sm:space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              {[
                { label: 'Supplier Entity Identity', key: 'name', placeholder: 'e.g. BioCore Pharmaceutical Unit' },
                { label: 'Communication Protocol', key: 'contact', placeholder: 'Email or Mobile Frequency' },
                { label: 'Deployment Operational Base', key: 'address', placeholder: 'Operational Headquarters' }
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>
                  <input
                    required
                    type="text"
                    placeholder={placeholder}
                    className="w-full bg-slate-900 border border-white/5 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400/40 focus:bg-slate-800 transition-all text-sm font-black uppercase italic text-white placeholder:text-slate-600 shadow-inner"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="order-2 sm:order-1 flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-300 hover:bg-white/5 rounded-2xl transition-all active:scale-95"
                >
                  Cancel Synchronization
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="order-1 sm:order-2 flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black py-4.5 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px]"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Save System Intelligence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </AdminLayout>
  );
}

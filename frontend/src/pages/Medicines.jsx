import { useEffect, useState, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import MedicineCard from '../components/MedicineCard';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const EMPTY = { 
  name: '', 
  category: '', 
  manufacturer: '', 
  batch_number: '', 
  expiry_date: '', 
  purchase_price: '', 
  selling_price: '', 
  stock: '', 
  minimum_stock: '10',
  barcode: '' 
};

export default function Medicines() {
  const { user } = useAuth();
  const canEdit = ['Admin', 'Pharmacist'].includes(user?.role);
  
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 8;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        category,
        manufacturer,
        page,
        limit
      };
      const response = await getMedicines(params);
      setMedicines(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalItems(response.data.total_items);
    } catch (error) {
      console.error("Failed to load medicines:", error);
    } finally {
      setLoading(false);
    }
  }, [search, category, manufacturer, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [load]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (m) => {
    setForm({ 
      ...m, 
      expiry_date: m.expiry_date ? new Date(m.expiry_date).toISOString().split('T')[0] : '',
      minimum_stock: m.minimum_stock || '10'
    });
    setEditId(m.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { 
      ...form, 
      purchase_price: parseFloat(form.purchase_price), 
      selling_price: parseFloat(form.selling_price), 
      stock: parseInt(form.stock),
      minimum_stock: parseInt(form.minimum_stock),
      expiry_date: form.expiry_date === "" ? null : form.expiry_date
    };
    try {
      if (editId) await updateMedicine(editId, payload);
      else await createMedicine(payload);
      setShowModal(false);
      await load();
    } catch (err) { alert(err?.response?.data?.detail || 'Error saving medicine'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine?')) return;
    try {
      await deleteMedicine(id);
      await load();
    } catch (error) {
      alert("Error deleting medicine");
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setManufacturer('');
    setPage(1);
  };

  return (
    <MainLayout title="Medicine Catalog">
        {/* Advanced Toolbar - Responsive Layout */}
        <div className="bg-slate-800/40 p-4 sm:p-6 rounded-2xl border border-white/5 backdrop-blur-sm mb-6 sm:mb-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium" 
                    placeholder="Search by name, category or manufacturer..." 
                    value={search} 
                    onChange={e => { setSearch(e.target.value); setPage(1); }} 
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex-shrink-0">
                    <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Global Items: {totalItems}</span>
                </div>
                
                <div className="flex flex-1 sm:flex-none items-center gap-2">
                    <select 
                        className="flex-1 sm:flex-none bg-slate-900/50 border border-white/10 rounded-xl py-2.5 px-3 sm:px-4 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none min-w-[120px]"
                        value={category}
                        onChange={e => { setCategory(e.target.value); setPage(1); }}
                    >
                        <option value="">All Types</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Injection">Injection</option>
                        <option value="Ointment">Ointment</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Cream">Cream</option>
                        <option value="Inhaler">Inhaler</option>
                        <option value="Drops">Drops</option>
                    </select>
                
                    <button 
                        onClick={clearFilters}
                        className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                        title="Reset Logic"
                    >
                        <Filter size={18} />
                    </button>
                </div>
                
                {canEdit && (
                    <button 
                        id="add-medicine-btn" 
                        onClick={openAdd} 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Plus size={18} /> Add Entry
                    </button>
                )}
            </div>
        </div>
        </div>

        {/* Dynamic Catalog Grid */}
        {loading ? (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
            </div>
        ) : (
            <div className="relative pb-24 sm:pb-32">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {medicines.map(m => (
                    <MedicineCard key={m.id} medicine={m} canEdit={canEdit} onEdit={openEdit} onDelete={handleDelete} />
                ))}
                </div>
                
                {medicines.length === 0 && (
                <div className="text-center py-16 sm:py-20 bg-slate-800/20 rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching medication discovered.</p>
                </div>
                )}

                {/* Pagination Controls - Optimized for Mobile */}
                {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-white/5 gap-4">
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">
                        Showing <span className="text-white font-bold">{medicines.length}</span> entries · Page <span className="text-white font-bold">{page}</span> of {totalPages}
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-white/10 text-white disabled:opacity-30 hover:bg-white/5 transition-all flex items-center justify-center"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="flex-1 sm:flex-none p-2.5 rounded-xl border border-white/10 text-white disabled:opacity-30 hover:bg-white/5 transition-all flex items-center justify-center"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                )}
            </div>
        )}

        {/* Modal - Fully Responsive Frame */}
        {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2rem] border border-white/10 shadow-2xl p-6 sm:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">
                            {editId ? 'Refine Medication' : 'Initialize Medicine'}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Clinical Catalog Entry</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
                    ><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Medicine Name</label>
                            <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">System Category</label>
                            <select 
                                required 
                                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                                value={form.category} 
                                onChange={e => setForm({ ...form, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                <option value="Tablet">Tablet</option>
                                <option value="Syrup">Syrup</option>
                                <option value="Injection">Injection</option>
                                <option value="Ointment">Ointment</option>
                                <option value="Capsule">Capsule</option>
                                <option value="Cream">Cream</option>
                                <option value="Inhaler">Inhaler</option>
                                <option value="Drops">Drops</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Manufacturer</label>
                            <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Batch Identifier</label>
                            <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Bio-Security Expiry</label>
                            <input required type="date" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all appearance-none" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Low Stock Threshold</label>
                            <input required type="number" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-black focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.minimum_stock} onChange={e => setForm({ ...form, minimum_stock: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                        <div>
                            <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Buy ₹</label>
                            <input required type="number" step="0.01" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-black text-center focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sell ₹</label>
                            <input required type="number" step="0.01" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-black text-center focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Qty</label>
                            <input required type="number" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 sm:p-4 text-white font-black text-center focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4 pt-4">
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            {loading ? 'Processing Intelligence...' : editId ? 'Authorize Update' : 'Initialize Asset'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)} 
                            className="px-6 sm:px-10 py-4 rounded-2xl border border-white/10 text-slate-400 font-black uppercase tracking-widest hover:bg-white/5 transition-all text-xs"
                        >Cancel</button>
                    </div>
                </form>
            </div>
            </div>
        )}
    </MainLayout>
  );
}

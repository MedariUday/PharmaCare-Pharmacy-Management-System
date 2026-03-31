import { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Pencil, Trash2, Users, Search, UserCheck } from 'lucide-react';

const EMPTY = { name: '', phone: '' };

export default function Customers() {
  const { user } = useAuth();
  const isAdminOrPharmacist = ['Admin', 'Pharmacist'].includes(user?.role);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getCustomers()
      .then(r => setCustomers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (c) => { setForm(c); setEditId(c.id); setShowModal(true); };
  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      if (editId) await updateCustomer(editId, form);
      else await createCustomer(form);
      setShowModal(false); 
      await load();
    } catch (err) { 
        alert(err?.response?.data?.detail || 'Error saving customer data'); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently remove this customer record?')) return;
    try {
        await deleteCustomer(id); 
        await load();
    } catch (err) {
        alert('Failed to delete customer.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || '').includes(search)
  );

  return (
    <MainLayout title="Customer Directory">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 overflow-x-hidden">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter mb-1">Patient Registry</h1>
                <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                    {customers.length} Protocol-Verified Stakeholders
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative group w-full sm:w-64">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-800/40 border border-white/5 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-xs sm:text-sm font-bold text-white transition-all shadow-inner"
                        placeholder="Search By Name or Contact..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button 
                    onClick={openAdd} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    <Plus size={16} /> Add Register
                </button>
            </div>
        </div>

        <div className="bg-slate-800/20 rounded-[2.5rem] border border-white/5 shadow-2xl relative mb-12">
            <div className="w-full overflow-x-auto custom-scrollbar scrolling-touch">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="bg-white/2 border-b border-white/5">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Stakeholder</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Contact Details</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Administrative Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/2">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={3} className="px-8 py-6"><div className="h-4 bg-white/5 rounded-full w-full"></div></td>
                                </tr>
                            ))
                        ) : filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700">
                                            <Users size={32} />
                                        </div>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No customer records identified</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map(c => (
                                <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform" 
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                                                {c.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">{c.name}</p>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Verified Pharmacy Patient</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 px-3 rounded-full bg-slate-700/50 text-slate-300 text-[10px] font-black font-mono tracking-widest border border-white/5">
                                                {c.phone || 'NO CONTACT'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => openEdit(c)} 
                                                className="w-10 h-10 rounded-xl border border-white/5 bg-white/2 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center active:scale-95"
                                                title="Edit Record"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            {isAdminOrPharmacist && (
                                                <button 
                                                    onClick={() => handleDelete(c.id)} 
                                                    className="w-10 h-10 rounded-xl border border-white/5 bg-white/2 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-500/10 transition-all flex items-center justify-center active:scale-95"
                                                    title="Purge Record"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-2xl p-6 sm:p-10 animate-in zoom-in duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter">
                                {editId ? 'Refine Record' : 'Initialize Stakeholder'}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Personnel Registry</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"><X size={24} /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Stakeholder Name</label>
                            <input required type="text" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Contact Protocol (Phone)</label>
                            <input required type="tel" className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        
                        <div className="flex gap-4 pt-4">
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                            >
                                {loading ? 'Finalizing...' : 'Authorize Save'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowModal(false)} 
                                className="px-6 py-4 rounded-2xl border border-white/10 text-slate-400 font-black uppercase tracking-widest hover:bg-white/5 transition-all text-xs"
                            >Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </MainLayout>
  );
}

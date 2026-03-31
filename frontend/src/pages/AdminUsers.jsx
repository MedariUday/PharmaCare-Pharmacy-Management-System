import React, { useState, useEffect, useCallback } from 'react';
import { adminGetUsers, adminCreateUser, adminUpdateUser, adminResetPassword, adminGeneratePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import {
  Users, User, UserPlus, Mail, Phone,
  Lock, RefreshCw, Power, Search,
  AlertCircle, CheckCircle, Key,
  MoreVertical, ShieldPlus, Loader2, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { FormInput, SelectInput, PasswordInput, SearchInput } from '../components/Input';
import AdminLayout from '../components/AdminLayout';

// ─── Password strength checks ─────────────────────────────────
const pwChecks = [
  { id: 'len',   label: '8 characters',    test: (p) => p.length >= 8 },
  { id: 'upper', label: '1 uppercase',      test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: '1 lowercase',      test: (p) => /[a-z]/.test(p) },
  { id: 'num',   label: '1 number',         test: (p) => /[0-9]/.test(p) },
];

export default function AdminUsers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Admin';
  
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm]           = useState({ name: '', email: '', phone: '', password: '', role: 'Staff' });
  const [formErrors, setFormErrors] = useState({});
  const [tempPass, setTempPass]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState({ text: '', type: '' });
  const [generating, setGenerating] = useState(false);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminGetUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 3)
      errs.name = 'Full name must be at least 3 characters.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Please enter a valid email address.';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\D/g, '')))
      errs.phone = 'Phone must be exactly 10 digits.';
    if (!form.password)
      errs.password = 'Password is required.';
    else if (!pwChecks.every(c => c.test(form.password)))
      errs.password = 'Password must meet all strength requirements below.';
    return errs;
  };

  const handleGeneratePass = async () => {
    setGenerating(true);
    try {
      const res = await adminGeneratePassword();
      setForm(f => ({ ...f, password: res.data.password }));
      setFormErrors(e => ({ ...e, password: '' }));
    } catch {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
      const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
      const num   = '23456789';
      const sym   = '!@#$';
      let p = upper[Math.floor(Math.random()*upper.length)]
            + num[Math.floor(Math.random()*num.length)]
            + sym[Math.floor(Math.random()*sym.length)];
      for (let i = 0; i < 9; i++) p += chars[Math.floor(Math.random()*chars.length)];
      setForm(f => ({ ...f, password: p.split('').sort(() => Math.random()-0.5).join('') }));
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      await adminCreateUser(form);
      showToast('User created successfully!', 'success');
      fetchUsers();
      setForm({ name: '', email: '', phone: '', password: '', role: 'Staff' });
      setShowModal(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const text = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Failed to create user. Please try again.');
      showToast(text, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const newStatus = !user.is_active;
      await adminUpdateUser(user.id, { is_active: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
      showToast(`${user.name} ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
    } catch {
      showToast('Failed to update user status.', 'error');
    }
  };

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Reset password for ${user.name}?`)) return;
    try {
      const res = await adminResetPassword(user.id);
      setTempPass(res.data.temporary_password);
      setSelectedUser(user);
      setModalType('reset');
      setShowModal(true);
    } catch {
      showToast('Failed to reset password.', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="User Identity Management">
      <Toast toast={toast} />
      
      {/* Header & Global Commands */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <ShieldPlus size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Access Control</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Directory & Permissions</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex-1 sm:w-72">
            <label className="block text-[8px] font-black text-slate-600 uppercase tracking-widest pl-2 mb-2">Filter Personnel</label>
            <SearchInput
              placeholder="Find by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              className="bg-slate-900/50 border-white/10 text-white rounded-2xl"
            />
          </div>
          <div className="shrink-0 pt-6 sm:pt-0">
             <button
                onClick={() => { setModalType('create'); setForm({ name: '', email: '', phone: '', password: '', role: 'Staff' }); setShowModal(true); }}
                className="w-full sm:w-auto h-12 flex items-center justify-center gap-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <UserPlus size={18} /> Provision Identity
              </button>
          </div>
        </div>
      </div>

      {/* Users Results */}
      <div className="relative mb-10 pb-32 sm:pb-10">
        {loading ? (
          <div className="bg-slate-800/20 backdrop-blur-xl rounded-[40px] border border-white/5 py-32 text-center shadow-2xl">
            <Loader2 className="animate-spin text-indigo-500 h-12 w-12 mx-auto mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Identity Vault...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-slate-800/20 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white/2 border-b border-white/5 italic">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Profile Identity</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Access Role</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Current Status</th>
                      {canEdit && <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right whitespace-nowrap">Vault Commands</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/20 shadow-inner">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-white tracking-tight text-base uppercase italic">{user.name}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            user.role === 'Admin'      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            user.role === 'Pharmacist' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 shadow-lg shadow-rose-500/20'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${user.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {user.is_active ? 'Active' : 'Deactivated'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-500">
                            <button onClick={() => handleResetPassword(user)} className="p-3 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all active:scale-90" title="Reset Credentials">
                              <Key size={18} />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user)}
                              className={`p-3 rounded-xl transition-all active:scale-90 ${user.is_active ? 'hover:text-rose-400 hover:bg-rose-500/10' : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <Power size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile User Cards */}
            <div className="grid grid-cols-1 gap-6 md:hidden">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 shadow-xl flex flex-col gap-6">
                  {/* Row 1: Identity */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 font-black text-xl border border-indigo-500/20 shadow-inner shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-white text-lg tracking-tight uppercase italic truncate">{user.name}</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Row 2: Status & Role Badges */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Access Protocol</span>
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block ${
                         user.role === 'Admin'      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                         user.role === 'Pharmacist' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                     'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                       }`}>
                         {user.role}
                       </span>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Terminal Status</span>
                       <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {user.is_active ? 'Active' : 'Locked'}
                          </span>
                       </div>
                    </div>
                  </div>

                  {/* Row 3: Commands */}
                  {canEdit && (
                     <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => handleResetPassword(user)} 
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 text-slate-400 rounded-2xl hover:text-indigo-400 transition-all border border-white/5 active:scale-95 text-[10px] font-black uppercase tracking-widest"
                        >
                           <Key size={16} /> Reset Vault
                        </button>
                        <button 
                          onClick={() => toggleUserStatus(user)} 
                          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all border active:scale-95 text-[10px] font-black uppercase tracking-widest ${
                            user.is_active ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          <Power size={16} /> {user.is_active ? 'Revoke' : 'Grant'} Access
                        </button>
                     </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="py-32 bg-slate-800/20 backdrop-blur-xl rounded-[40px] border border-white/5 text-center shadow-2xl">
                <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-slate-600 border border-white/5 mx-auto mb-6 opacity-20">
                   <Users size={36} />
                </div>
                <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mb-1">Identity Not Found</h3>
                <p className="text-slate-500 text-[10px] font-bold lowercase tracking-wider">No matching personnel signatures detected in this vault.</p>
              </div>
            )}
          </>
        )}
      </div>



      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-[#0f172a] rounded-3xl sm:rounded-[40px] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden border border-white/10 mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {modalType === 'create' ? (
              <div className="flex flex-col">
                {/* Modal Header */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
                  <ShieldPlus className="absolute right-6 top-4 opacity-10" size={110} />
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">Provision Identity</h2>
                  <p className="text-indigo-100 text-xs sm:text-sm mt-1 font-medium uppercase tracking-widest">Create a new pharmacy team member account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateUser} className="p-6 sm:p-8 space-y-5">
                  {/* Name + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Full Name"
                      prefix={User}
                      placeholder="Jane Doe"
                      value={form.name}
                      error={formErrors.name}
                      className="bg-slate-900 border-white/5 text-white"
                      onChange={e => { setForm({...form, name: e.target.value}); setFormErrors(er => ({...er, name: ''})); }}
                    />
                    <FormInput
                      label="Phone"
                      prefix={Phone}
                      placeholder="9900001234"
                      value={form.phone}
                      error={formErrors.phone}
                      className="bg-slate-900 border-white/5 text-white"
                      onChange={e => { setForm({...form, phone: e.target.value}); setFormErrors(er => ({...er, phone: ''})); }}
                    />
                  </div>

                  {/* Email */}
                  <FormInput
                    type="email"
                    label="Email"
                    prefix={Mail}
                    placeholder="jane@pharmacy.com"
                    value={form.email}
                    error={formErrors.email}
                    className="bg-slate-900 border-white/5 text-white"
                    onChange={e => { setForm({...form, email: e.target.value}); setFormErrors(er => ({...er, email: ''})); }}
                  />

                  {/* Role */}
                  <SelectInput
                    label="Role"
                    value={form.role}
                    className="bg-slate-900 border-white/5 text-white"
                    onChange={e => setForm({...form, role: e.target.value})}
                    options={[
                      { value: 'Staff', label: 'Staff' },
                      { value: 'Pharmacist', label: 'Pharmacist' }
                    ]}
                  />

                  {/* Password */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-stretch gap-2">
                      <div className="flex-1">
                        <PasswordInput
                          label="Password"
                          prefix={Lock}
                          placeholder="Min 8 chars"
                          value={form.password}
                          error={formErrors.password}
                          className="bg-slate-900 border-white/5 text-white"
                          onChange={e => { setForm({...form, password: e.target.value}); setFormErrors(er => ({...er, password: ''})); }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePass}
                        disabled={generating}
                        className="flex items-center justify-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 sm:py-0 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap disabled:opacity-50 sm:mt-[26px]"
                      >
                        {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Generate
                      </button>
                    </div>

                    {/* Strength hints */}
                    {form.password && (
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 pl-1 bg-white/5 rounded-xl p-3 border border-white/5">
                        {pwChecks.map(c => (
                          <span key={c.id} className={`flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-black transition-colors ${c.test(form.password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {c.test(form.password)
                              ? <CheckCircle size={12} className="text-emerald-400" />
                              : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                            {c.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black py-4 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                    >
                      {submitting ? <><Loader2 size={16} className="animate-spin" /> Provisioning...</> : 'Establish Identity'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Reset Password Modal */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white relative overflow-hidden">
                  <Key className="absolute right-6 top-4 opacity-10" size={110} />
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">Credential Reset</h2>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-1 font-medium uppercase tracking-widest">Temporary password generated</p>
                </div>
                <div className="p-6 sm:p-8 space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20 shadow-inner">
                    <ShieldPlus size={32} />
                  </div>
                  <div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-1">Temporary access key for</p>
                    <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase italic">{selectedUser?.name}</h4>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border-2 border-dashed border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Temporary Key</p>
                    <p className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono tracking-[0.2em] bg-slate-900 py-5 rounded-2xl shadow-inner border border-white/5 select-all">
                      {tempPass}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex items-start gap-3 text-left">
                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-amber-400 text-[10px] font-black uppercase tracking-wide leading-relaxed">
                      Copy this credential immediately. It will not be shown again in the identity vault.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs"
                  >
                    Done — Close Vault
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

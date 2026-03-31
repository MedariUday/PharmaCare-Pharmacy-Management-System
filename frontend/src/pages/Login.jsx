import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, User, ShieldPlus, Stethoscope, Users, ArrowLeft } from 'lucide-react';
import { FormInput, PasswordInput } from '../components/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // 'selection' | 'Admin' | 'Pharmacist' | 'Staff'
  const [selectedRole, setSelectedRole] = useState('selection');
  
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    setForm({ name: '', email: '', password: '' });
  };

  const handleBack = () => {
    setSelectedRole('selection');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await loginUser(form.email, form.password);
      
      if (res.data.role !== selectedRole) {
        setError(`Access Denied! You are registered as a ${res.data.role}, not a ${selectedRole}.`);
        setLoading(false);
        return;
      }

      login(res.data.access_token, res.data.role, res.data.name, res.data.userId);
      
      if (res.data.role === 'Admin') navigate('/admin/dashboard');
      else if (res.data.role === 'Pharmacist') navigate('/pharmacist/dashboard');
      else navigate('/staff/dashboard');
      
    } catch (err) {
      setError(err?.response?.data?.detail || 'Incorrect email or password.');
    } finally { setLoading(false); }
  };

  const themes = {
    Admin: { bg: 'bg-[#1e1b4b]', btn: 'bg-gradient-to-br from-indigo-500 to-violet-600', icon: ShieldPlus, text: 'Administrator' },
    Pharmacist: { bg: 'bg-[#064e3b]', btn: 'bg-gradient-to-br from-emerald-500 to-teal-600', icon: Stethoscope, text: 'Pharmacist' },
    Staff: { bg: 'bg-[#4c1d95]', btn: 'bg-gradient-to-br from-purple-500 to-pink-600', icon: Users, text: 'Staff' },
  };

  if (selectedRole === 'selection') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#020617] p-4 sm:p-8">
        {/* Cinematic Backdrop Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
          <div className="text-center mb-10 sm:mb-16 animate-in fade-in slide-in-from-top duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-[2rem] mb-6 sm:mb-8 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_20px_60px_rgba(99,102,241,0.4)] relative group">
              <Activity size={40} className="text-white group-hover:scale-110 transition-transform sm:size-48" />
              <div className="absolute inset-0 rounded-[2rem] animate-pulse bg-white/20" />
            </div>
            <h1 className="text-3xl sm:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tighter italic uppercase">PharmaCare <span className="text-indigo-500">Terminal</span></h1>
            <p className="text-sm sm:text-xl font-bold text-slate-500 uppercase tracking-[0.3em]">Authorized Access Protocol</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full animate-in fade-in slide-in-from-bottom duration-1000">
            {[
              { id: 'Admin', icon: ShieldPlus, label: 'Administrator', theme: 'border-indigo-500/20 bg-indigo-950/30 text-indigo-400', desc: 'Global Control & Logic' },
              { id: 'Pharmacist', icon: Stethoscope, label: 'Pharmacist', theme: 'border-emerald-500/20 bg-emerald-950/30 text-emerald-400', desc: 'Inventory & Expiry Audit' },
              { id: 'Staff', icon: Users, label: 'Staff', theme: 'border-purple-500/20 bg-purple-950/30 text-purple-400', desc: 'Secure Point of Sale' },
              { id: 'Customer', icon: User, label: 'Customer', theme: 'border-slate-500/20 bg-slate-900/30 text-slate-400', desc: 'View & Manage Your Orders' }
            ].map((role) => (
              <button 
                key={role.id}
                onClick={() => role.id === 'Customer' ? navigate('/customer/login') : handleRoleSelect(role.id)} 
                className={`group flex flex-col items-center justify-center p-8 rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2 border ${role.theme} backdrop-blur-md relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 group-hover:shadow-2xl shadow-lg bg-current/10 border border-current/20`}>
                  <role.icon size={28} />
                </div>
                <h2 className="text-lg font-black text-white mb-1 uppercase tracking-tighter italic">{role.label}</h2>
                <p className="text-[10px] text-center font-black uppercase tracking-widest opacity-60 line-clamp-1">{role.desc}</p>
              </button>
            ))}
          </div>
          
          <p className="mt-12 sm:mt-20 text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 animate-pulse">Bio-Metric Verification Active</p>
        </div>
      </div>
    );
  }

  const currentTheme = themes[selectedRole];
  const IconCmp = currentTheme.icon;

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${currentTheme.bg} p-4`}>
      {/* Background Glow Variant */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-white/5 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <button 
          onClick={handleBack} 
          className="group flex items-center gap-3 text-white/50 mb-8 sm:mb-12 hover:text-white transition-all transform active:scale-95 px-2"
        >
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white transition-colors">
            <ArrowLeft size={16} /> 
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Protocol Reset</span>
        </button>

        <div className="text-center mb-10 group">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[2.2rem] mb-6 ${currentTheme.btn} shadow-2xl ring-4 ring-white/5 group-hover:scale-110 transition-transform duration-500`}>
            <IconCmp size={36} color="white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 italic uppercase tracking-tighter">
            {currentTheme.text} <span className="text-white/40">Portal</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-2">Secure Authentication Terminal</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-3xl p-8 sm:p-10 rounded-[3rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
          <div className="mb-8 border-b border-white/5 pb-6">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Authorize Session</h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Authorized Personnel Synchronization Required</p>
          </div>

          {error && (
            <div className="mb-6 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 duration-300 bg-rose-500/10 border border-rose-500/30 text-rose-400">
               ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <FormInput 
              id="login-email"
              type="email"
              label="Personnel Identifier (Email)"
              required
              prefix={Mail}
              placeholder="id.cadre@pharmacy.gov"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 h-14 rounded-2xl font-bold text-sm shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)] transition-all duration-500
                ${selectedRole === 'Admin' ? 'focus:border-indigo-400 focus:ring-indigo-500/20 focus:bg-white/10' : 
                  selectedRole === 'Pharmacist' ? 'focus:border-emerald-400 focus:ring-emerald-500/20 focus:bg-white/10' : 
                  'focus:border-purple-400 focus:ring-purple-500/20 focus:bg-white/10'}`}
            />
            <PasswordInput
              id="login-password"
              required
              label="Encryption Key (Password)"
              prefix={Lock}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className={`bg-white/5 border-white/10 text-white placeholder:text-white/20 h-14 rounded-2xl font-bold text-sm shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)] transition-all duration-500
                ${selectedRole === 'Admin' ? 'focus:border-indigo-400 focus:ring-indigo-500/20 focus:bg-white/10' : 
                  selectedRole === 'Pharmacist' ? 'focus:border-emerald-400 focus:ring-emerald-500/20 focus:bg-white/10' : 
                  'focus:border-purple-400 focus:ring-purple-500/20 focus:bg-white/10'}`}
            />
            <button 
              type="submit" 
              id="login-submit" 
              disabled={loading} 
              className={`w-full py-5 mt-4 rounded-2xl font-black uppercase italic tracking-[0.2em] text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${currentTheme.btn} ${loading ? 'opacity-50 grayscale' : 'hover:shadow-indigo-500/20'}`}
            >
              {loading ? 'Decrypting...' : `Enter Terminal`}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">
                © 2026 PharmaCare Architecture · Build 2.4.0-Mobile
            </p>
        </div>
      </div>
    </div>
  );
}

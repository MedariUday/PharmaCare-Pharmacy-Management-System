import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginCustomer } from '../services/api';
import { User, Lock, Eye, EyeOff, ArrowLeft, Pill, Loader2, AlertTriangle } from 'lucide-react';
import { FormInput, PasswordInput } from '../components/Input';
import loginBg from '../assets/login_bg.png';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginCustomer(email, password);
      // Ensure the return 'id' is passed as the 4th argument
      login(res.data.access_token, res.data.role, res.data.name, res.data.id);
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Left Side: Modern Illustration/Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src={loginBg} 
          alt="Pharmacy Interior" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col justify-center p-16 text-white">
          <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-white/30">
            <Pill size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Your Health, <br/> Our Priority.
          </h1>
          <p className="text-xl text-blue-50 max-w-md leading-relaxed">
            Access your personalized pharmacy portal to manage prescriptions, view digital invoices, and track your medical history securely.
          </p>
          <div className="mt-12 flex gap-4">
             <div className="h-1 w-12 bg-white rounded-full"></div>
             <div className="h-1 w-4 bg-white/40 rounded-full"></div>
             <div className="h-1 w-4 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
        <div className="absolute top-8 left-8 lg:left-24">
          <Link to="/login" className="flex items-center text-gray-500 hover:text-blue-600 transition-all font-medium gap-2 group">
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Back
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-10">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Customer Login</h2>
            <p className="mt-4 text-gray-500 text-lg">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-sm font-bold animate-pulse flex items-center gap-3">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <FormInput 
                label="Email Address"
                type="email"
                required
                prefix={User}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
              />

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Key (Password)</label>
                  <a href="#" className="text-[10px] text-blue-600 font-black uppercase tracking-widest hover:underline">Recovery?</a>
                </div>
                <PasswordInput
                  required
                  prefix={Lock}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="pt-6 relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-gray-100"></div>
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-4 bg-white text-gray-400">New to PharmaCare?</span>
             </div>
          </div>

          <Link 
            to="/customer/register" 
            className="w-full flex justify-center py-4 px-6 border-2 border-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all"
          >
            Create an Account
          </Link>

          <p className="text-center text-xs text-gray-400 pt-8">
            Manage your health with confidence. <br/> Securely guarded by PharmaCare Encryption.
          </p>
        </div>
      </div>
    </div>
  );
}

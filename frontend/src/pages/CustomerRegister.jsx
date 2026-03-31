import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerCustomer, loginCustomer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, UserPlus, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { FormInput, PasswordInput } from '../components/Input';
import loginBg from '../assets/login_bg.png';

export default function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Register
      await registerCustomer({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      // 2. Auto Login
      const res = await loginCustomer(formData.email, formData.password);
      login(res.data.access_token, res.data.role, res.data.name);
      navigate('/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Left Side: Illustration (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src={loginBg} 
          alt="Pharmacy Decor" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex flex-col justify-center p-16 text-white">
          <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-white/30">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Join Our <br/> Health Community.
          </h1>
          <p className="text-xl text-blue-50 max-w-md leading-relaxed">
            Create an account to unlock easy prescription management, digital invoice tracking, and personalized health insights.
          </p>
          <div className="mt-12 flex gap-4">
             <div className="h-1 w-4 bg-white/40 rounded-full"></div>
             <div className="h-1 w-12 bg-white rounded-full"></div>
             <div className="h-1 w-4 bg-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Register Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-y-auto">
        <div className="absolute top-8 left-8 lg:left-24">
          <Link to="/login" className="flex items-center text-gray-500 hover:text-blue-600 transition-all font-medium gap-2 group">
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Back
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Create Account</h2>
            <p className="mt-3 text-gray-500 text-lg">
              Start your journey to better health management.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-sm font-bold animate-pulse flex items-center gap-3">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              <FormInput 
                label="Full Name"
                name="name"
                required
                prefix={User}
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
              />

              <FormInput 
                label="Email Address"
                name="email"
                type="email"
                required
                prefix={Mail}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
              />

              <FormInput 
                label="Phone Number"
                name="phone"
                required
                prefix={Phone}
                placeholder="+91 00000 00000"
                value={formData.phone}
                onChange={handleChange}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PasswordInput
                  label="Security Key"
                  name="password"
                  required
                  prefix={Lock}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
                />
                <PasswordInput
                  label="Confirm Key"
                  name="confirmPassword"
                  required
                  prefix={Lock}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500/10 h-14 rounded-2xl font-bold text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                'Create Secure Account'
              )}
            </button>
          </form>

          <div className="pt-4 relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-gray-100"></div>
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-4 bg-white text-gray-400 font-medium tracking-tight">Already part of PharmaCare?</span>
             </div>
          </div>

          <Link 
            to="/customer/login" 
            className="w-full flex justify-center py-4 px-6 border-2 border-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-100 transition-all text-sm mb-8"
          >
            Sign In Instead
          </Link>

        </div>
      </div>
    </div>
  );
}

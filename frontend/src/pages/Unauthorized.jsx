import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (!user) navigate('/');
    else if (user.role === 'Admin') navigate('/admin/dashboard');
    else if (user.role === 'Pharmacist') navigate('/pharmacist/dashboard');
    else if (user.role === 'Staff') navigate('/staff/dashboard');
    else if (user.role === 'Customer') navigate('/customer/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-rose-50 text-rose-600 mb-8 border-4 border-rose-100 animate-pulse">
           <ShieldAlert size={48} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight uppercase italic-font-fix">Access Denied</h1>
        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
           Your current security credentials do not grant access to this sector. 
           Please return to your authorized zone.
        </p>

        <div className="flex flex-col gap-3">
           <button 
             onClick={handleReturn}
             className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-3xl font-black transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95 uppercase tracking-widest text-sm"
           >
              <Home size={18} /> Return to Home Vault
           </button>
           
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center justify-center gap-2 text-slate-500 py-4 font-bold border-2 border-slate-200 rounded-3xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
           >
              <ArrowLeft size={16} /> Go Back One Level
           </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
              Security Log entry created.<br />
              Attempt ID: {Math.random().toString(36).substring(7).toUpperCase()}
           </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ toast }) {
  // Support both 'text' and 'message' keys for backwards compatibility across pages
  const message = toast.text || toast.message;
  
  if (!message || (toast.show === false)) return null;
  
  const isSuccess = toast.type === 'success';
  
  return (
    <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm transition-all duration-500 animate-in fade-in slide-in-from-top-4
      ${isSuccess ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-rose-600 text-white shadow-rose-200'}`}>
      {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {message}
    </div>
  );
}

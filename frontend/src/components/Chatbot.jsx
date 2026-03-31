import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Minus, Activity, Bot, User, Sparkles, Headset, 
  Pill, ShoppingCart, ArrowRight, TrendingUp, Users, 
  AlertTriangle, History, Search, ClipboardList, Send,
  FileText, Building2, Phone, MapPin, Package, CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { sendChatQuery } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * ROLE-BASED PHARMACARE AI ASSISTANT
 * Provides tailored UI and logic for Admin, Pharmacist, Staff, and Customers.
 */
export default function Chatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role?.toLowerCase() || 'customer';
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Role-Specific Configuration
  const ROLE_CONFIG = {
    admin: {
      title: 'Admin Intelligence',
      welcome: "Hello Administrator. I can help with revenue reports, user statistics, and inventory alerts. What would you like to analyze?",
      placeholder: 'Ask about revenue, stock, or users...',
      theme: 'from-rose-600 to-pink-700',
      accent: 'rose',
      quickActions: [
        { label: "Today's Revenue", icon: <TrendingUp size={12} />, query: "Show today's revenue" },
        { label: "Active Staff", icon: <Users size={12} />, query: "How many active staff are there?" },
        { label: "Expiry Risk", icon: <AlertTriangle size={12} />, query: "Show expiry alerts" }
      ]
    },
    pharmacist: {
      title: 'Inventory Assistant',
      welcome: "Hello Pharmacist. I'm ready to help with batch details, supplier info, and stock logs. How can I assist with your inventory?",
      placeholder: 'Ask about batches, suppliers, or expiry...',
      theme: 'from-violet-600 to-purple-700',
      accent: 'violet',
      quickActions: [
        { label: "Expiry Alerts", icon: <AlertTriangle size={12} />, query: "Show expiry alerts" },
        { label: "Supplier Info", icon: <Search size={12} />, query: "Who is the supplier for Paracetamol?" },
        { label: "Batch Lookup", icon: <ClipboardList size={12} />, query: "Batch details of Crocin" }
      ]
    },
    staff: {
      title: 'Billing Support',
      welcome: "Hello! I can help you find customers, check stock for billing, or suggest medicine alternatives. What do you need?",
      placeholder: 'Find customer or check availability...',
      theme: 'from-indigo-600 to-blue-700',
      accent: 'indigo',
      quickActions: [
        { label: "Check Stock", icon: <Search size={12} />, query: "Is Dolo 650 available?" },
        { label: "Find Customer", icon: <Users size={12} />, query: "Find customer Rahul" },
        { label: "Active Carts", icon: <ShoppingCart size={12} />, query: "Show active carts" }
      ]
    },
    customer: {
      title: 'Care Assistant',
      welcome: "Hi! I'm here to help you find medicines, check your order history, or view your invoices. How can I help today?",
      placeholder: 'Search medicines or my orders...',
      theme: 'from-emerald-600 to-teal-700',
      accent: 'emerald',
      quickActions: [
        { label: "My Last Order", icon: <History size={12} />, query: "Show my last bill" },
        { label: "Fever Help", icon: <Pill size={12} />, query: "What medicines are available for fever?" },
        { label: "Track Invoices", icon: <ClipboardList size={12} />, query: "Where are my invoices?" }
      ]
    }
  };

  const currentConfig = ROLE_CONFIG[role] || ROLE_CONFIG.customer;

  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      text: currentConfig.welcome, 
      time: new Date() 
    }
  ]);

  useEffect(() => {
    setMessages([{ role: 'bot', text: currentConfig.welcome, time: new Date() }]);
  }, [role, currentConfig.welcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const userMsg = customMsg || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      const res = await sendChatQuery(userMsg);
      const data = res.data;
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.reply || "I'm sorry, I couldn't assist with that under your current access level.", 
        recommendations: data.recommendations || [],
        label: data.label || null,
        type: data.type || 'info',
        data: data.data || null,
        time: new Date() 
      }]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "Access denied or system error. Please check your role permissions.", 
        time: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Shift position based on bottom nav or footer presence
  const positionClass = "bottom-28 sm:bottom-12";

  return (
    <div className={`fixed ${positionClass} right-4 sm:right-8 z-[9999] font-sans flex items-end justify-end pointer-events-none`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`pointer-events-auto relative group flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${currentConfig.theme} text-white rounded-2xl shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-95 border border-white/20`}
        >
          <Bot size={24} className="sm:size-[28px] group-hover:rotate-12 transition-transform duration-300" />
          <span className={`absolute -inset-1 rounded-3xl bg-white/20 animate-ping opacity-30`} />
        </button>
      )}


      {isOpen && (
        <div className="pointer-events-auto fixed sm:relative sm:w-[440px] sm:h-[680px] w-full h-full sm:max-h-[85vh] sm:rounded-[2.5rem] rounded-none bg-white/95 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-white/50 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 ease-out inset-0 sm:inset-auto">
          
          <div className={`relative p-5 sm:p-6 bg-gradient-to-r ${currentConfig.theme} text-white`}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                  <Bot size={22} className="text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg tracking-tight uppercase italic">{currentConfig.title}</h3>
                  <div className="flex items-center gap-1.5 opacity-90 text-[10px] font-black uppercase tracking-widest text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Authorized AI
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><Minus size={18} /></button>
                <button onClick={() => setIsOpen(false)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/10 hover:bg-red-500/40 rounded-xl transition-colors"><X size={18} /></button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gradient-to-b from-slate-50/50 to-white custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group max-w-full`}>
                <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center hidden sm:flex ${
                    m.role === 'user' ? `bg-indigo-600 text-white` : 'bg-white text-slate-600 border border-slate-100 shadow-sm'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <div className={`px-4 py-3 sm:px-5 sm:py-4 rounded-[1.2rem] sm:rounded-[1.5rem] text-[13px] sm:text-[14px] font-medium shadow-sm transition-all break-words ${
                      m.role === 'user' 
                        ? `bg-indigo-600 text-white rounded-tr-none` 
                        : m.type === 'alert' || m.type === 'expiry_alerts'
                          ? m.data && m.data.length === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-tl-none' : 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-none'
                          : m.type === 'analytics'
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-tl-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none ring-1 ring-slate-200/50'
                    }`}>
                      <div className="flex items-start gap-2">
                        {m.role === 'bot' && (m.type === 'alert' || m.type === 'expiry_alerts') && (
                           m.data && m.data.length === 0 ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-rose-500" />
                        )}
                        {m.role === 'bot' && m.type === 'analytics' && <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />}
                        <div className="whitespace-pre-line flex-1 overflow-hidden">{m.text}</div>
                      </div>
                    </div>

                    {/* Recommendations / Results Section - Responsive Optimized */}
                    {m.recommendations && m.recommendations.length > 0 && (
                      <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        {m.label && (
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">
                            {m.label}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-2">
                          {m.recommendations.map((rec, ri) => {
                            const statusColors = {
                              danger: { border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-600', icon: 'text-rose-400' },
                              warn: { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-400' },
                              valid: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-400' },
                              info: { border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', icon: 'text-slate-400' }
                            };
                            const s = statusColors[rec.status] || statusColors.info;

                            return (
                              <div key={ri} className={`bg-white border ${s.border} p-3 sm:p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group/card relative pt-6 sm:pt-7 overflow-hidden`}>
                                <div className={`absolute top-0 left-0 right-0 h-1 ${s.bg}`} />
                                {rec.match_type && (
                                  <div className={`absolute top-2 left-3 text-[7px] sm:text-[8px] font-black uppercase ${s.text} bg-white border ${s.border} px-1.5 py-0.5 rounded-full shadow-sm`}>
                                    {rec.match_type}
                                  </div>
                                )}
                                <div className="flex items-start gap-2 sm:gap-3 mt-1">
                                  <div className={`w-8 h-8 sm:w-9 sm:h-9 ${s.bg} rounded-lg flex-shrink-0 flex items-center justify-center ${s.text} group-hover/card:scale-110 transition-transform`}>
                                    <Pill size={14} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[12px] sm:text-sm font-black text-slate-800 uppercase truncate">{rec.name}</h4>
                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                      <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px]">{rec.category}</p>
                                      <p className="text-[8px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Batch: {rec.batch_number}</p>
                                    </div>
                                    <div className={`mt-2 py-1 px-2 rounded-lg ${s.bg} border ${s.border} inline-flex items-center gap-1.5`}>
                                      <AlertTriangle size={10} className={s.icon} />
                                      <p className={`text-[8px] sm:text-[9px] font-black uppercase ${s.text}`}>
                                        {rec.expiry_date}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-[12px] sm:text-sm font-black text-slate-900">
                                      ₹{Number(rec.price).toLocaleString()}
                                    </p>
                                    <span className={`text-[8px] sm:text-[9px] font-black uppercase ${rec.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {rec.stock > 0 ? `${rec.stock} Qty` : 'NO STOCK'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Result Components (Batch, Supplier, Stock, Bills, Carts, Customers, Analytics) */}
                    {['supplier_lookup', 'batch_lookup', 'stock_lookup', 'bill', 'analytics', 'carts', 'customers'].includes(m.type) && m.data && (
                      <div className="mt-4 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className={`rounded-3xl overflow-hidden shadow-lg border ${m.type === 'batch_lookup' || m.type === 'bill' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-100'}`}>
                          <div className={`
                            ${m.type === 'supplier_lookup' ? 'bg-violet-600' : 
                              m.type === 'batch_lookup' || m.type === 'bill' ? 'bg-indigo-600' : 
                              m.type === 'analytics' ? 'bg-rose-600' :
                              'bg-emerald-600'} px-4 py-3 text-white flex justify-between items-center`}>
                             <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               {m.type === 'supplier_lookup' ? <Building2 size={12} /> : 
                                m.type === 'bill' ? <FileText size={12} /> :
                                m.type === 'analytics' ? <TrendingUp size={12} /> :
                                m.type === 'carts' ? <ShoppingCart size={12} /> :
                                m.type === 'customers' ? <Users size={12} /> :
                                m.type === 'batch_lookup' ? <ClipboardList size={12} /> : <Package size={12} />}
                               {m.type === 'analytics' ? 'Intelligence Report' : 
                                m.type === 'bill' ? 'Digital Invoice' : 
                                m.type === 'carts' ? 'Active Sessions' :
                                m.type === 'customers' ? 'Identity Profiles' : 'Technical Report'}
                             </span>
                          </div>
                          <div className="p-4 sm:p-5">
                             {m.type !== 'carts' && m.type !== 'customers' && (
                               <h4 className={`text-base sm:text-lg font-black uppercase italic tracking-tighter mb-3 ${m.type === 'batch_lookup' || m.type === 'bill' ? 'text-white' : 'text-slate-800'}`}>
                                 {m.data.name || m.data.medicine_name || m.data.id || (m.type === 'analytics' ? 'System Statistics' : '')}
                               </h4>
                             )}
                             <div className="grid grid-cols-1 gap-2">
                               {m.type === 'supplier_lookup' && (
                                 <>
                                   <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center"><User size={14} /></div>
                                      <p className="text-xs font-bold text-slate-700">{m.data.supplier_name}</p>
                                   </div>
                                   <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Phone size={14} /></div>
                                      <p className="text-xs font-black text-slate-700">{m.data.contact}</p>
                                   </div>
                                 </>
                               )}

                               {m.type === 'bill' && (
                                 <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                       <p className="text-[8px] font-bold text-slate-500 uppercase">Amount</p>
                                       <p className="text-sm font-black text-emerald-400">₹{m.data.total?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                       <p className="text-[8px] font-bold text-slate-500 uppercase">Items</p>
                                       <p className="text-sm font-black text-indigo-400">{m.data.item_count} Unit(s)</p>
                                    </div>
                                    <div className="col-span-2 bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                                       <span className="text-[9px] font-black text-white/40 uppercase italic tracking-widest">Auth: {m.data.date}</span>
                                       <ArrowRight size={14} className="text-indigo-400" />
                                    </div>
                                 </div>
                               )}

                               {m.type === 'analytics' && (
                                 <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(m.data).map(([key, val], idx) => (
                                      key !== 'bill_count' && (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase">{key.replace('_', ' ')}</span>
                                          <span className="text-lg font-black text-slate-800 italic tracking-tighter">
                                            {typeof val === 'number' && key.includes('revenue') ? `₹${val.toLocaleString()}` : val}
                                          </span>
                                        </div>
                                      )
                                    ))}
                                 </div>
                               )}

                               {m.type === 'carts' && Array.isArray(m.data) && (
                                  <div className="space-y-2">
                                    {m.data.map((cart, ci) => (
                                      <div key={ci} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center hover:border-emerald-200 transition-colors cursor-pointer group/cart">
                                        <div>
                                          <p className="text-xs font-black text-slate-800 uppercase italic tracking-tighter">{cart.customer_name}</p>
                                          <p className="text-[8px] font-bold text-slate-400 uppercase">ID: {cart.id.slice(-6)}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm font-black text-emerald-600">₹{cart.total?.toLocaleString()}</p>
                                          <ChevronRight size={14} className="ml-auto text-slate-300 group-hover/cart:text-emerald-500 transition-transform group-hover/cart:translate-x-1" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                               )}

                               {m.type === 'customers' && Array.isArray(m.data) && (
                                  <div className="space-y-2">
                                    {m.data.map((cust, ci) => (
                                      <div key={ci} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 hover:border-indigo-200 transition-colors cursor-pointer group/cust">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                                          {cust.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-xs font-black text-slate-800 uppercase italic tracking-tighter">{cust.name}</p>
                                          <p className="text-[8px] font-bold text-slate-400 uppercase">{cust.phone}</p>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover/cust:text-indigo-500 transition-transform group-hover/cust:translate-x-1" />
                                      </div>
                                    ))}
                                  </div>
                               )}

                               {m.type === 'batch_lookup' && (
                                 <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                       <p className="text-[8px] font-bold text-slate-500 uppercase">Batch</p>
                                       <p className="text-xs font-black text-indigo-400">{m.data.batch}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                       <p className="text-[8px] font-bold text-slate-500 uppercase">Stock</p>
                                       <p className="text-xs font-black text-emerald-400">{m.data.stock} units</p>
                                    </div>
                                 </div>
                               )}
                               {m.type === 'stock_lookup' && (
                                 <div className="flex justify-between items-center p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Available Quantity</span>
                                    <span className="text-2xl font-black text-emerald-600 italic tracking-tighter">{m.data.stock}</span>
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className={`text-[9px] font-bold px-1 mt-1 ${m.role === 'user' ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                      {m.role === 'user' ? 'Stakeholder' : currentConfig.title} • {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 sm:p-6 bg-white border-t border-slate-100 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
              {currentConfig.quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(null, action.query)}
                  className={`flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all flex-shrink-0 active:scale-95`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="relative group">
              <input
                type="text"
                placeholder={currentConfig.placeholder}
                className="w-full pl-5 pr-12 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`absolute right-1.5 top-1.5 w-10 h-10 bg-gradient-to-br ${currentConfig.theme} text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale flex-shrink-0 shadow-lg`}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

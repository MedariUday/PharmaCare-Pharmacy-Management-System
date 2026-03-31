import React, { useEffect, useState } from 'react';
import { getCustomerOrders } from '../services/api';
import { ShoppingBag, Calendar, Eye, ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await getCustomerOrders();
        // Sort by date descending
        const sorted = res.data.sort((a,b) => new Date(b.order_date) - new Date(a.order_date));
        setOrders(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.medicines.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="flex min-h-screen bg-[#0f172a] items-center justify-center">
       <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Accessing Secure History...</p>
       </div>
    </div>
  );

  return (
    <MainLayout title="Order History">
        <div className="pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center uppercase italic">
                  <ShoppingBag className="mr-3 text-indigo-500" size={32} /> Purchase Intel
                </h1>
                <p className="text-slate-400 font-medium lowercase tracking-wide mt-1">Review and manage all your past pharmacy transactions.</p>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  type="text"
                  placeholder="Search by Order ID or Medicine..."
                  className="pl-12 pr-6 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all w-full md:w-80 outline-none shadow-sm text-white font-black uppercase italic text-xs placeholder:text-slate-600"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-800/20 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar scrolling-touch">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white/2 border-b border-white/5 italic">
                      <th className="px-8 py-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Order Identifier</th>
                      <th className="px-8 py-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Chronology</th>
                      <th className="px-8 py-6 font-black text-slate-500 uppercase tracking-widest text-[10px]">Deployed Inventory</th>
                      <th className="px-8 py-6 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Net Value</th>
                      <th className="px-8 py-6 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/2">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center">
                           <div className="flex flex-col items-center opacity-30">
                              <div className="bg-white/5 p-4 rounded-full mb-4">
                                <ShoppingBag size={40} className="text-slate-400" />
                              </div>
                              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">No transaction matches detected.</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((order) => (
                        <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                            <span className="font-mono font-black text-white bg-white/5 px-2 py-1 rounded text-xs border border-white/5">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center text-slate-300">
                              <Calendar size={16} className="mr-2 text-slate-500" />
                              <span className="font-black text-sm uppercase italic">{new Date(order.order_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-2 max-w-xs">
                              {order.medicines.map((m, i) => (
                                <span key={i} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                  {m.name} <span className="text-white/50 ml-1">x{m.quantity}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className="text-lg font-black text-white font-mono tracking-tighter italic">₹{order.total_amount.toFixed(2)}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button 
                              onClick={() => navigate(`/customer/bill/${order.bill_mongo_id || order.bill_id || order.id}`)}
                              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-xl shadow-indigo-600/20 italic"
                            >
                              <FileText size={16} /> Inspect Bill
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-8 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      Index <span className="text-white">{indexOfFirstItem + 1}</span> — <span className="text-white">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="text-white">{filteredOrders.length}</span> Records
                   </p>
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 disabled:opacity-10 transition-all text-white"
                      >
                         <ChevronLeft size={20} />
                      </button>
                      
                      <div className="flex gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => paginate(i + 1)}
                            className={`w-10 h-10 rounded-xl font-black transition-all text-xs ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                         onClick={() => paginate(currentPage + 1)}
                         disabled={currentPage === totalPages}
                         className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 disabled:opacity-10 transition-all text-white"
                      >
                         <ChevronRight size={20} />
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </MainLayout>
  );
}

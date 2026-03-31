import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomerOrders, getCustomerBills, getCustomerMedicines } from '../services/api';
import { ShoppingBag, FileText, Pill, Clock, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Recommendations from '../components/Recommendations';

function StatCard({ icon, label, value, color, link }) {
  const content = (
    <div className="bg-slate-800/20 backdrop-blur-xl p-5 sm:p-6 rounded-[2.5rem] border border-white/5 flex items-center space-x-4 h-full hover:shadow-2xl transition-all hover:-translate-y-1 group">
        <div className={`${color} p-4 rounded-2xl flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">{label}</p>
            <p className="text-xl sm:text-2xl font-black text-white truncate italic tracking-tighter">{value}</p>
        </div>
    </div>
  );

  return link ? <Link to={link} className="block group">{content}</Link> : content;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    orders: 0,
    bills: 0,
    medicines: 0,
    totalSpent: 0,
    lastOrderDate: null
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, billsRes, medsRes] = await Promise.all([
          getCustomerOrders(),
          getCustomerBills(),
          getCustomerMedicines()
        ]);
        const totalSpent = billsRes.data.reduce((sum, bill) => sum + bill.total, 0);
        const lastOrderDate = ordersRes.data.length > 0 
          ? ordersRes.data.reduce((latest, current) => 
               (current.order_date && latest.order_date && new Date(current.order_date) > new Date(latest.order_date)) ? current : latest
            ).order_date 
          : null;

        setStats({
          orders: ordersRes.data.length,
          bills: billsRes.data.length,
          medicines: medsRes.data.length,
          totalSpent: totalSpent,
          lastOrderDate: lastOrderDate
        });
        setRecentOrders(ordersRes.data.sort((a,b) => new Date(b.order_date) - new Date(a.order_date)).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen bg-[#0f172a] items-center justify-center">
       <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Accessing Identity Vault...</p>
       </div>
    </div>
  );

  return (
    <MainLayout title="Clinical Intelligence">
        <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tighter">
                AUTHORIZED ACCESS: <span className="text-indigo-400">{user?.name?.split(' ')[0] || 'Patient'}</span>
            </h1>
            <p className="text-slate-400 font-black lowercase tracking-[0.2em] mt-2 opacity-60 italic">CLINICAL IDENTITY VERIFIED — SESSION ACTIVE</p>
        </div>

        <div className="mb-10">
            <Recommendations />
        </div>

        {/* Stats Grid - High Precision Responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 overflow-hidden">
            <StatCard 
              icon={<ShoppingBag className="text-blue-400" size={24} />} 
              label="Transaction Logs" 
              value={stats.orders} 
              color="bg-blue-500/10 border border-blue-500/20" 
              link="/customer/orders"
            />
            <StatCard 
              icon={<Activity className="text-indigo-400" size={24} />} 
              label="Fiscal Dispersion" 
              value={`₹${stats.totalSpent.toLocaleString()}`} 
              color="bg-indigo-500/10 border border-indigo-500/20" 
            />
            <StatCard 
              icon={<Clock className="text-orange-400" size={24} />} 
              label="Last Deployment" 
              value={stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString() : 'N/A'} 
              color="bg-orange-500/10 border border-orange-500/20" 
            />
            
            <StatCard 
              icon={<FileText className="text-emerald-400" size={24} />} 
              label="Verified Invoices" 
              value={stats.bills} 
              color="bg-emerald-500/10 border border-emerald-500/20" 
              link="/customer/orders"
            />
            <StatCard 
              icon={<Pill className="text-purple-400" size={24} />} 
              label="Medicine Diversity" 
              value={stats.medicines} 
              color="bg-purple-500/10 border border-purple-500/20" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-10">
            {/* Recent Orders Card */}
            <div className="bg-slate-800/20 backdrop-blur-3xl p-6 sm:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                
                <div className="flex justify-between items-center mb-8 relative z-10">
                   <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Recent Logic</h2>
                   <Link to="/customer/orders" className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center group/link italic">
                       Full Archive <ArrowRight className="h-4 w-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                   </Link>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {recentOrders.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-[2rem] border border-dashed border-white/5">
                        <ShoppingBag className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Zero purchase history detected.</p>
                    </div>
                ) : (
                    recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-5 bg-white/2 rounded-[2rem] hover:bg-white/5 transition-all border border-white/5 group/order active:scale-[0.98]">
                            <div className="flex items-center space-x-5 min-w-0">
                                <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 text-slate-500 group-hover/order:text-indigo-400 transition-colors">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-white text-base truncate italic uppercase tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</p>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{new Date(order.order_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="font-black text-indigo-400 text-lg font-mono italic tracking-tighter">₹{order.total_amount.toLocaleString()}</p>
                        </div>
                    ))
                )}
                </div>
            </div>

            {/* Premium Info Tip Card */}
            <div className="bg-indigo-600 p-10 rounded-[3rem] shadow-2xl text-white flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 blur-3xl rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-8 border border-white/20 transform -rotate-12 group-hover:rotate-0 transition-transform shadow-xl">
                    <Pill className="size-8 text-white" />
                </div>
                <h2 className="text-3xl font-black mb-6 italic uppercase tracking-tighter flex items-center gap-3">
                   Clinical Protocol
                </h2>
                <p className="text-indigo-100 leading-relaxed text-sm sm:text-base font-black uppercase italic tracking-tight opacity-80 decoration-indigo-400 decoration-wavy">
                    Synchronize with your medical official before deploying new pharmaceutical entities. 
                    Ensure clinical identity parameters are current. 
                    Monitor invoice archives for insurance verification and audit integrity.
                </p>
                <div className="mt-10 pt-10 border-t border-white/10 flex items-center gap-6">
                    <div className="flex flex-col">
                        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-indigo-300 italic mb-1">Entity Status</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            <p className="text-lg font-black uppercase italic tracking-tighter">Verified Identity</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </MainLayout>
  );
}

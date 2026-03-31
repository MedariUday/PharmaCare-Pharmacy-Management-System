import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomerOrders, getCustomerBills, getCustomerMedicines, getCustomerStats } from '../services/api';
import { ShoppingBag, FileText, Pill, Clock, ArrowRight, Activity, Layers, ChevronRight, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Recommendations from '../components/Recommendations';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';

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
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];

  useEffect(() => {
    async function fetchData() {
      // Check for user.userId (matching AuthContext)
      if (!user?.userId) {
        if (user) setLoading(false); // If user exists but no ID, still stop loading
        return;
      }
      
      try {
        const [ordersRes, billsRes, medsRes, statsRes] = await Promise.all([
          getCustomerOrders(),
          getCustomerBills(),
          getCustomerMedicines(),
          getCustomerStats(user.userId)
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
        setDistribution(statsRes.data.category_distribution || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.userId]);

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

            {/* Previous Medicines Category Share Visualization */}
            <div className="bg-slate-800/20 backdrop-blur-3xl p-6 sm:p-10 rounded-[3rem] border border-white/5 relative overflow-hidden group flex flex-col h-full min-h-[500px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform"></div>
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                   <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                      <Layers size={22} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter">Category Share</h2>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Based on your previous purchases</p>
                   </div>
                </div>

                <div className="flex-1 flex flex-col justify-between relative z-10 space-y-8">
                    {distribution.length > 0 ? (
                        <>
                            {/* Chart Area */}
                            <div className="h-[240px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="70%"
                                            outerRadius="95%"
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={12}
                                            animationDuration={1500}
                                        >
                                            {distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                            <Label 
                                                position="center" 
                                                content={({ viewBox: { cx, cy } }) => (
                                                    <g>
                                                        <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px] uppercase tracking-[0.2em] font-black italic">
                                                            Total Units
                                                        </text>
                                                        <text x={cx} y={cy + 18} textAnchor="middle" dominantBaseline="middle" className="fill-white text-2xl font-black tracking-tighter italic">
                                                            {distribution.reduce((acc, curr) => acc + curr.value, 0)}
                                                        </text>
                                                    </g>
                                                )}
                                            />
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                borderRadius: '20px',
                                                padding: '12px',
                                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Clean Responsive Legend */}
                            <div className="space-y-3 mt-4 overflow-y-auto pr-1 max-h-[180px] custom-scrollbar">
                                {distribution.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-xs font-black text-slate-300 uppercase italic tracking-tight">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                                {((item.value / distribution.reduce((a,c) => a+c.value, 0)) * 100).toFixed(1)}%
                                            </span>
                                            <ChevronRight size={14} className="text-slate-600 transition-transform group-hover/item:translate-x-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <PackageSearch size={48} className="text-slate-700 mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] italic">No categorical datasets captured yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </MainLayout>
  );
}

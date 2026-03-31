import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { SalesAreaChart } from '../components/SalesChart';
import RevenueChart from '../components/RevenueChart';
import TopMedicines from '../components/TopMedicines';
import { 
  getMedicines, getSales, getCustomers, getSuppliers,
  getExpiryAlerts, getLowStockAlerts, getDailyReport, getMonthlyReport, getTopMedicines
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Pill, TrendingUp, Users, Truck, AlertTriangle, CalendarClock, ShoppingCart, BarChart3 } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card bg-slate-800/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs mt-1 text-slate-500">{sub}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: color }}>
          <Icon size={24} color="white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [topMeds, setTopMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'Admin';
  const isPharmacist = user?.role === 'Pharmacist';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Common data for both Admin and Pharmacist
        const [medsRes, custRes, expRes, lowRes] = await Promise.all([
          getMedicines({ limit: 100 }),
          getCustomers(),
          getExpiryAlerts(),
          getLowStockAlerts()
        ]);
        
        setMedicines(medsRes.data.data || []);
        setCustomers(custRes.data || []);
        setExpiryAlerts(expRes.data.medicines || []);
        setLowStockAlerts(lowRes.data.medicines || []);

        // Admin-only data
        if (isAdmin) {
          const [dailyRes, monthlyRes, topRes] = await Promise.all([
            getDailyReport(),
            getMonthlyReport(),
            getTopMedicines()
          ]);
          setDailyData(dailyRes.data);
          setMonthlyData(monthlyRes.data);
          setTopMeds(topRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center" style={{ marginLeft: '260px' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: '260px' }}>
        <Navbar title={`${user?.role || 'User'} Dashboard`} />

        <main className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'User'} 👋</h1>
            <p className="text-slate-400 mt-1">Here's what's happening in your pharmacy today.</p>
          </div>

          {/* Alerts Section (Shared for Admin/Pharmacist) */}
          {(expiryAlerts.length > 0 || lowStockAlerts.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {expiryAlerts.length > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <CalendarClock size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{expiryAlerts.length} Medicines Expiring Soon</h4>
                    <p className="text-sm text-yellow-500/80">Check inventory for items expiring within 30 days.</p>
                  </div>
                </div>
              )}
              {lowStockAlerts.length > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{lowStockAlerts.length} Low Stock Alerts</h4>
                    <p className="text-sm text-red-500/80">Some items are below their minimum stock threshold.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdmin && (
            <>
              {/* Admin Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  icon={TrendingUp} 
                  label="Total Revenue" 
                  value={`₹${(monthlyData?.total_sales || 0).toLocaleString()}`} 
                  color="linear-gradient(135deg, #6366f1, #4f46e5)" 
                  sub="This month"
                />
                <StatCard 
                  icon={ShoppingCart} 
                  label="Daily Sales" 
                  value={`₹${(dailyData?.total_sales || 0).toLocaleString()}`} 
                  color="linear-gradient(135deg, #10b981, #059669)" 
                  sub={`${dailyData?.sales_count || 0} orders today`}
                />
                <StatCard 
                  icon={Pill} 
                  label="Medicines" 
                  value={medicines.length} 
                  color="linear-gradient(135deg, #f59e0b, #d97706)" 
                  sub="In inventory"
                />
                <StatCard 
                  icon={Users} 
                  label="Total Customers" 
                  value={customers.length} 
                  color="linear-gradient(135deg, #ec4899, #be185d)" 
                  sub="Registered"
                />
              </div>

              {/* Admin Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <BarChart3 size={20} className="text-indigo-400" /> Daily Sales Trend
                    </h3>
                  </div>
                  <SalesAreaChart data={dailyData?.chart_data || []} />
                </div>
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white mb-6">Revenue Growth</h3>
                  <RevenueChart data={monthlyData?.chart_data || []} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TopMedicines data={topMeds} />
                </div>
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm h-full">
                  <h3 className="text-lg font-bold text-white mb-4">Inventory Quick View</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-400 text-sm">Expired / Near Expiry</span>
                      <span className="text-yellow-500 font-bold">{expiryAlerts.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-slate-400 text-sm">Low Stock Items</span>
                      <span className="text-red-500 font-bold">{lowStockAlerts.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isPharmacist && (
            <>
              {/* Pharmacist Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatCard 
                  icon={Pill} 
                  label="Total Medicines" 
                  value={medicines.length} 
                  color="linear-gradient(135deg, #6366f1, #4f46e5)" 
                />
                <StatCard 
                  icon={CalendarClock} 
                  label="Expiring Soon" 
                  value={expiryAlerts.length} 
                  color="linear-gradient(135deg, #f59e0b, #d97706)" 
                />
                 <StatCard 
                  icon={AlertTriangle} 
                  label="Low Stock Items" 
                  value={lowStockAlerts.length} 
                  color="linear-gradient(135deg, #ef4444, #dc2626)" 
                />
              </div>

              {/* Pharmacist Specific Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 overflow-hidden">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CalendarClock size={20} className="text-yellow-500" /> Expiry Tracker
                  </h3>
                  <div className="space-y-3">
                    {expiryAlerts.length === 0 ? (
                      <p className="text-slate-500 py-4">No medications expiring soon.</p>
                    ) : (
                      expiryAlerts.slice(0, 8).map(med => (
                        <div key={med.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div>
                            <p className="text-white font-medium">{med.name}</p>
                            <p className="text-xs text-slate-500">Exp: {new Date(med.expiry_date).toLocaleDateString()}</p>
                          </div>
                          <span className={`${med.days_left < 7 ? 'text-red-400' : 'text-yellow-400'} text-xs font-bold px-2 py-1 rounded bg-black/20`}>
                            {med.days_left} Days Left
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 overflow-hidden">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" /> Restock Required
                  </h3>
                  <div className="space-y-3">
                    {lowStockAlerts.length === 0 ? (
                      <p className="text-slate-500 py-4">All stock levels are optimal.</p>
                    ) : (
                      lowStockAlerts.slice(0, 8).map(med => (
                        <div key={med.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div>
                            <p className="text-white font-medium">{med.name}</p>
                            <p className="text-xs text-slate-500">Manufacturer: {med.manufacturer}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-400 font-bold">{med.stock}</p>
                            <p className="text-[10px] text-slate-500">Stock Unit</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

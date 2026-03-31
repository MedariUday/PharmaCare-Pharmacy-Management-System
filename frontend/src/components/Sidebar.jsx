import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard, Pill, ShoppingCart, Truck, Users,
  BarChart3, PackageOpen, LogOut, ChevronRight, Activity, FileText,
  ShieldPlus, Receipt, TrendingUp, X
} from 'lucide-react';

const allLinks = [
  { to: '/admin/dashboard',      label: 'Dashboard',      icon: LayoutDashboard, roles: ['Admin'] },
  { to: '/pharmacist/dashboard', label: 'Dashboard',      icon: LayoutDashboard, roles: ['Pharmacist'] },
  { to: '/staff/dashboard',      label: 'Dashboard',      icon: LayoutDashboard, roles: ['Staff'] },
  { to: '/customer/dashboard',   label: 'Portal Home',    icon: LayoutDashboard, roles: ['Customer'] },
  { to: '/customer/medicines',   label: 'Browse Medicines', icon: Pill,            roles: ['Customer'] },
  { to: '/customer/orders',      label: 'My Orders',      icon: ShoppingCart,    roles: ['Customer'] },
  { to: '/customer/bills',       label: 'My Invoices',    icon: FileText,        roles: ['Customer'] },
  { to: '/admin/users',          label: 'User Management',icon: ShieldPlus,      roles: ['Admin'] },
  { to: '/admin/bills',          label: 'All Bills',       icon: Receipt,         roles: ['Admin'] },
  { to: '/medicines',            label: 'Medicines',      icon: Pill,            roles: ['Admin', 'Pharmacist', 'Staff'] },
  { to: '/staff/billing',        label: 'Cart Management',icon: ShoppingCart,    roles: ['Staff'] },
  { to: '/inventory',            label: 'Inventory Management', icon: PackageOpen,roles: ['Admin', 'Pharmacist'] },
  { to: '/admin/inventory-logs', label: 'Inventory Audits', icon: Activity,     roles: ['Admin'] },
  { to: '/pharmacist/inventory-logs',label:'Inventory Audits',icon: Activity,   roles: ['Pharmacist'] },
  { to: '/suppliers',            label: 'Suppliers',      icon: Truck,           roles: ['Admin', 'Pharmacist'] },
  { to: '/customers',            label: 'Customers',      icon: Users,           roles: ['Admin', 'Pharmacist', 'Staff'] },
  { to: '/admin/analytics',        label: 'Clinical Insights',    icon: TrendingUp,     roles: ['Admin'] },
  { to: '/pharmacist/analytics',   label: 'Clinical Insights',    icon: TrendingUp,     roles: ['Pharmacist'] },
  { to: '/admin/predictive-analytics', label: 'Inventory Intelligence', icon: BarChart3, roles: ['Admin'] },
  { to: '/pharmacist/predictive-analytics', label: 'Inventory Intelligence', icon: BarChart3, roles: ['Pharmacist'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();

  const links = allLinks.filter(link => link.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex flex-col h-screen transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{ width: '260px', background: 'rgba(15, 23, 42, 0.98)', borderRight: '1px solid rgba(99,102,241,0.12)' }}>

      {/* Logo & Close Button (Mobile) */}
      <div className="flex items-center justify-between gap-3 px-6 py-6 border-b" style={{ borderColor: 'rgba(99,102,241,0.12)' }}>
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Activity size={20} color="white" />
            </div>
            <div>
            <div className="font-bold text-white text-sm">PharmaCare</div>
            <div className="text-xs" style={{ color: '#6366f1' }}>Management System</div>
            </div>
        </div>
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* User badge */}
      <div className="mx-4 mt-4 mb-2 px-3 py-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</div>
        <div className="text-xs mt-0.5" style={{ color: '#818cf8' }}>{user?.role || 'Staff'}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            onClick={() => { if(window.innerWidth < 1024) closeSidebar(); }}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span className="text-sm">{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300" style={{ color: '#f87171' }}>
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

import React, { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '../components/MainLayout';
import { getCustomers, getSales } from '../services/api';
import { useStaffDashboardSummary } from '../hooks/useStaffDashboardSummary';
import { useAuth } from '../context/AuthContext';
import {
  Users, ShoppingCart, CreditCard, Search, X,
  PlusCircle, FileText, ArrowRight, Wallet,
  TrendingUp, RefreshCw, ChevronLeft, ChevronRight,
  WifiOff, AlertCircle, CheckCircle, Clock, UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CUSTOMERS_PER_PAGE = 8;

// ─── Skeleton card shimmer ────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-200" />
        <div className="w-16 h-5 rounded-full bg-slate-200" />
      </div>
      <div className="h-4 bg-slate-200 rounded-full w-3/4 mb-2" />
      <div className="h-3 bg-slate-200 rounded-full w-1/2 mb-6" />
      <div className="flex justify-between items-center">
        <div className="h-3 bg-slate-200 rounded-full w-1/3" />
        <div className="w-4 h-4 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// ─── Revenue stat tile ────────────────────────────────────────
function RevenueStat({ label, value, loading }) {
  return (
    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
      <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      {loading
        ? <div className="h-6 w-20 bg-white/20 rounded animate-pulse" />
        : <p className="text-white font-black text-xl">{value}</p>}
    </div>
  );
}

// ─── Customer card ────────────────────────────────────────────
function CustomerCard({ cust, onSelect }) {
  const isNew = !cust.total_purchases || cust.total_purchases < 2;
  const chipLabel = isNew ? 'New' : 'Returning';
  const chipCls = isNew
    ? 'bg-sky-50 text-sky-600 border border-sky-100'
    : 'bg-amber-50 text-amber-600 border border-amber-100';
  const initials = cust.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Process cart for ${cust.name}`}
      onClick={() => onSelect(cust)}
      onKeyDown={e => e.key === 'Enter' && onSelect(cust)}
      className="group p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200
        hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-200
        cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        active:scale-[0.98]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tight">
          {initials}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${chipCls}`}>
          {chipLabel}
        </span>
      </div>

      <h4 className="font-black text-slate-800 text-sm leading-tight mb-1 group-hover:text-indigo-700 transition-colors">
        {cust.name}
      </h4>
      <p className="text-xs text-slate-400 font-semibold mb-1">{cust.phone || 'No phone'}</p>
      <p className="text-[10px] text-slate-300 font-bold mb-5">ID: …{cust.id.slice(-5)}</p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600
          bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100
          group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600
          transition-all duration-200">
          Process Cart
        </span>
        <ArrowRight
          size={15}
          className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-200"
        />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ search, onRegister, onClear }) {
  return (
    <div className="col-span-full py-14 text-center flex flex-col items-center gap-4
      border-2 border-dashed border-slate-100 rounded-[2rem] w-full">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
        <Users className="text-slate-200" size={28} />
      </div>
      <div>
        <p className="text-slate-500 font-black text-sm mb-1">
          {search ? `No results for "${search}"` : 'No customers yet'}
        </p>
        <p className="text-slate-300 text-xs font-medium">
          {search ? 'Try a different name or phone number.' : 'Register a customer to start a transaction.'}
        </p>
      </div>
      {search
        ? <button onClick={onClear} className="text-xs font-black text-indigo-600 hover:underline">Clear search</button>
        : <button onClick={onRegister}
            className="mt-2 bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-xl
              text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2">
            <UserPlus size={13} /> Register Customer
          </button>
      }
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────
function ErrorState({ offline, onRetry }) {
  return (
    <div className="col-span-full py-14 text-center flex flex-col items-center gap-4 w-full">
      <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
        {offline ? <WifiOff size={24} className="text-rose-400" /> : <AlertCircle size={24} className="text-rose-400" />}
      </div>
      <div>
        <p className="text-slate-700 font-black text-sm mb-1">
          {offline ? 'No connection' : 'Failed to load customers'}
        </p>
        <p className="text-slate-400 text-xs">
          {offline ? 'Check your network and try again.' : 'The server may be unavailable.'}
        </p>
      </div>
      <button onClick={onRetry}
        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl
          text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}

// ─── Quick tool button ────────────────────────────────────────
function QuickTool({ icon, label, badge, onClick, color = 'indigo' }) {
  const colors = {
    indigo: 'text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    emerald: 'text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    amber:   'text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    rose:    'text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50
        hover:bg-slate-100 transition-all duration-200 gap-2 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1`}
      aria-label={label}
    >
      <div className={`transition-colors duration-200 ${colors[color] || colors.indigo}`}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase text-slate-500 truncate w-full px-1">{label}</span>
      {badge != null && (
        <span className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-black
          w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { summary, loadingSummary, summaryError, lastUpdated, refetch: refetchSummary } = useStaffDashboardSummary();

  const [customers, setCustomers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [offline, setOffline]   = useState(false);

  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage]             = useState(1);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  const lastUpdatedLabel = lastUpdated
    ? `Updated ${Math.floor((Date.now() - lastUpdated.getTime()) / 1000) < 10 ? 'just now' : lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffline(false);
    try {
      const [custRes, salesRes] = await Promise.allSettled([
        getCustomers(),
        getSales(),
      ]);
      if (custRes.status === 'fulfilled')  setCustomers(custRes.value.data || []);
      else if (!navigator.onLine)          setOffline(true);
      else                                 setError(custRes.reason?.message || 'Unknown error');

      if (salesRes.status === 'fulfilled') setRecentSales((salesRes.value.data?.bills || salesRes.value.data || []).slice(0, 5));
    } catch (e) {
      if (!navigator.onLine) setOffline(true);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
    searchRef.current?.focus();
  };

  const filtered = customers.filter(c => {
    const q = debouncedSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / CUSTOMERS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * CUSTOMERS_PER_PAGE, page * CUSTOMERS_PER_PAGE);

  const handleSelectCustomer = (cust) => {
    navigate('/staff/billing', { state: { customerId: cust.id, customerName: cust.name } });
  };

  const shiftRevenue  = summary?.shift_revenue      ?? 0;
  const txnCount      = summary?.transactions_count ?? 0;
  const avgBill       = summary?.avg_bill           ?? 0;
  const activeCarts   = summary?.active_carts       ?? null;
  const todayInvoices = summary?.today_invoices     ?? null;

  return (
    <MainLayout title="Staff Point-of-Sale">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Active Shift
                </h1>
                <p className="text-slate-500 font-medium text-sm mt-1">
                Servicing customers · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
            </div>
            <button
                onClick={() => navigate('/staff/billing')}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-slate-900 text-white
                px-6 py-3.5 rounded-[2rem] font-bold text-sm
                hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20
                transition-all duration-200 active:scale-95 focus:outline-none
                focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                aria-label="Start new transaction"
            >
                <PlusCircle size={18} />
                <span>New Transaction</span>
            </button>
        </div>

        {/* ── Main Responsive grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 overflow-x-hidden">

            {/* ── Customer Dispatch section ── */}
            <section className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-5 sm:p-8 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Customer Dispatch</h3>
                    {!loading && !error && (
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {filtered.length} {filtered.length === 1 ? 'customer' : 'customers'} found
                    </p>
                    )}
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                    <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                    <input
                    ref={searchRef}
                    type="text"
                    placeholder="Name, phone or ID…"
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    aria-label="Search customers"
                    className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-100
                        focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none
                        text-sm font-semibold text-slate-700 placeholder:text-slate-400 transition-all"
                    />
                    {search && (
                    <button
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={13} />
                    </button>
                    )}
                </div>
                </div>

                {/* Customer cards grid - Responsive columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (error || offline) ? (
                    <ErrorState offline={offline} onRetry={fetchData} />
                ) : paginated.length === 0 ? (
                    <EmptyState
                    search={debouncedSearch}
                    onRegister={() => navigate('/customers')}
                    onClear={clearSearch}
                    />
                ) : (
                    paginated.map(cust => (
                    <CustomerCard key={cust.id} cust={cust} onSelect={handleSelectCustomer} />
                    ))
                )}
                </div>

                {/* Pagination - Responsive Layout */}
                {!loading && !error && !offline && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 border-t border-slate-50 gap-4">
                    <span className="text-xs text-slate-400 font-semibold">
                    Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600
                        hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Next page"
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600
                        hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                    </div>
                </div>
                )}
            </section>

            {/* ── Sidebar panels ── Stack below on mobile, 3rd col on desktop */}
            <div className="flex flex-col gap-6">

                {/* Revenue card — responsive sizes */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-6 sm:p-7
                text-white shadow-2xl shadow-indigo-600/30">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                        <Wallet size={22} strokeWidth={1.5} />
                    </div>
                    {loadingSummary && summary && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" title="Refreshing…" />
                    )}
                    </div>
                    <button
                    onClick={refetchSummary}
                    aria-label="Refresh revenue"
                    className="text-[9px] font-black uppercase tracking-widest bg-white/10
                        px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-colors
                        flex items-center gap-1.5"
                    >
                    <RefreshCw size={10} />
                    Refresh
                    </button>
                </div>

                <p className="text-white/60 text-xs font-bold mb-1">Shift Revenue</p>
                {loadingSummary && !summary
                    ? <div className="h-10 w-36 bg-white/20 rounded-2xl animate-pulse mb-5" />
                    : <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-5 transition-all duration-500">
                        ₹{shiftRevenue.toLocaleString('en-IN')}
                        </h2>
                }

                <div className="grid grid-cols-2 gap-3">
                    <RevenueStat label="Transactions" value={txnCount} loading={loadingSummary && !summary} />
                    <RevenueStat label="Avg Bill" value={`₹${Math.round(avgBill).toLocaleString('en-IN')}`} loading={loadingSummary && !summary} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-300" />
                    <span className="text-[10px] font-bold text-white/60">
                        {txnCount} successful txn{txnCount !== 1 ? 's' : ''} today
                    </span>
                    </div>
                    {summaryError && (
                    <span title={summaryError} className="text-[9px] text-amber-300 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> Stale
                    </span>
                    )}
                </div>

                {lastUpdatedLabel && (
                    <p className="mt-3 text-[9px] text-white/30 font-semibold">{lastUpdatedLabel}</p>
                )}
                </div>

                {/* Quick Tools - Responsive Grid */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 pb-4 border-b border-slate-50">
                    Quick Tools
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                    <QuickTool
                    icon={<UserPlus size={20} />}
                    label="Register"
                    color="indigo"
                    onClick={() => navigate('/customers')}
                    />
                    <QuickTool
                    icon={<ShoppingCart size={20} />}
                    label="Active Carts"
                    color="emerald"
                    badge={activeCarts > 0 ? activeCarts : null}
                    onClick={() => navigate('/staff/billing')}
                    />
                    <QuickTool
                    icon={<CreditCard size={20} />}
                    label="Payments"
                    color="amber"
                    onClick={() => navigate('/staff/billing')}
                    />
                    <QuickTool
                    icon={<FileText size={20} />}
                    label="Invoices"
                    color="rose"
                    badge={todayInvoices > 0 ? todayInvoices : null}
                    onClick={() => navigate('/staff/invoices')}
                    />
                </div>
                </div>
            </div>
        </div>

        {/* ── Recent Transactions journal ── Responsive Table and container */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-500" />
                <h3 className="font-black text-slate-800 text-sm tracking-wide uppercase">Recent Transactions</h3>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
                </span>
            </div>

            {loading ? (
                <div className="p-8 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-14 h-4 bg-slate-100 rounded-full" />
                    <div className="flex-1 h-4 bg-slate-100 rounded-full" />
                    <div className="w-16 h-4 bg-slate-100 rounded-full" />
                    <div className="w-16 h-4 bg-slate-100 rounded-full" />
                    </div>
                ))}
                </div>
            ) : recentSales.length === 0 ? (
                <div className="py-14 text-center">
                <Clock size={28} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No transactions yet today</p>
                </div>
            ) : (
                <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px] table-fixed">
                    <thead>
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                        <th className="px-6 sm:px-8 py-4 w-[100px]">Bill ID</th>
                        <th className="px-6 sm:px-8 py-4">Customer</th>
                        <th className="px-6 sm:px-8 py-4 w-[150px]">Amount</th>
                        <th className="px-6 sm:px-8 py-4 w-[150px] text-right">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {recentSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-6 sm:px-8 py-4 text-xs font-black text-slate-400 font-mono">
                            {sale.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 sm:px-8 py-4">
                            <p className="font-bold text-slate-800 text-sm truncate">{sale.customer_name}</p>
                            <p className="text-[10px] text-slate-400">
                            {new Date(sale.date || sale.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </td>
                        <td className="px-6 sm:px-8 py-4 font-black text-slate-900 text-sm">
                            ₹{(sale.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 sm:px-8 py-4 text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                            bg-emerald-50 text-emerald-600 text-[9px] font-black tracking-widest uppercase
                            border border-emerald-100">
                            <CheckCircle size={9} /> Finalized
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </section>
    </MainLayout>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { getInventoryLogs } from '../services/api';
import { SearchInput, SelectInput } from '../components/Input';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, RefreshCw, Eye, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Clock } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

export default function InventoryLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Debounce logic for search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (type) params.type = type;
      if (dateFrom) params.date_from = new Date(dateFrom).toISOString();
      if (dateTo) params.date_to = new Date(dateTo).toISOString();
      
      const res = await getInventoryLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load inventory logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, type, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(true), 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const getBadge = (t) => {
    switch(t) {
      case 'stock_in':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/5">
            <ArrowUpCircle size={12} className="animate-pulse" /> Intake
          </span>
        );
      case 'stock_out':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-rose-500/5">
            <ArrowDownCircle size={12} /> Dispatch
          </span>
        );
      case 'adjustment':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/5">
            <AlertTriangle size={12} /> Override
          </span>
        );
      case 'expired':
        return (
          <span className="px-3 py-1.5 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg shadow-slate-500/5">
            <Clock size={12} /> Expired
          </span>
        );
      default:
        return <span className="px-3 py-1.5 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-black uppercase">{t}</span>;
    }
  };


  return (
    <AdminLayout title="Inventory Audit Logs">
      <div className="space-y-6 pb-24">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">System Audit Trail</h1>
            <p className="text-slate-400 font-medium">Trace all inventory adjustments and automated billing deductions.</p>
          </div>
        </div>
        
        <div className="bg-slate-800/40 p-4 sm:p-6 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">Search Medicine</label>
            <SearchInput 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              onClear={() => { setSearch(''); setPage(1); }}
              placeholder="Product name..." 
              className="bg-slate-900 border-white/10"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">Log Type</label>
            <SelectInput 
              value={type} 
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="bg-slate-900 border-white/10 text-white"
            >
              <option value="">All Types</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="expired">Expired</option>
            </SelectInput>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">From</label>
              <input 
                type="date" 
                className="w-full bg-slate-900 border border-white/10 text-white px-3 sm:px-4 py-3 rounded-2xl shadow-inner focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-black uppercase"
                value={dateFrom} 
                onChange={e => { setDateFrom(e.target.value); setPage(1); }} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-2">To</label>
              <input 
                type="date" 
                className="w-full bg-slate-900 border border-white/10 text-white px-3 sm:px-4 py-3 rounded-2xl shadow-inner focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-black uppercase"
                value={dateTo} 
                onChange={e => { setDateTo(e.target.value); setPage(1); }} 
              />
            </div>
          </div>
          <button 
            onClick={() => fetchLogs()} 
            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors px-6 py-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-full sm:w-auto mt-2 sm:mt-0 active:scale-95 shadow-lg shadow-indigo-500/10"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Logic
          </button>
        </div>

        {/* Results Strategy */}
        <div className="relative">
          {error ? (
            <div className="p-24 text-center text-rose-400 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4 bg-slate-800/20 rounded-[40px] border border-white/5 shadow-2xl">
              <AlertCircle size={40} className="opacity-50" />
              {error} - Protocol Failure
            </div>
          ) : loading && logs.length === 0 ? (
            <div className="p-24 text-center text-slate-500 font-black uppercase tracking-widest text-xs bg-slate-800/20 rounded-[40px] border border-white/5 shadow-2xl">
              <RefreshCw className="animate-spin h-10 w-10 mx-auto mb-4 text-indigo-500 opacity-50" />
              Accessing System Audit Vault...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-24 text-center text-slate-500 font-black uppercase tracking-widest text-xs bg-slate-800/20 rounded-[40px] border border-white/5 shadow-2xl">
              Zero operational events detected.
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block bg-slate-800/20 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/5 overflow-hidden">
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-white/2 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                      <tr className="border-b border-white/5 italic">
                        <th className="px-8 py-6 whitespace-nowrap">Timestamp</th>
                        <th className="px-8 py-6 whitespace-nowrap">Medicine Identity</th>
                        <th className="px-8 py-6 whitespace-nowrap">Log Logic</th>
                        <th className="px-8 py-6 text-center whitespace-nowrap">Prev</th>
                        <th className="px-8 py-6 text-center whitespace-nowrap">Delta</th>
                        <th className="px-8 py-6 text-center whitespace-nowrap">Sync</th>
                        <th className="px-8 py-6 whitespace-nowrap">Personnel</th>
                        <th className="px-8 py-6 text-right whitespace-nowrap">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/2 text-slate-300">
                      {logs.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedLog(row)}>
                          <td className="px-8 py-6 font-black font-mono text-[11px] text-slate-500 uppercase">
                            {new Date(row.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-8 py-6 font-black text-white uppercase italic tracking-tighter text-base">{row.medicine_name || row.medicine_id}</td>
                          <td className="px-8 py-6">{getBadge(row.type)}</td>
                          <td className="px-8 py-6 text-center font-black text-slate-500 font-mono italic">{row.previous_stock ?? '-'}</td>
                          <td className={`px-8 py-6 text-center font-black italic text-lg tracking-tighter ${row.type === 'stock_in' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]'}`}>
                            {row.type === 'stock_in' ? '+' : '-'}{row.quantity}
                          </td>
                          <td className="px-8 py-6 text-center font-black text-indigo-400 font-mono italic">{row.updated_stock ?? '-'}</td>
                          <td className="px-8 py-6 font-black uppercase tracking-widest text-[10px] text-slate-400">{row.performed_by_name || 'System Auto'}</td>
                          <td className="px-8 py-6 text-right">
                            <button className="text-slate-500 group-hover:text-white transition-colors p-2.5 hover:bg-white/5 rounded-xl active:scale-90">
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {logs.map((row) => (
                  <div key={row.id} className="bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 shadow-xl active:scale-[0.98] transition-all" onClick={() => setSelectedLog(row)}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 font-mono uppercase mb-1">
                          {new Date(row.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">{row.medicine_name || row.medicine_id}</h3>
                      </div>
                      <div className={`text-2xl font-black italic tracking-tighter ${row.type === 'stock_in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {row.type === 'stock_in' ? '+' : '-'}{row.quantity}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-5">
                      {getBadge(row.type)}
                      <div className="px-3 py-1 bg-slate-900/50 rounded-lg border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-1">Balance</span>
                        <span className="text-indigo-400 font-black font-mono text-xs">{row.updated_stock ?? '-'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 border border-white/5 font-black text-[10px]">
                          {row.performed_by_name?.charAt(0) || 'S'}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.performed_by_name || 'System Auto'}</span>
                      </div>
                      <button className="p-2.5 bg-white/5 text-slate-400 rounded-xl">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="mt-8 bg-slate-800/20 backdrop-blur-xl rounded-[2.5rem] md:rounded-[40px] px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] text-slate-500 font-black uppercase tracking-widest border border-white/5 shadow-2xl">
              <div className="text-center sm:text-left bg-white/2 px-4 py-2 rounded-full border border-white/5">
                <span className="text-white">{(page - 1) * limit + 1}</span> - <span className="text-white">{Math.min(page * limit, total)}</span> of <span className="text-white">{total}</span> Signals
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)}
                  className="flex-1 sm:flex-none justify-center px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(page + 1)}
                  className="flex-1 sm:flex-none justify-center px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 transition-all flex items-center gap-2 active:scale-95"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedLog(null)}>
          <div className="bg-[#1e293b] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
              <h3 className="font-black text-xl text-white italic uppercase tracking-tighter">Event Details</h3>
              {getBadge(selectedLog.type)}
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Registry Timestamp</span>
                <span className="text-slate-300 font-mono text-xs">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Medicine Identity</span>
                <span className="text-white font-black uppercase italic">{selectedLog.medicine_name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Delta Logic</span>
                <span className={`font-black italic text-lg tracking-tighter ${selectedLog.type === 'stock_in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedLog.type === 'stock_in' ? '+' : '-'}{selectedLog.quantity}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Terminal Balance</span>
                <span className="text-indigo-400 font-black font-mono">{selectedLog.updated_stock ?? 'Unknown'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Personnel Basis</span>
                <span className="text-slate-300 font-black uppercase text-[10px] tracking-widest">{selectedLog.performed_by_name || 'System Auto'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Reason context</span>
                <span className="text-slate-400 font-medium text-xs text-right max-w-[150px] italic">{selectedLog.reason || 'No specific rationale'}</span>
              </div>
              
              {selectedLog.supplier_name && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Vendor Origin</span>
                  <span className="text-white font-black uppercase text-[10px] tracking-widest">{selectedLog.supplier_name}</span>
                </div>
              )}
              {selectedLog.batch_number && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Batch Sequence</span>
                  <span className="text-amber-500 font-mono text-xs font-black">{selectedLog.batch_number}</span>
                </div>
              )}
              {selectedLog.expiry_date && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Safety Expiry</span>
                  <span className="text-rose-500 font-black text-xs uppercase">{new Date(selectedLog.expiry_date).toLocaleDateString()}</span>
                </div>
              )}
              {selectedLog.notes && (
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Field Notes</span>
                  <span className="text-slate-400 font-medium text-[10px] italic text-right max-w-[200px]">{selectedLog.notes}</span>
                </div>
              )}

              {selectedLog.reference_id && (
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Reference ID</span>
                  <span className="text-indigo-400 font-black font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">{selectedLog.reference_id}</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-white/2 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)} 
                className="px-8 py-3 bg-slate-900 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all active:scale-95 shadow-xl"
              >
                Terminate Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

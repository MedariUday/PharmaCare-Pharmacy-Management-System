import { Pill, AlertTriangle, Calendar } from 'lucide-react';
import { formatExpiryDate, isNearingExpiry as checkExpiry, isExpired } from '../utils/formatDate';

export default function MedicineCard({ medicine, onEdit, onDelete, canEdit }) {
  const isLowStock = medicine.stock <= (medicine.minimum_stock || 10);
  const isExpiring = checkExpiry(medicine.expiry_date);
  const hasExpired = isExpired(medicine.expiry_date);

  return (
    <div className="card flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01]"
      style={{ cursor: 'default' }}>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Pill size={18} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{medicine.name}</div>
            <div className="text-xs" style={{ color: '#64748b' }}>{medicine.category}</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {isLowStock && <span className="badge-red">Low Stock</span>}
          {hasExpired && <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest">Expired</span>}
          {isExpiring && <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest">Expiring Soon</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#94a3b8' }}>
        <div><span style={{ color: '#64748b' }}>Stock</span><div className="font-semibold text-white mt-0.5">{medicine.stock} units</div></div>
        <div><span style={{ color: '#64748b' }}>Sell Price</span><div className="font-semibold text-white mt-0.5">₹{medicine.selling_price}</div></div>
        <div><span style={{ color: '#64748b' }}>Batch</span><div className="font-medium mt-0.5">{medicine.batch_number}</div></div>
        <div><span style={{ color: '#64748b' }}>Expires</span>
          <div className="font-medium mt-0.5 flex items-center gap-1">
            {hasExpired && <AlertTriangle size={12} className="text-rose-400" />}
            {isExpiring && <Calendar size={12} className="text-amber-400" />}
            <span style={{ color: hasExpired ? '#fb7185' : isExpiring ? '#fbbf24' : 'inherit' }}>
              {formatExpiryDate(medicine.expiry_date)}
            </span>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
          <button onClick={() => onEdit(medicine)} className="btn-secondary flex-1 text-xs py-2">Edit</button>
          <button onClick={() => onDelete(medicine.id)} className="btn-danger text-xs py-2 px-3">Delete</button>
        </div>
      )}
    </div>
  );
}

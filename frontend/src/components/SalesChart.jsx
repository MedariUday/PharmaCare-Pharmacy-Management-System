import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: ₹{p.value?.toLocaleString('en-IN')}
        </div>
      ))}
    </div>
  );
};

export function SalesAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
        <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12 }} />
        <YAxis 
          stroke="#475569" 
          tick={{ fontSize: 11 }} 
          tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(1)}K` : `₹${v}`} 
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorSales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SalesBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
        <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12 }} />
        <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
        <Bar dataKey="count" name="Sales Count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

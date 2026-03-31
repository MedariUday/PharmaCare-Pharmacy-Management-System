import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Trophy, TrendingUp, Package } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const TopMedicines = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 backdrop-blur-sm h-full flex flex-col items-center justify-center text-center">
        <Package size={48} className="text-slate-700 mb-4" />
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">No sales datasets captured for this cycle.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5 backdrop-blur-sm h-full relative overflow-hidden group">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight uppercase italic">Top Sellers</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inventory Performance Leaderboard</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
          Real-Time Sync
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full relative z-10 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ left: -10, right: 30, top: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="4 4" horizontal={false} vertical={true} stroke="#ffffff05" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={window.innerWidth < 640 ? 80 : 120}
              tick={{ fill: '#94a3b8', fontSize: window.innerWidth < 640 ? 9 : 11, fontWeight: 700 }}
              interval={0}
            />

            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}
              formatter={(value) => [`${value} Units Sold`, "Sales Volume"]}
            />
            <Bar 
              dataKey="total_sold" 
              radius={[0, 10, 10, 0]} 
              barSize={24}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                   key={`cell-${index}`} 
                   fill={COLORS[index % COLORS.length]} 
                   fillOpacity={0.8}
                   className="hover:fill-opacity-100 transition-all duration-300 pointer-events-auto"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <span>Aggregate quantity by product</span>
        <div className="flex items-center gap-1.5 text-indigo-400">
           <TrendingUp size={12} />
           <span>Growth +4%</span>
        </div>
      </div>
    </div>
  );
};

export default TopMedicines;

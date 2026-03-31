import React from 'react';

/**
 * PREMIUM RADIAL GAUGE COMPONENT
 * Visualizes the Inventory Health Score with dynamic coloring and animations.
 */
export default function InventoryHealthGauge({ score = 100, label = "Stock Health" }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  // Dynamic color based on score
  const getColor = (s) => {
    if (s >= 80) return "#10b981"; // Emerald-500
    if (s >= 50) return "#f59e0b"; // Amber-500
    return "#ef4444"; // Red-500
  };

  const currentColor = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4 relative group">
      <svg className="w-48 h-48 transform -rotate-90">
        {/* Track */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-800/30"
        />
        {/* Progress bar */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke={currentColor}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ 
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.5s ease-in-out, stroke 0.5s ease'
          }}
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        />
      </svg>
      
      {/* Centered Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-4xl font-black text-white tracking-tighter animate-in zoom-in-50 duration-700">
          {score}%
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
          {label}
        </span>
      </div>

      {/* Decorative Glow */}
      <div 
        className="absolute inset-x-0 bottom-0 h-24 blur-[60px] opacity-20 transition-all duration-1000 group-hover:opacity-40"
        style={{ backgroundColor: currentColor }}
      />
    </div>
  );
}

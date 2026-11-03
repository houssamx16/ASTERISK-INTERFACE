import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'sky' | 'indigo' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'sky'
}) => {
  const colorStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20 group-hover:border-sky-500/40',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:border-rose-500/40',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40'
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all duration-200 group relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorStyles[color]} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.value}
          </span>
          <span className="text-slate-500">par rapport à hier</span>
        </div>
      )}
    </div>
  );
};


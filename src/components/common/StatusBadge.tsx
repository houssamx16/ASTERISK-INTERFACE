import React from 'react';

interface StatusBadgeProps {
  status: 'registered' | 'offline' | 'unreachable' | 'active' | 'inactive' | 'running' | 'stopped' | 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED' | 'Up' | 'Ring' | 'Dialing';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const displayLabel = label || status;

  switch (status) {
    case 'registered':
    case 'active':
    case 'running':
    case 'ANSWERED':
    case 'Up':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {displayLabel}
        </span>
      );

    case 'offline':
    case 'inactive':
    case 'stopped':
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          {displayLabel}
        </span>
      );

    case 'unreachable':
    case 'NO ANSWER':
    case 'BUSY':
    case 'Ring':
    case 'Dialing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          {displayLabel}
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {displayLabel}
        </span>
      );
  }
};


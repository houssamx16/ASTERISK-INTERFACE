import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck, Cpu, HardDrive, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { systemMetrics, pendingReload, applyAsteriskConfig } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${mins}m`;
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-40">
      {/* Asterisk Status & System Quick Health */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-200">
            Asterisk 20.9 LTS
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
            ONLINE
          </span>
        </div>

        {/* Live Mini Hardware Meters */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>CPU: <span className="text-slate-200 font-mono font-medium">{systemMetrics.cpu.usage_percent}%</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>RAM: <span className="text-slate-200 font-mono font-medium">{systemMetrics.memory.usage_percent}%</span></span>
          </div>
          <div className="text-slate-500">|</div>
          <div>
            Uptime: <span className="text-slate-300 font-mono">{formatUptime(systemMetrics.uptime_seconds)}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Pending reload indicator, User Profile, and Log Out Button */}
      <div className="flex items-center gap-3">
        {pendingReload && (
          <button
            onClick={applyAsteriskConfig}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-sm animate-pulse"
            title="Appliquer les modifications dans Asterisk"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Appliquer Asterisk</span>
          </button>
        )}

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-sky-500/20">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-200">
                {user?.name || 'Admin ASR2'}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-[10px] text-slate-400">{user?.role || 'SUPER_ADMIN'}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-rose-500/15 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-all ml-1"
          title="Se déconnecter de la session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

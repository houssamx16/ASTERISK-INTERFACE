import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PhoneCall,
  GitFork,
  Radio,
  Headphones,
  Sliders,
  Activity,
  FileSpreadsheet,
  Archive,
  Server
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { extensions, activeChannels, queues } = useApp();
  const registeredCount = extensions.filter((e) => e.registration.status === 'registered').length;

  const navItems = [
    {
      to: '/',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/extensions',
      label: 'Utilisateurs & Extensions',
      icon: PhoneCall,
      badge: `${registeredCount}/${extensions.length}`
    },
    {
      to: '/dialplan',
      label: 'Plan de Numérotation',
      icon: GitFork,
      badge: null
    },
    {
      to: '/services',
      label: 'Services Téléphoniques',
      icon: Radio,
      badge: 'Voicemail/Conf'
    },
    {
      to: '/callcenter',
      label: "Centre d'Appel & Queues",
      icon: Headphones,
      badge: `${queues.length}`
    },
    {
      to: '/ivr',
      label: 'Serveur Vocal (IVR)',
      icon: Sliders,
      badge: null
    },
    {
      to: '/monitoring',
      label: 'Supervision en Direct',
      icon: Activity,
      badge: activeChannels.length > 0 ? `${activeChannels.length} actif` : null,
      pulse: activeChannels.length > 0
    },
    {
      to: '/cdr',
      label: 'CDR & Rapports d\'Appels',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      to: '/backup',
      label: 'Sauvegarde & Système',
      icon: Archive,
      badge: null
    }
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white">
          <Server className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
            Asterisk Appliance
          </h1>
          <p className="text-[11px] font-medium text-sky-400 mt-1 uppercase tracking-wider">
            ASR2 • VoIP Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Gestion Téléphonie
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    item.pulse
                      ? 'bg-emerald-500 text-slate-950 animate-pulse font-bold'
                      : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* University Footer Attribution */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>Univ. Kasdi Merbah Ouargla</span>
          <span className="font-mono text-emerald-400">PJSIP v20</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Département Informatique • Master ASR2
        </p>
      </div>
    </aside>
  );
};


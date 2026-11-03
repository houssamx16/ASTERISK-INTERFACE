import React from 'react';
import {
  Activity,
  PhoneCall,
  PhoneOff,
  Server,
  Cpu,
  HardDrive,
  Radio,
  RefreshCw,
  Zap,
  ShieldCheck,
  Power
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const MonitoringPage: React.FC = () => {
  const {
    systemMetrics,
    extensions,
    activeChannels,
    hangupChannel,
    restartService,
    queues
  } = useApp();

  const registeredEndpoints = extensions.filter((e) => e.registration.status === 'registered');
  const offlineEndpoints = extensions.filter((e) => e.registration.status === 'offline');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Supervision & Monitoring en Temps Réel
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Surveillance continue des canaux Asterisk (AMI), des endpoints PJSIP et des ressources système
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Flux AMI Établi (Port 5038)</span>
          </div>
        </div>
      </div>

      {/* Real-time Channels Active Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Canaux de Communication en Direct</h3>
              <p className="text-xs text-slate-400">
                {activeChannels.length} communication(s) établie(s) sur le pont Asterisk
              </p>
            </div>
          </div>
        </div>

        {activeChannels.length === 0 ? (
          <div className="text-center py-10 text-slate-400 border border-dashed border-slate-800 rounded-xl">
            <PhoneOff className="w-7 h-7 mx-auto mb-1 text-slate-400" />
            <p className="text-xs">Aucun canal actif pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChannels.map((channel) => (
              <div
                key={channel.channel_id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-sky-400 font-bold truncate max-w-[180px]">
                      {channel.channel_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                      {channel.codec} • {channel.state}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase">Appelant</p>
                      <p className="font-semibold text-white">{channel.caller_name}</p>
                      <p className="font-mono text-slate-400 text-[11px]">{channel.caller_id}</p>
                    </div>

                    <div className="text-center px-2">
                      <span className="text-slate-400 text-xs">➔</span>
                      <p className="font-mono text-[10px] text-sky-400 font-bold mt-0.5">
                        {Math.floor(channel.duration_seconds / 60)}m {channel.duration_seconds % 60}s
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-400 text-[10px] uppercase">Destinataire</p>
                      <p className="font-semibold text-white">{channel.callee_name}</p>
                      <p className="font-mono text-slate-400 text-[11px]">{channel.connected_to}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Service: {channel.department}</span>
                  <button
                    onClick={() => hangupChannel(channel.channel_id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                  >
                    Interrompre (Hangup)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two columns: Daemons & Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daemons & Services Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-1">Services & Daemons VoIP</h3>
          <p className="text-xs text-slate-400 mb-4">
            Contrôle des processus système sous Linux Ubuntu Server
          </p>

          <div className="space-y-3">
            {[
              { id: 'asterisk', name: 'Asterisk PBX Daemon', desc: 'Moteur de commutation SIP/RTP' },
              { id: 'pjsip', name: 'Pile PJSIP Protocol', desc: 'Gestionnaire de signalisation et ports 5060' },
              { id: 'mariadb', name: 'Base de Données MariaDB', desc: 'Stockage des utilisateurs et CDR' },
              { id: 'web_server', name: 'Serveur Web NGINX / Node', desc: 'Interface de gestion API REST' }
            ].map((srv) => {
              const status = systemMetrics.services[srv.id as keyof typeof systemMetrics.services];
              return (
                <div
                  key={srv.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                    <p className="text-[11px] text-slate-400">{srv.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <button
                      onClick={() => restartService(srv.id as any)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                      title="Redémarrer le daemon"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Endpoints Watcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Supervision Endpoints PJSIP</h3>
                <p className="text-xs text-slate-400">
                  {registeredEndpoints.length} postes connectés • {offlineEndpoints.length} hors-ligne
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {extensions.map((ext) => (
                <div
                  key={ext.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sky-400 font-bold">{ext.extension_number}</span>
                    <span className="text-white font-medium truncate max-w-[120px]">{ext.user_name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400">
                      {ext.registration.status === 'registered' ? ext.registration.ip_address : '---'}
                    </span>
                    <StatusBadge status={ext.registration.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Intervalle de vérification : 5000ms</span>
            <span className="text-emerald-400 font-mono">Qualify: OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};


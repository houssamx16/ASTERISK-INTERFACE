
import React from 'react';
import {
  PhoneCall,
  PhoneOff,
  PhoneForwarded,
  Activity,
  Cpu,
  HardDrive,
  Users,
  Radio,
  Clock
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import { CDRRecord } from '../types';

// Convert the CDR date into a JavaScript Date.
// Supports SQL format: YYYY-MM-DD HH:mm:ss
// Also supports ISO date strings.
const parseCallDate = (callDate: string): Date | null => {
  if (!callDate) return null;

  const normalizedDate = callDate.includes('T')
    ? callDate
    : callDate.replace(' ', 'T');

  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
};

// Format an hour as HH:00.
const formatHour = (hour: number): string =>
  `${String(hour).padStart(2, '0')}:00`;

// Check whether a CDR record belongs to today.
const isToday = (record: CDRRecord, todayKey: string): boolean => {
  const date = parseCallDate(record.call_date);

  if (!date) return false;

  const recordDateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

  return recordDateKey === todayKey;
};

export const DashboardPage: React.FC = () => {
  const {
    systemMetrics,
    extensions,
    activeChannels,
    cdrRecords,
    queues,
    hangupChannel
  } = useApp();

  // Current local date.
  const now = new Date();

  const todayKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-');

  // Extensions statistics.
  const registeredPhones = extensions.filter(
    (e) => e.registration.status === 'registered'
  ).length;

  const offlinePhones = extensions.filter(
    (e) => e.registration.status === 'offline'
  ).length;

  // Only real CDR records from today.
  const todayRecords = cdrRecords.filter(
    (record) => isToday(record, todayKey)
  );

  // Real daily call count.
  const todayCallsCount = todayRecords.length;

  // Real answered calls count.
  const answeredCallsCount = todayRecords.filter(
    (record) => record.disposition === 'ANSWERED'
  ).length;

  // Build hourly call activity from today's CDR records.
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
    hour: formatHour(hour),
    calls: 0,
    answered: 0
  }));

  todayRecords.forEach((record) => {
    const date = parseCallDate(record.call_date);

    if (!date) return;

    const hour = date.getHours();

    hourlyStats[hour].calls += 1;

    if (record.disposition === 'ANSWERED') {
      hourlyStats[hour].answered += 1;
    }
  });

  const callActivityData = hourlyStats;

  // Build department distribution from today's real CDR records.
  const departmentStats = new Map<string, number>();

  todayRecords.forEach((record) => {
    const department = record.department?.trim() || 'Non spécifié';

    departmentStats.set(
      department,
      (departmentStats.get(department) || 0) + 1
    );
  });

  const departmentCallData = Array.from(
    departmentStats,
    ([name, count]) => ({ name, count })
  ).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">

      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Tableau de Bord Téléphonie
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Supervision globale de l'appliance Asterisk PBX • Université Kasdi Merbah Ouargla
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>
              PJSIP Stack:{' '}
              <strong className="text-emerald-400">Actif</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Top Telecom KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <StatCard
          title="Extensions Enregistrées"
          value={`${registeredPhones} / ${extensions.length}`}
          subtitle={`${offlinePhones} téléphones hors-ligne`}
          icon={PhoneCall}
          color="emerald"
          trend={{ value: '+4', isPositive: true }}
        />

        <StatCard
          title="Appels en Cours"
          value={activeChannels.length}
          subtitle="Canaux SIP / PJSIP actifs"
          icon={Activity}
          color="sky"
        />

        <StatCard
          title="Appels du Jour"
          value={todayCallsCount}
          subtitle={`${answeredCallsCount} appels décrochés`}
          icon={PhoneForwarded}
          color="indigo"
        />

        <StatCard
          title="Files & Agents"
          value={`${queues.length} Files`}
          subtitle="Support Hotline & VIP"
          icon={Users}
          color="purple"
        />

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Real Call Volume Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Trafic Téléphonique Aujourd'hui
              </h3>

              <p className="text-xs text-slate-400">
                Évolution horaire basée sur les enregistrements CDR réels
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                Total
              </span>

              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                Décrochés
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {todayRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <Activity className="w-8 h-8 mb-2" />

                <p className="text-sm font-medium">
                  Aucun enregistrement CDR aujourd'hui
                </p>

                <p className="text-xs mt-1">
                  Le graphique apparaîtra après les premières communications enregistrées.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callActivityData}>
                  <defs>
                    <linearGradient
                      id="callGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0ea5e9"
                        stopOpacity={0.4}
                      />

                      <stop
                        offset="95%"
                        stopColor="#0ea5e9"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="answeredGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.4}
                      />

                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="hour"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={2}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Total des appels"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#callGradient)"
                  />

                  <Area
                    type="monotone"
                    dataKey="answered"
                    name="Appels décrochés"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#answeredGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Resources & Hardware Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">

          <div>
            <h3 className="text-base font-bold text-white">
              Ressources Appliance
            </h3>

            <p className="text-xs text-slate-400">
              Charge matérielle et daemons système
            </p>

            <div className="space-y-4 mt-5">

              {/* CPU Gauge */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    Processeur (CPU)
                  </span>

                  <span className="font-mono text-slate-100 font-bold">
                    {systemMetrics.cpu.usage_percent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                    style={{
                      width: `${systemMetrics.cpu.usage_percent}%`
                    }}
                  ></div>
                </div>

                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {systemMetrics.cpu.cores} Cœurs • Temp: {systemMetrics.cpu.temperature_c}°C
                </span>
              </div>

              {/* RAM Gauge */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    Mémoire RAM
                  </span>

                  <span className="font-mono text-slate-100 font-bold">
                    {systemMetrics.memory.usage_percent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${systemMetrics.memory.usage_percent}%`
                    }}
                  ></div>
                </div>

                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {systemMetrics.memory.used_mb} Mo utilisés sur {systemMetrics.memory.total_mb} Mo
                </span>
              </div>

              {/* Disk Gauge */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    Espace Disque (Enreg. & Logs)
                  </span>

                  <span className="font-mono text-slate-100 font-bold">
                    {systemMetrics.disk.usage_percent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${systemMetrics.disk.usage_percent}%`
                    }}
                  ></div>
                </div>

                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {systemMetrics.disk.used_gb} Go sur {systemMetrics.disk.total_gb} Go
                </span>
              </div>

            </div>
          </div>

          {/* Service Daemons Pills */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Asterisk:</span>
              <span className="text-emerald-400 font-semibold">Running</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">MariaDB:</span>
              <span className="text-emerald-400 font-semibold">Running</span>
            </div>

          </div>
        </div>
      </div>

      {/* Live Calls Supervision Table & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Active Calls Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Appels Actifs en Direct
                </h3>

                {activeChannels.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Canaux Asterisk en cours de communication
              </p>
            </div>
          </div>

          {activeChannels.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <PhoneOff className="w-8 h-8 mx-auto text-slate-400 mb-2" />

              <p className="text-sm font-medium">
                Aucun appel actif en ce moment
              </p>

              <p className="text-xs text-slate-400">
                Toutes les lignes sont au repos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Appelant</th>
                    <th className="pb-3 font-semibold">Destinataire</th>
                    <th className="pb-3 font-semibold">Durée</th>
                    <th className="pb-3 font-semibold">Codec</th>
                    <th className="pb-3 font-semibold">Statut</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {activeChannels.map((call) => (
                    <tr
                      key={call.channel_id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 font-medium text-white">
                        <div>{call.caller_name}</div>

                        <span className="text-[10px] font-mono text-slate-400">
                          {call.caller_id}
                        </span>
                      </td>

                      <td className="py-3 text-slate-300">
                        <div>{call.callee_name}</div>

                        <span className="text-[10px] font-mono text-slate-400">
                          {call.connected_to}
                        </span>
                      </td>

                      <td className="py-3 font-mono text-sky-400 font-semibold">
                        {Math.floor(call.duration_seconds / 60)}m{' '}
                        {call.duration_seconds % 60}s
                      </td>

                      <td className="py-3 font-mono text-slate-400 uppercase">
                        {call.codec}
                      </td>

                      <td className="py-3">
                        <StatusBadge status={call.state} />
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => hangupChannel(call.channel_id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                        >
                          Raccrocher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

        {/* Calls by Department */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <h3 className="text-base font-bold text-white">
            Volume par Service
          </h3>

          <p className="text-xs text-slate-400 mb-4">
            Répartition réelle des appels enregistrés aujourd'hui
          </p>

          <div className="h-56 w-full">
            {departmentCallData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs">
                  Aucune donnée CDR disponible aujourd'hui
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentCallData} layout="vertical">

                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={10}
                    hide
                    allowDecimals={false}
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#cbd5e1"
                    fontSize={11}
                    width={95}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />

                  <Bar
                    dataKey="count"
                    name="Nombre d'appels"
                    fill="#38bdf8"
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                  />

                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

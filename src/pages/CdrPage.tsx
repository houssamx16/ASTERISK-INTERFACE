import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  Filter,
  Play,
  Volume2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CDRRecord, CDRDisposition } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

export const CdrPage: React.FC = () => {
  const { cdrRecords } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [playingRecord, setPlayingRecord] = useState<CDRRecord | null>(null);

  // Filter CDRs
  const filteredRecords = cdrRecords.filter((rec) => {
    const matchesSearch =
      rec.caller_id.includes(searchQuery) ||
      rec.source.includes(searchQuery) ||
      rec.destination.includes(searchQuery);
    const matchesDisp =
      selectedDisposition === 'all' || rec.disposition === selectedDisposition;
    const matchesDept = selectedDept === 'all' || rec.department === selectedDept;

    return matchesSearch && matchesDisp && matchesDept;
  });

  // Calculate quick metrics
  const totalCalls = filteredRecords.length;
  const answeredCalls = filteredRecords.filter((r) => r.disposition === 'ANSWERED').length;
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;
  const totalSeconds = filteredRecords.reduce((acc, r) => acc + r.billable_seconds, 0);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = ['ID', 'Date_Heure', 'Appelant', 'Destinataire', 'Service', 'Duree_Sec', 'Facture_Sec', 'Statut'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.call_date,
      `"${r.caller_id}"`,
      `"${r.destination}"`,
      `"${r.department}"`,
      r.duration,
      r.billable_seconds,
      r.disposition
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `asterisk_cdr_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Journaux d'Appels & Statistiques (CDR)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Call Detail Records extraits de la table Asterisk cdr_adaptive_odbc • Analyse du trafic
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Appels Filtrés
          </span>
          <h4 className="text-2xl font-bold text-white mt-1">{totalCalls}</h4>
          <span className="text-[10px] text-slate-500">Lignes enregistrées</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Taux de Réponse
          </span>
          <h4 className="text-2xl font-bold text-emerald-400 mt-1">{answerRate}%</h4>
          <span className="text-[10px] text-slate-500">{answeredCalls} appels aboutis</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Durée Cumulée
          </span>
          <h4 className="text-2xl font-bold text-sky-400 mt-1">
            {Math.floor(totalSeconds / 60)} min
          </h4>
          <span className="text-[10px] text-slate-500">Temps de conversation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Durée Moyenne / Appel
          </span>
          <h4 className="text-2xl font-bold text-indigo-400 mt-1">
            {answeredCalls > 0 ? Math.round(totalSeconds / answeredCalls) : 0}s
          </h4>
          <span className="text-[10px] text-slate-500">Moyenne décrochés</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par appelant, destinataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Disposition */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDisposition}
              onChange={(e) => setSelectedDisposition(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="ANSWERED">Décroché (ANSWERED)</option>
              <option value="NO ANSWER">Non-répondu (NO ANSWER)</option>
              <option value="BUSY">Occupé (BUSY)</option>
              <option value="FAILED">Échoué (FAILED)</option>
            </select>
          </div>

          {/* Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Tous les services</option>
            <option value="Administration">Administration</option>
            <option value="Finance">Finance</option>
            <option value="IT">IT Support</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Management">Management</option>
            <option value="IVR / Menu">Serveur Vocal (IVR)</option>
          </select>
        </div>
      </div>

      {/* CDR Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5 font-semibold">Date & Heure</th>
                <th className="py-3.5 px-5 font-semibold">Numéro Appelant (Src)</th>
                <th className="py-3.5 px-5 font-semibold">Numéro Appelé (Dst)</th>
                <th className="py-3.5 px-5 font-semibold">Département</th>
                <th className="py-3.5 px-5 font-semibold">Durée Totale</th>
                <th className="py-3.5 px-5 font-semibold">Durée Facturable</th>
                <th className="py-3.5 px-5 font-semibold">Statut CDR</th>
                <th className="py-3.5 px-5 font-semibold text-right">Enregistrement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-300">{rec.call_date}</td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-bold text-sky-400">{rec.caller_id}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-bold text-white">{rec.destination}</span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">{rec.department}</td>
                  <td className="py-3.5 px-5 font-mono text-slate-300">{rec.duration}s</td>
                  <td className="py-3.5 px-5 font-mono text-emerald-400 font-semibold">
                    {rec.billable_seconds}s
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={rec.disposition} />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {rec.recording_url ? (
                      <button
                        onClick={() => setPlayingRecord(rec)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Écouter</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Non enregistré</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audio Playback Modal Simulator */}
      <Modal
        isOpen={!!playingRecord}
        onClose={() => setPlayingRecord(null)}
        title="Lecteur d'Enregistrement d'Appel"
        subtitle={playingRecord ? `Appel ID #${playingRecord.id} • ${playingRecord.call_date}` : ''}
      >
        {playingRecord && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Appelant:</span>
                <span className="font-mono text-white font-bold">{playingRecord.caller_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destinataire:</span>
                <span className="font-mono text-white font-bold">{playingRecord.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Durée enregistrée:</span>
                <span className="font-mono text-sky-400">{playingRecord.billable_seconds} secondes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fichier Asterisk:</span>
                <span className="font-mono text-slate-300">/var/spool/asterisk/monitor/call-{playingRecord.id}.wav</span>
              </div>
            </div>

            {/* Simulated audio waveform visualizer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20">
                <Play className="w-4 h-4 ml-0.5" />
              </button>
              <div className="flex-1 space-y-1">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 w-1/3"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>00:45</span>
                  <span>02:52</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPlayingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


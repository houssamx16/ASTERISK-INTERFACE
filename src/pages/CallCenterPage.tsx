import React, { useState } from 'react';
import {
  Headphones,
  Users,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  AlertCircle,
  HelpCircle,
  UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CallQueue } from '../types';
import { Modal } from '../components/common/Modal';

export const CallCenterPage: React.FC = () => {
  const {
    queues,
    addQueue,
    deleteQueue,
    addAgentToQueue,
    removeAgentFromQueue,
    extensions
  } = useApp();

  const [selectedQueueId, setSelectedQueueId] = useState<string>(queues[0]?.id || '');
  const selectedQueue = queues.find((q) => q.id === selectedQueueId) || queues[0];

  // Modal new Queue
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueForm, setQueueForm] = useState<{
    queue_name: string;
    display_name: string;
    strategy: CallQueue['strategy'];
    timeout_seconds: number;
    max_callers: number;
    announce_holdtime: boolean;
    music_on_hold: string;
    agents: CallQueue['agents'];
  }>({
    queue_name: '',
    display_name: '',
    strategy: 'rrmemory',
    timeout_seconds: 30,
    max_callers: 10,
    announce_holdtime: true,
    music_on_hold: 'default',
    agents: []
  });

  // Modal assign agent
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    extension_number: extensions[0]?.extension_number || '401',
    penalty: 1
  });

  const handleCreateQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueForm.queue_name || !queueForm.display_name) return;
    addQueue(queueForm);
    setIsQueueModalOpen(false);
  };

  const handleAssignAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueue) return;
    addAgentToQueue(selectedQueue.id, agentForm.extension_number, Number(agentForm.penalty));
    setIsAgentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Centre d'Appel & Files d'Attente (Call Center ACD)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Distribution automatique des appels (queues.conf), gestion des agents, pénalités et statistiques
          </p>
        </div>
        <button
          onClick={() => setIsQueueModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une File d'Attente</span>
        </button>
      </div>

      {/* Main Grid: Queue Selector & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Queues */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Files d'Attente Actives ({queues.length})
          </h3>
          <div className="space-y-2">
            {queues.map((q) => {
              const isSelected = selectedQueue?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQueueId(q.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{q.display_name}</h4>
                      <span className="text-[11px] font-mono text-sky-400">queues.conf [{q.queue_name}]</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {q.strategy}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" /> {q.agents.length} agent(s)
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <PhoneCall className="w-3.5 h-3.5" /> {q.calls_completed_today} servis
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns (2 cols): Selected Queue Performance & Agent Roster */}
        {selectedQueue && (
          <div className="lg:col-span-2 space-y-6">
            {/* Queue KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  En Attente Directe
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-2xl font-bold text-sky-400">{selectedQueue.active_callers}</h4>
                  <Clock className="w-5 h-5 text-sky-400/40" />
                </div>
                <span className="text-[10px] text-slate-500">Capacité max: {selectedQueue.max_callers}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Appels Traités
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-2xl font-bold text-emerald-400">
                    {selectedQueue.calls_completed_today}
                  </h4>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400/40" />
                </div>
                <span className="text-[10px] text-slate-500">Aujourd'hui</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Appels Abandonnés
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-2xl font-bold text-rose-400">
                    {selectedQueue.calls_abandoned_today}
                  </h4>
                  <AlertCircle className="w-5 h-5 text-rose-400/40" />
                </div>
                <span className="text-[10px] text-slate-500">Taux perte: 3.1%</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Attente Moyenne
                </span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-2xl font-bold text-indigo-400">
                    {selectedQueue.avg_wait_seconds}s
                  </h4>
                  <Clock className="w-5 h-5 text-indigo-400/40" />
                </div>
                <span className="text-[10px] text-slate-500">Temps avant prise</span>
              </div>
            </div>

            {/* Queue Configuration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Paramètres de Distribution</h3>
                  <p className="text-xs text-slate-400">Politiques ACD appliquées par le moteur Asterisk</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Confirmez-vous la suppression de la file ${selectedQueue.queue_name} ?`)) {
                      deleteQueue(selectedQueue.id);
                    }
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Supprimer la file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Stratégie (Strategy)</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedQueue.strategy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Sonnerie / Agent</span>
                  <span className="font-mono text-white font-bold">{selectedQueue.timeout_seconds}s</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Annonce temps attente</span>
                  <span className="text-emerald-400 font-semibold">
                    {selectedQueue.announce_holdtime ? 'Oui (Actif)' : 'Non'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Musique d'Attente</span>
                  <span className="text-slate-300 font-medium">{selectedQueue.music_on_hold}</span>
                </div>
              </div>
            </div>

            {/* Agent Roster Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Agents Assignés à la File</h3>
                  <p className="text-xs text-slate-400">Membres statiques et dynamiques avec ordre de pénalité</p>
                </div>
                <button
                  onClick={() => setIsAgentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assigner un Agent</span>
                </button>
              </div>

              {selectedQueue.agents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  <Users className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                  <p className="text-xs">Aucun agent assigné dans cette file d'attente</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
                  {selectedQueue.agents.map((agent) => (
                    <div
                      key={agent.extension_number}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-950/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
                          {agent.extension_number}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{agent.agent_name}</h4>
                          <span className="text-[10px] text-slate-400">
                            Pénalité: <strong className="text-indigo-400">{agent.penalty}</strong> • Traités: {agent.calls_taken} appels
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            agent.state === 'available'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : agent.state === 'on_call'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {agent.state === 'available' ? 'Disponible' : agent.state === 'on_call' ? 'En Ligne' : 'Pause'}
                        </span>
                        <button
                          onClick={() => removeAgentFromQueue(selectedQueue.id, agent.extension_number)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Retirer de la file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal New Queue */}
      <Modal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        title="Créer une File d'Attente ACD (Queue)"
        subtitle="Configuration de la politique de distribution des appels entrants"
      >
        <form onSubmit={handleCreateQueue} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Identifiant Technique (Asterisk) *
              </label>
              <input
                type="text"
                placeholder="Ex: support_fr"
                value={queueForm.queue_name}
                onChange={(e) => setQueueForm({ ...queueForm, queue_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom d'Affichage Convivial *
              </label>
              <input
                type="text"
                placeholder="Ex: Support Client Niveau 1"
                value={queueForm.display_name}
                onChange={(e) => setQueueForm({ ...queueForm, display_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stratégie de Sonnerie (Strategy)
              </label>
              <select
                value={queueForm.strategy}
                onChange={(e) => setQueueForm({ ...queueForm, strategy: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="ringall">ringall (Faire sonner tous les agents)</option>
                <option value="leastrecent">leastrecent (Agent inactif depuis le plus longtemps)</option>
                <option value="fewestcalls">fewestcalls (Agent ayant pris le moins d'appels)</option>
                <option value="random">random (Distribution aléatoire)</option>
                <option value="rrmemory">rrmemory (Round Robin avec mémoire)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Timeout Sonnerie / Agent (sec)
              </label>
              <input
                type="number"
                value={queueForm.timeout_seconds}
                onChange={(e) => setQueueForm({ ...queueForm, timeout_seconds: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre Max d'Appelants en Attente
              </label>
              <input
                type="number"
                value={queueForm.max_callers}
                onChange={(e) => setQueueForm({ ...queueForm, max_callers: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Musique d'Attente (MOH Class)
              </label>
              <input
                type="text"
                value={queueForm.music_on_hold}
                onChange={(e) => setQueueForm({ ...queueForm, music_on_hold: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={queueForm.announce_holdtime}
              onChange={(e) => setQueueForm({ ...queueForm, announce_holdtime: e.target.checked })}
              className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
            />
            <span>Annoncer le temps d'attente estimé à l'appelant</span>
          </label>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsQueueModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Créer la File
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Assign Agent */}
      <Modal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        title="Assigner un Agent à la File"
        subtitle={`File d'attente : ${selectedQueue?.display_name}`}
      >
        <form onSubmit={handleAssignAgent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sélectionner le Poste / Agent *
            </label>
            <select
              value={agentForm.extension_number}
              onChange={(e) => setAgentForm({ ...agentForm, extension_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {extensions.map((ext) => (
                <option key={ext.id} value={ext.extension_number}>
                  Ext {ext.extension_number} — {ext.user_name} ({ext.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Niveau de Pénalité (Priorité d'appel)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={agentForm.penalty}
              onChange={(e) => setAgentForm({ ...agentForm, penalty: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              0 = priorité maximale (sonne en premier), 1-10 = appel si les agents prioritaires sont occupés.
            </span>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAgentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Assigner l'Agent
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


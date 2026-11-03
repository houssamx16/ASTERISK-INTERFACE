import React, { useState } from 'react';
import {
  Sliders,
  Phone,
  Plus,
  Trash2,
  Volume2,
  ArrowRight,
  Sparkles,
  Layers,
  Settings,
  HelpCircle,
  Hash
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IVRMenu, IVREntry } from '../types';
import { Modal } from '../components/common/Modal';

export const IvrPage: React.FC = () => {
  const { ivrMenus, saveIVRMenu, deleteIVRMenu, queues, extensions, conferences } = useApp();

  const [selectedIvrId, setSelectedIvrId] = useState<string>(ivrMenus[0]?.id || '');
  const activeMenu = ivrMenus.find((m) => m.id === selectedIvrId) || ivrMenus[0];

  // Modal new IVR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<IVRMenu | null>(null);

  // Modal new DTMF entry
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState<IVREntry>({
    digit: '1',
    description: '',
    destination_type: 'extension',
    destination_value: '101'
  });

  const availableDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'];

  const openCreateModal = () => {
    setEditingMenu({
      id: `ivr-${Date.now()}`,
      name: 'Nouveau Menu Vocal',
      extension: '701',
      greeting_audio: 'welcome.wav',
      timeout_seconds: 10,
      max_retries: 3,
      invalid_destination: { type: 'extension', value: '100' },
      timeout_destination: { type: 'extension', value: '100' },
      entries: [
        { digit: '1', description: 'Administration', destination_type: 'extension', destination_value: '101' },
        { digit: '2', description: 'Finance', destination_type: 'extension', destination_value: '201' },
        { digit: '3', description: 'Support Client', destination_type: 'queue', destination_value: 'support_fr' }
      ]
    });
    setIsModalOpen(true);
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;
    saveIVRMenu(editingMenu);
    setSelectedIvrId(editingMenu.id);
    setIsModalOpen(false);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenu) return;

    // Replace if digit already exists, else append
    const existingIndex = activeMenu.entries.findIndex((ent) => ent.digit === entryForm.digit);
    let updatedEntries = [...activeMenu.entries];
    if (existingIndex >= 0) {
      updatedEntries[existingIndex] = entryForm;
    } else {
      updatedEntries.push(entryForm);
    }

    saveIVRMenu({
      ...activeMenu,
      entries: updatedEntries
    });
    setIsEntryModalOpen(false);
  };

  const handleDeleteEntry = (digit: string) => {
    if (!activeMenu) return;
    saveIVRMenu({
      ...activeMenu,
      entries: activeMenu.entries.filter((ent) => ent.digit !== digit)
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Serveur Vocal Interactif (IVR / SVI)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Création d'arbres de routage vocal interactif par touches DTMF (1→Admin, 2→Finance, 3→Support...)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Menu IVR</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: IVR List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Menus Vocaux Déployés ({ivrMenus.length})
          </h3>
          <div className="space-y-2">
            {ivrMenus.map((ivr) => {
              const isSelected = activeMenu?.id === ivr.id;
              return (
                <div
                  key={ivr.id}
                  onClick={() => setSelectedIvrId(ivr.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{ivr.name}</h4>
                      <span className="text-[11px] font-mono text-sky-400 font-bold">
                        Extension appel direct : {ivr.extension}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {ivr.entries.length} touches
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 truncate">
                    Fichier accueil : {ivr.greeting_audio}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active IVR DTMF Visualizer & Routes */}
        {activeMenu && (
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Visual DTMF Dialpad */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{activeMenu.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                      Ext {activeMenu.extension}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Annonce d'accueil: <strong className="text-white">{activeMenu.greeting_audio}</strong> • Timeout: {activeMenu.timeout_seconds}s
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEntryForm({
                      digit: '1',
                      description: '',
                      destination_type: 'extension',
                      destination_value: '101'
                    });
                    setIsEntryModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assigner une Touche</span>
                </button>
              </div>

              {/* Keypad Visual Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                {availableDigits.map((digit) => {
                  const entry = activeMenu.entries.find((e) => e.digit === digit);
                  return (
                    <div
                      key={digit}
                      onClick={() => {
                        setEntryForm({
                          digit,
                          description: entry ? entry.description : '',
                          destination_type: entry ? entry.destination_type : 'extension',
                          destination_value: entry ? entry.destination_value : '101'
                        });
                        setIsEntryModalOpen(true);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        entry
                          ? 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/60'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-sm text-sky-400">
                          {digit}
                        </span>
                        {entry && (
                          <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                            {entry.destination_type}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-white truncate">
                          {entry ? entry.description : 'Non assignée'}
                        </p>
                        {entry && (
                          <p className="text-[10px] text-slate-400 font-mono">→ {entry.destination_value}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Configured Routes Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-1">Règles de Redirection DTMF Actives</h3>
              <p className="text-xs text-slate-400 mb-4">
                Actions déclenchées lorsqu'un appelant appuie sur une touche
              </p>

              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
                {activeMenu.entries.map((entry) => (
                  <div
                    key={entry.digit}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-mono font-bold text-sm">
                        {entry.digit}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{entry.description}</h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>Redirige vers</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono">
                            {entry.destination_type}: {entry.destination_value}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEntry(entry.digit)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer la touche"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit DTMF Key */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title={`Configurer la Touche DTMF [${entryForm.digit}]`}
        subtitle={`Menu : ${activeMenu?.name}`}
      >
        <form onSubmit={handleAddEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Touche du Clavier</label>
              <select
                value={entryForm.digit}
                onChange={(e) => setEntryForm({ ...entryForm, digit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                {availableDigits.map((d) => (
                  <option key={d} value={d}>
                    Touche {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Type de Destination</label>
              <select
                value={entryForm.destination_type}
                onChange={(e) => setEntryForm({ ...entryForm, destination_type: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="extension">Extension / Poste Direct</option>
                <option value="queue">File d'Attente (Call Queue)</option>
                <option value="conference">Salle de Conférence</option>
                <option value="voicemail">Messagerie Vocale</option>
                <option value="hangup">Raccrocher (Fin d'appel)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description de la Touche *
            </label>
            <input
              type="text"
              placeholder="Ex: Service Comptabilité & Finance"
              value={entryForm.description}
              onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valeur Cible (Target)</label>
            {entryForm.destination_type === 'extension' && (
              <select
                value={entryForm.destination_value}
                onChange={(e) => setEntryForm({ ...entryForm, destination_value: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                {extensions.map((ext) => (
                  <option key={ext.id} value={ext.extension_number}>
                    Poste {ext.extension_number} — {ext.user_name} ({ext.department})
                  </option>
                ))}
              </select>
            )}

            {entryForm.destination_type === 'queue' && (
              <select
                value={entryForm.destination_value}
                onChange={(e) => setEntryForm({ ...entryForm, destination_value: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                {queues.map((q) => (
                  <option key={q.id} value={q.queue_name}>
                    {q.display_name} [{q.queue_name}]
                  </option>
                ))}
              </select>
            )}

            {entryForm.destination_type === 'conference' && (
              <select
                value={entryForm.destination_value}
                onChange={(e) => setEntryForm({ ...entryForm, destination_value: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              >
                {conferences.map((c) => (
                  <option key={c.room_number} value={c.room_number}>
                    Salle {c.room_number} — {c.name}
                  </option>
                ))}
              </select>
            )}

            {entryForm.destination_type === 'voicemail' && (
              <input
                type="text"
                placeholder="Ex: 101"
                value={entryForm.destination_value}
                onChange={(e) => setEntryForm({ ...entryForm, destination_value: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEntryModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Sauvegarder la Touche
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal New IVR Menu */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer un Menu IVR"
        subtitle="Définition du point d'entrée et annonce vocale"
      >
        {editingMenu && (
          <form onSubmit={handleSaveMenu} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom du Menu *
                </label>
                <input
                  type="text"
                  value={editingMenu.name}
                  onChange={(e) => setEditingMenu({ ...editingMenu, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Numéro d'Extension Dialplan *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 700"
                  value={editingMenu.extension}
                  onChange={(e) => setEditingMenu({ ...editingMenu, extension: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fichier Audio d'Accueil (WAV / GSM) *
              </label>
              <input
                type="text"
                value={editingMenu.greeting_audio}
                onChange={(e) => setEditingMenu({ ...editingMenu, greeting_audio: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Timeout (secondes)</label>
                <input
                  type="number"
                  value={editingMenu.timeout_seconds}
                  onChange={(e) => setEditingMenu({ ...editingMenu, timeout_seconds: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre d'essais max</label>
                <input
                  type="number"
                  value={editingMenu.max_retries}
                  onChange={(e) => setEditingMenu({ ...editingMenu, max_retries: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
              >
                Enregistrer le Menu
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};


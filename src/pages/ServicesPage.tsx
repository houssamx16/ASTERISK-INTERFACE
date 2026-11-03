import React, { useState } from 'react';
import {
  Voicemail,
  Users2,
  Music2,
  PhoneForwarded,
  Plus,
  Trash2,
  Mail,
  Lock,
  Volume2,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VoicemailBox, ConferenceRoom } from '../types';
import { Modal } from '../components/common/Modal';

export const ServicesPage: React.FC = () => {
  const {
    voicemails,
    addVoicemail,
    conferences,
    addConference,
    deleteConference,
    mohFiles,
    uploadMOH,
    deleteMOH
  } = useApp();

  const [activeTab, setActiveTab] = useState<'voicemail' | 'conference' | 'moh' | 'transfer'>('voicemail');

  // Voicemail Modal
  const [isVmModalOpen, setIsVmModalOpen] = useState(false);
  const [vmForm, setVmForm] = useState<VoicemailBox>({
    mailbox_number: '',
    owner_name: '',
    pin: '1234',
    email: '',
    attach_audio: true,
    messages_count: 0,
    new_messages_count: 0,
    max_messages: 50
  });

  // Conference Modal
  const [isConfModalOpen, setIsConfModalOpen] = useState(false);
  const [confForm, setConfForm] = useState<Omit<ConferenceRoom, 'current_participants'>>({
    room_number: '',
    name: '',
    user_pin: '0000',
    admin_pin: '9999',
    max_members: 20,
    mute_on_join: false,
    record_conference: false
  });

  const handleCreateVoicemail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vmForm.mailbox_number || !vmForm.owner_name) return;
    addVoicemail(vmForm);
    setIsVmModalOpen(false);
  };

  const handleCreateConference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confForm.room_number || !confForm.name) return;
    addConference(confForm);
    setIsConfModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadMOH(file, 'default');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Services Téléphoniques VoIP</h2>
        <p className="text-sm text-slate-400 mt-1">
          Messagerie Vocale, Salles de Conférence (ConfBridge), Musique d'Attente et Transfert d'Appel
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('voicemail')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'voicemail'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Voicemail className="w-4 h-4" />
          <span>Messagerie Vocale ({voicemails.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('conference')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'conference'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Conférences ({conferences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moh')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'moh'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span>Musique d'Attente (MOH)</span>
        </button>

        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'transfer'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneForwarded className="w-4 h-4" />
          <span>Guide Transfert d'Appel</span>
        </button>
      </div>

      {/* Tab: Voicemail */}
      {activeTab === 'voicemail' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Boîtes vocales Asterisk (voicemail.conf) avec notification par email et pièces jointes WAV
            </p>
            <button
              onClick={() => setIsVmModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Boîte Vocale</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {voicemails.map((vm) => (
              <div
                key={vm.mailbox_number}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Voicemail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Boîte {vm.mailbox_number}</h4>
                      <p className="text-xs text-slate-400">{vm.owner_name}</p>
                    </div>
                  </div>
                  {vm.new_messages_count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                      {vm.new_messages_count} nouveau(x)
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" /> Code PIN
                    </span>
                    <span className="font-mono text-white font-bold">{vm.pin}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Envoi Audio Email
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {vm.attach_audio ? 'Activé (WAV)' : 'Désactivé'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Messages stockés</span>
                    <span className="font-mono text-slate-200">
                      {vm.messages_count} / {vm.max_messages}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Conferences */}
      {activeTab === 'conference' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Salles de réunion virtuelles Asterisk ConfBridge / MeetMe pour conférences multiples
            </p>
            <button
              onClick={() => setIsConfModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Salle de Conférence</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {conferences.map((conf) => (
              <div
                key={conf.room_number}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-mono text-lg font-bold">
                        {conf.room_number}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{conf.name}</h4>
                        <p className="text-xs text-slate-400">Extension directe : {conf.room_number}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer la salle ${conf.room_number} ?`)) {
                          deleteConference(conf.room_number);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Code PIN Membre</span>
                      <span className="font-mono text-sky-400 font-bold">{conf.user_pin}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Code PIN Administrateur</span>
                      <span className="font-mono text-indigo-400 font-bold">{conf.admin_pin}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Capacité Max</span>
                      <span className="text-slate-200 font-medium">{conf.max_members} participants</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Enregistrement Audio</span>
                      <span className={conf.record_conference ? 'text-emerald-400' : 'text-slate-400'}>
                        {conf.record_conference ? 'Activé (Automatique)' : 'Désactivé'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {conf.current_participants > 0 && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          conf.current_participants > 0 ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      ></span>
                    </span>
                    <span className="text-slate-300 font-medium">
                      {conf.current_participants} participant(s) en ligne
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">confbridge.conf</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Music on Hold */}
      {activeTab === 'moh' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Gestionnaire de Musique d'Attente</h3>
                <p className="text-xs text-slate-400">
                  Bibliothèque audio Asterisk musiconhold.conf (fichiers PCM WAV 8kHz mono / GSM)
                </p>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 cursor-pointer shadow-lg shadow-sky-500/20 transition-all">
                <UploadCloud className="w-4 h-4" />
                <span>Uploader Audio (.wav / .gsm)</span>
                <input type="file" accept=".wav,.gsm,.mp3" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
              {mohFiles.map((file) => (
                <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-950/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{file.filename}</h4>
                      <p className="text-xs text-slate-400">
                        Classe: <strong className="text-sky-400">{file.class_name}</strong> • Durée: {file.duration_seconds}s • Taille: {file.filesize_kb} Ko
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Écouter l'extrait">
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMOH(file.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer le fichier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Transfer Guide */}
      {activeTab === 'transfer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-1">Configuration du Transfert d'Appel Asterisk</h3>
          <p className="text-xs text-slate-400 mb-6">
            Règles et codes DTMF supportés sur les téléphones IP et softphones de l'appliance
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-400">
                <PhoneForwarded className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Transfert Aveugle (Blind Transfer)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Permet de transférer immédiatement l'appelant vers une autre extension sans avertir le destinataire au préalable.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 font-mono text-xs text-sky-400">
                Code Asterisk features.conf : <strong>##</strong> puis taper le numéro de poste
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>L'agent raccroche immédiatement.</li>
                <li>L'appelant entend la sonnerie du poste transféré.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Users2 className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Transfert Assisté (Attended Transfer)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Permet à l'agent de parler en privé avec le destinataire avant de lui basculer la communication de l'appelant.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 font-mono text-xs text-indigo-400">
                Code Asterisk features.conf : <strong>*2</strong> puis taper le numéro de poste
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                <li>L'appelant est mis en attente musicale (MOH).</li>
                <li>L'agent annonce l'appel et valide le transfert en raccrochant.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal New Voicemail */}
      <Modal
        isOpen={isVmModalOpen}
        onClose={() => setIsVmModalOpen(false)}
        title="Créer une Boîte Vocale"
        subtitle="Configuration de la messagerie vocale sur une extension"
      >
        <form onSubmit={handleCreateVoicemail} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Numéro de Boîte (Poste) *
              </label>
              <input
                type="text"
                placeholder="Ex: 201"
                value={vmForm.mailbox_number}
                onChange={(e) => setVmForm({ ...vmForm, mailbox_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code PIN Secret *</label>
              <input
                type="text"
                placeholder="1234"
                value={vmForm.pin}
                onChange={(e) => setVmForm({ ...vmForm, pin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du Titulaire *</label>
            <input
              type="text"
              placeholder="Ex: Fatima Zohra"
              value={vmForm.owner_name}
              onChange={(e) => setVmForm({ ...vmForm, owner_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email pour Notifications</label>
            <input
              type="email"
              placeholder="user@telephony.local"
              value={vmForm.email}
              onChange={(e) => setVmForm({ ...vmForm, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={vmForm.attach_audio}
              onChange={(e) => setVmForm({ ...vmForm, attach_audio: e.target.checked })}
              className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
            />
            <span>Attacher l'enregistrement audio .wav dans l'email</span>
          </label>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsVmModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Créer la Boîte Vocale
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal New Conference */}
      <Modal
        isOpen={isConfModalOpen}
        onClose={() => setIsConfModalOpen(false)}
        title="Créer une Salle de Conférence"
        subtitle="Configuration ConfBridge / MeetMe pour réunions audio"
      >
        <form onSubmit={handleCreateConference} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Numéro de Salle *
              </label>
              <input
                type="text"
                placeholder="Ex: 802"
                value={confForm.room_number}
                onChange={(e) => setConfForm({ ...confForm, room_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de la Salle *</label>
              <input
                type="text"
                placeholder="Ex: Salle Conseil ASR2"
                value={confForm.name}
                onChange={(e) => setConfForm({ ...confForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Utilisateur (Membre)</label>
              <input
                type="text"
                placeholder="0000"
                value={confForm.user_pin}
                onChange={(e) => setConfForm({ ...confForm, user_pin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Administrateur</label>
              <input
                type="text"
                placeholder="9999"
                value={confForm.admin_pin}
                onChange={(e) => setConfForm({ ...confForm, admin_pin: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={confForm.mute_on_join}
                onChange={(e) => setConfForm({ ...confForm, mute_on_join: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
              />
              <span>Muter automatiquement les participants à l'entrée</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={confForm.record_conference}
                onChange={(e) => setConfForm({ ...confForm, record_conference: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
              />
              <span>Enregistrer intégralement la session de conférence</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsConfModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Créer la Salle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


import React, { useState } from 'react';
import {
  Archive,
  Download,
  RotateCcw,
  Trash2,
  Plus,
  Server,
  Shield,
  RefreshCw,
  HardDrive,
  FileCheck,
  AlertTriangle,
  Power
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackupArchive } from '../types';
import { Modal } from '../components/common/Modal';

export const BackupPage: React.FC = () => {
  const {
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    systemMetrics,
    restartService,
    applyAsteriskConfig,
    showToast
  } = useApp();

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupType, setBackupType] = useState<BackupArchive['type']>('full');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBackup(backupType);
    setIsBackupModalOpen(false);
  };

  const handleDownload = (filename: string) => {
    showToast('info', 'Téléchargement Lancé', `L'archive ${filename} est prête.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Sauvegarde, Restauration & Maintenance Système
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Génération d'archives complètes (.tar.gz), restauration d'état et contrôle des sous-systèmes
          </p>
        </div>
        <button
          onClick={() => setIsBackupModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Sauvegarde</span>
        </button>
      </div>

      {/* Maintenance Controls Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Asterisk Dialplan & PJSIP Reload */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 w-fit mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Rechargement Dynamique</h3>
            <p className="text-xs text-slate-400 mt-1">
              Applique les fichiers PJSIP et extensions.conf sans couper les appels en cours.
            </p>
          </div>
          <button
            onClick={applyAsteriskConfig}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
          >
            Recharger Asterisk
          </button>
        </div>

        {/* Asterisk Core Daemon Restart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit mb-3">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Redémarrage Moteur PBX</h3>
            <p className="text-xs text-slate-400 mt-1">
              Redémarre le processus `systemctl restart asterisk` en cas d'anomalie critique.
            </p>
          </div>
          <button
            onClick={() => restartService('asterisk')}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            Redémarrer Daemon
          </button>
        </div>

        {/* Database Restart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit mb-3">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Base de Données MariaDB</h3>
            <p className="text-xs text-slate-400 mt-1">
              Vérifie l'intégrité des tables abonnés et CDR enregistrées dans MySQL/MariaDB.
            </p>
          </div>
          <button
            onClick={() => restartService('mariadb')}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
          >
            Relancer MariaDB
          </button>
        </div>
      </div>

      {/* Backups List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Archives de Sauvegarde Disponibles</h3>
          <p className="text-xs text-slate-400">
            Snapshots sauvegardés sur le stockage local (/var/backups/asterisk-appliance/)
          </p>
        </div>

        <div className="divide-y divide-slate-800/80">
          {backups.map((bak) => (
            <div
              key={bak.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-950/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{bak.filename}</h4>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Date: {bak.created_at}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-300 font-medium">{bak.size_mb} Mo</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-sky-400 uppercase">
                      {bak.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleDownload(bak.filename)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Confirmez-vous la restauration de la sauvegarde "${bak.filename}" ? Les données actuelles seront écrasées.`)) {
                      restoreBackup(bak.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurer</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Supprimer définitivement l'archive ${bak.filename} ?`)) {
                      deleteBackup(bak.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Audit Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Sécurité & Authentification</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Rôle Administrateur</span>
            <p className="text-white font-semibold mt-1">Super Administrateur (ASR2)</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Accès total aux fichiers Asterisk et AMI</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Protection SIP</span>
            <p className="text-emerald-400 font-semibold mt-1">Fail2Ban & ACLs Activées</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Blocage automatique après 5 échecs d'auth</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Chiffrement Signalisation</span>
            <p className="text-sky-400 font-semibold mt-1">TLS / SRTP Disponible</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Certificat SSL local auto-signé</p>
          </div>
        </div>
      </div>

      {/* Modal Create Backup */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Créer une Nouvelle Sauvegarde"
        subtitle="Snapshot complet de l'appliance Asterisk PBX"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Type d'Archive</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="backupType"
                  value="full"
                  checked={backupType === 'full'}
                  onChange={() => setBackupType('full')}
                  className="mt-0.5 text-sky-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Sauvegarde Complète (Full)</span>
                  <span className="text-[11px] text-slate-400">
                    Inclut la base MariaDB, les fichiers Asterisk (/etc/asterisk), les messages vocaux et prompts.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <input
                  type="radio"
                  name="backupType"
                  value="config_only"
                  checked={backupType === 'config_only'}
                  onChange={() => setBackupType('config_only')}
                  className="mt-0.5 text-sky-500"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Fichiers de Configuration Seuls</span>
                  <span className="text-[11px] text-slate-400">
                    pjsip.conf, extensions.conf, queues.conf, voicemail.conf, confbridge.conf.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Générer la Sauvegarde (.tar.gz)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


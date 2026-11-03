
import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Key,
  Trash2,
  Edit2,
  RefreshCw,
  Phone,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Extension } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';

// Generate a cryptographically secure SIP password.
// The backend accepts only these characters and requires 16-128 characters.
const generateSipPassword = (length = 24): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const randomValues = new Uint8Array(length);

  window.crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => chars[value % chars.length])
    .join('');
};

export const ExtensionsPage: React.FC = () => {
  const {
    extensions,
    loadingExtensions,
    fetchExtensions,
    addExtension,
    updateExtension,
    deleteExtension,
    toggleExtensionStatus,
    applyAsteriskConfig,
    pendingReload
  } = useApp();

  useEffect(() => {
    fetchExtensions();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<Extension | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    extension_number: '',
    sip_password: '',
    caller_id: '',
    user_name: '',
    user_email: '',
    department: 'Administration' as Extension['department'],
    transport: 'transport-udp' as Extension['transport'],
    context: 'internal',
    voicemail_enabled: true,
    webrtc_enabled: false,
    max_contacts: 1
  });

  const openCreateModal = () => {
    setEditingExtension(null);

    setFormData({
      extension_number: '',
      sip_password: generateSipPassword(),
      caller_id: '',
      user_name: '',
      user_email: '',
      department: 'Administration',
      transport: 'transport-udp',
      context: 'internal',
      voicemail_enabled: true,
      webrtc_enabled: false,
      max_contacts: 1
    });

    setIsModalOpen(true);
  };

  const openEditModal = (ext: Extension) => {
    setEditingExtension(ext);

    setFormData({
      extension_number: ext.extension_number,
      // The backend does not return existing SIP passwords.
      // Password changes are not supported by the current update API.
      sip_password: '',
      caller_id: ext.caller_id,
      user_name: ext.user_name,
      user_email: ext.user_email,
      department: ext.department,
      transport: 'transport-udp',
      context: ext.context,
      voicemail_enabled: ext.voicemail_enabled,
      webrtc_enabled: ext.webrtc_enabled,
      max_contacts: ext.max_contacts
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setEditingExtension(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (
      !formData.extension_number.trim() ||
      !formData.user_name.trim()
    ) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!editingExtension) {
      if (!/^[1-5][0-9]{2}$/.test(formData.extension_number)) {
        alert('Le numéro doit contenir exactement 3 chiffres, entre 100 et 599.');
        return;
      }

      if (
        formData.sip_password.length < 16 ||
        formData.sip_password.length > 128 ||
        !/^[A-Za-z0-9_-]+$/.test(formData.sip_password)
      ) {
        alert(
          'Le mot de passe SIP doit contenir entre 16 et 128 caractères et utiliser uniquement des lettres, chiffres, _ ou -.'
        );
        return;
      }
    }

    const callerId =
      formData.caller_id.trim() ||
      `${formData.user_name} <${formData.extension_number}>`;

    setIsSubmitting(true);

    try {
      let success = false;

      if (editingExtension) {
        // Do not send sip_password: the current backend update
        // endpoint does not support changing SIP credentials.
        success = await updateExtension(editingExtension.id, {
          caller_id: callerId,
          user_name: formData.user_name.trim(),
          user_email: formData.user_email.trim(),
          department: formData.department,
          voicemail_enabled: formData.voicemail_enabled,
          webrtc_enabled: formData.webrtc_enabled,
          max_contacts: formData.max_contacts
        });
      } else {
        success = await addExtension({
          extension_number: formData.extension_number.trim(),
          sip_password: formData.sip_password,
          caller_id: callerId,
          user_id: null,
          user_name: formData.user_name.trim(),
          user_email: formData.user_email.trim(),
          department: formData.department,
          transport: 'transport-udp',
          context: 'internal',
          status: 'active',
          voicemail_enabled: formData.voicemail_enabled,
          webrtc_enabled: formData.webrtc_enabled,
          max_contacts: formData.max_contacts
        });
      }

      // Close the modal only if the backend confirms success.
      if (success) {
        setIsModalOpen(false);
        setEditingExtension(null);
      }
    } catch (error) {
      console.error('Extension save error:', error);
      alert('Une erreur est survenue pendant l’enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExtensions = extensions.filter((ext) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      ext.extension_number.includes(searchQuery) ||
      ext.user_name.toLowerCase().includes(query) ||
      ext.caller_id.toLowerCase().includes(query);

    const matchesDept =
      selectedDept === 'all' || ext.department === selectedDept;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'registered' &&
        ext.registration.status === 'registered') ||
      (selectedStatus === 'offline' &&
        ext.registration.status === 'offline') ||
      (selectedStatus === 'active' && ext.status === 'active') ||
      (selectedStatus === 'inactive' && ext.status === 'inactive');

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Utilisateurs & Extensions SIP (PJSIP)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gestion des comptes abonnés, associations et statuts d'enregistrement
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingReload && (
            <button
              onClick={() => applyAsteriskConfig()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm animate-pulse"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger Asterisk (pjsip reload)</span>
            </button>
          )}

          <button
            onClick={() => fetchExtensions()}
            disabled={loadingExtensions}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
            title="Rafraîchir depuis la base de données"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingExtensions ? 'animate-spin text-sky-400' : ''
              }`}
            />
            <span>Actualiser</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouvelle Extension</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Rechercher par numéro, nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tous les services</option>
              <option value="Administration">Administration (100–199)</option>
              <option value="Finance">Finance (200–299)</option>
              <option value="IT">IT (300–399)</option>
              <option value="Customer Service">Customer Service (400–499)</option>
              <option value="Management">Management (500–599)</option>
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="registered">Enregistrés (Online)</option>
            <option value="offline">Hors ligne (Offline)</option>
            <option value="active">Actifs</option>
            <option value="inactive">Désactivés</option>
          </select>
        </div>
      </div>

      {/* Extensions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5 font-semibold">Poste / Extension</th>
                <th className="py-3.5 px-5 font-semibold">Utilisateur Associé</th>
                <th className="py-3.5 px-5 font-semibold">Service</th>
                <th className="py-3.5 px-5 font-semibold">Secret SIP</th>
                <th className="py-3.5 px-5 font-semibold">Enregistrement Téléphone</th>
                <th className="py-3.5 px-5 font-semibold">État Ligne</th>
                <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {loadingExtensions && extensions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                      <span className="text-sm font-medium">
                        Chargement des extensions depuis la base SQLite...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredExtensions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Phone className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">
                        Aucune extension trouvée
                      </p>
                      <p className="text-xs text-slate-500">
                        {searchQuery ||
                        selectedDept !== 'all' ||
                        selectedStatus !== 'all'
                          ? 'Essayez de modifier vos critères de recherche ou filtres.'
                          : 'Cliquez sur "Nouvelle Extension" pour créer votre premier poste PJSIP.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExtensions.map((ext) => (
                  <tr key={ext.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
                          {ext.extension_number}
                        </div>

                        <div>
                          <span className="font-semibold text-white">
                            {ext.caller_id}
                          </span>

                          <div className="text-[10px] text-slate-400 font-mono">
                            {ext.transport} • {ext.context}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="font-medium text-slate-200">
                        {ext.user_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ext.user_email}
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {ext.department}
                      </span>
                    </td>

                    {/* Never expose SIP passwords in the frontend */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Key className="w-3 h-3" />
                        <span className="text-[11px]">
                          Configuré — masqué
                        </span>
                      </div>
                    </td>

                    {/* This status currently comes from the database, not live AMI */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        <StatusBadge
                          status={ext.registration.status}
                          label={
                            ext.registration.status === 'registered'
                              ? `Enregistré (${ext.registration.latency_ms}ms)`
                              : 'Hors-ligne'
                          }
                        />

                        <div className="text-[10px] text-slate-500">
                          Statut enregistré en base de données
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => toggleExtensionStatus(ext.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                          ext.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {ext.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Actif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Désactivé
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(ext)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                          title="Modifier l'extension"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Confirmez-vous la suppression de l'extension ${ext.extension_number} ?`
                              )
                            ) {
                              deleteExtension(ext.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extension Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          editingExtension
            ? `Modifier l'Extension ${editingExtension.extension_number}`
            : 'Créer une Nouvelle Extension PJSIP'
        }
        subtitle="Configuration du compte SIP et assignation d'utilisateur"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Numéro d'Extension *
              </label>

              <input
                type="text"
                placeholder="Ex: 301"
                disabled={!!editingExtension}
                value={formData.extension_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    extension_number: e.target.value
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
                required
              />
            </div>

            {!editingExtension && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mot de Passe SIP (Secret) *
                </label>

                <input
                  type="text"
                  autoComplete="new-password"
                  value={formData.sip_password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sip_password: e.target.value
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                  minLength={16}
                  maxLength={128}
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  16 à 128 caractères. Lettres, chiffres, _ et - uniquement.
                </p>
              </div>
            )}

            {editingExtension && (
              <div className="flex items-center text-xs text-slate-400">
                <Key className="w-4 h-4 mr-2" />
                Le secret SIP existant reste inchangé.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nom Complet Utilisateur *
              </label>

              <input
                type="text"
                placeholder="Ex: Mourad Belkacem"
                value={formData.user_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    user_name: e.target.value
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adresse Email
              </label>

              <input
                type="email"
                placeholder="m.belkacem@telephony.local"
                value={formData.user_email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    user_email: e.target.value
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Département / Service *
              </label>

              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    department: e.target.value as Extension['department']
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Administration">Administration (100–199)</option>
                <option value="Finance">Finance (200–299)</option>
                <option value="IT">IT (300–399)</option>
                <option value="Customer Service">Customer Service (400–499)</option>
                <option value="Management">Management (500–599)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Protocole de Transport PJSIP
              </label>

              <select
                value="transport-udp"
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white opacity-70"
              >
                <option value="transport-udp">
                  UDP (Port standard 5060)
                </option>
              </select>

              <p className="text-[10px] text-slate-500 mt-1">
                UDP uniquement dans la configuration actuelle du serveur.
              </p>
            </div>
          </div>

          {/* Additional VoIP options */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.voicemail_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    voicemail_enabled: e.target.checked
                  })
                }
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
              />
              <span>
                Activer la boîte vocale (Voicemail) sur cette extension
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.webrtc_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    webrtc_enabled: e.target.checked
                  })
                }
                className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
              />
              <span>Support WebRTC / Navigateur web</span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : editingExtension
                  ? 'Enregistrer les Modifications'
                  : "Créer l'Extension"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

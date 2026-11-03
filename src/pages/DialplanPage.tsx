import React, { useState } from 'react';
import {
  GitFork,
  PhoneForwarded,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Save,
  Check,
  RefreshCw,
  PhoneCall,
  Clock
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { RoutingRule, CallForwarding } from '../types';
import { Modal } from '../components/common/Modal';

export const DialplanPage: React.FC = () => {
  const {
    dialplanRanges,
    updateDialplanRange,
    routingRules,
    addRoutingRule,
    deleteRoutingRule,
    callForwardingList,
    updateCallForwarding,
    extensions,
    applyAsteriskConfig,
    pendingReload
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ranges' | 'rules' | 'forwarding'>('ranges');

  // Modal for new rule
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const [newRule, setNewRule] = useState({
    name: '',
    pattern: '',
    description: '',
    action: 'allow' as RoutingRule['action'],
    pin_code: '',
    applies_to: 'all' as RoutingRule['applies_to'],
    target_id: ''
  });

  // Modal for edit range
  const [editingRangeId, setEditingRangeId] = useState<number | null>(null);
  const [rangeEditData, setRangeEditData] = useState({
    start: 0,
    end: 0,
    desc: ''
  });

  // Modal for Call Forwarding
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  const [forwardData, setForwardData] = useState<CallForwarding>({
    extension_number: '101',
    forward_always_enabled: false,
    forward_always_dest: '',
    forward_busy_enabled: false,
    forward_busy_dest: '',
    forward_no_answer_enabled: false,
    forward_no_answer_dest: '',
    timeout_seconds: 20
  });

  const handleOpenForwardModal = (extNum: string) => {
    const existing = callForwardingList.find(
      (cf) => cf.extension_number === extNum
    );

    if (existing) {
      setForwardData(existing);
    } else {
      setForwardData({
        extension_number: extNum,
        forward_always_enabled: false,
        forward_always_dest: '',
        forward_busy_enabled: false,
        forward_busy_dest: '',
        forward_no_answer_enabled: false,
        forward_no_answer_dest: '',
        timeout_seconds: 20
      });
    }

    setIsForwardModalOpen(true);
  };

  const handleSaveForwarding = (e: React.FormEvent) => {
    e.preventDefault();
    updateCallForwarding(forwardData);
    setIsForwardModalOpen(false);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRule.name.trim() || !newRule.pattern.trim()) return;

    // A target is required for department and extension rules.
    if (
      newRule.applies_to !== 'all' &&
      !newRule.target_id
    ) {
      return;
    }

    addRoutingRule({
      name: newRule.name.trim(),
      pattern: newRule.pattern.trim(),
      description: newRule.description,
      action: newRule.action,
      pin_code:
        newRule.action === 'require_pin'
          ? newRule.pin_code
          : undefined,
      applies_to: newRule.applies_to,
      target_id:
        newRule.applies_to === 'all'
          ? undefined
          : newRule.target_id
    });

    setIsRuleModalOpen(false);

    // Reset the form for the next rule.
    setNewRule({
      name: '',
      pattern: '',
      description: '',
      action: 'allow',
      pin_code: '',
      applies_to: 'all',
      target_id: ''
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Plan de Numérotation & Routage d'Appels
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Plages de numéros par service, restrictions d'appels, transfert et renvoi d'appels
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingReload && (
            <button
              onClick={applyAsteriskConfig}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm animate-pulse"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger Dialplan (dialplan reload)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('ranges')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'ranges'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Plages par Service (100–599)</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Restrictions & Sécurité Dialplan</span>
        </button>

        <button
          onClick={() => setActiveTab('forwarding')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'forwarding'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneForwarded className="w-4 h-4" />
          <span>Renvoi & Transfert d'Appel</span>
        </button>
      </div>

      {/* Tab 1: Ranges by Department */}
      {activeTab === 'ranges' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Architecture du Plan de Numérotation
            </h3>

            <p className="text-xs text-slate-400 mb-6">
              Attribution des tranches de numérotation pour chaque département de l'entreprise
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dialplanRanges.map((range) => {
                const isEditing = editingRangeId === range.id;

                return (
                  <div
                    key={range.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                          Tranche {range.range_start}–{range.range_end}
                        </span>

                        <h4 className="text-base font-bold text-white mt-2">
                          {range.department}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          if (isEditing) {
                            updateDialplanRange(
                              range.id,
                              rangeEditData.start,
                              rangeEditData.end,
                              rangeEditData.desc
                            );

                            setEditingRangeId(null);
                          } else {
                            setEditingRangeId(range.id);

                            setRangeEditData({
                              start: range.range_start,
                              end: range.range_end,
                              desc: range.description
                            });
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        title={isEditing ? 'Enregistrer' : 'Modifier'}
                      >
                        {isEditing ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={rangeEditData.start}
                            onChange={(e) =>
                              setRangeEditData({
                                ...rangeEditData,
                                start: Number(e.target.value)
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />

                          <input
                            type="number"
                            value={rangeEditData.end}
                            onChange={(e) =>
                              setRangeEditData({
                                ...rangeEditData,
                                end: Number(e.target.value)
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>

                        <input
                          type="text"
                          value={rangeEditData.desc}
                          onChange={(e) =>
                            setRangeEditData({
                              ...rangeEditData,
                              desc: e.target.value
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">
                        {range.description}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Postes créés</span>

                      <span className="font-mono text-white font-semibold">
                        {range.allocated_count} extensions
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Call Restrictions & Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une Règle de Restriction</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-5 font-semibold">Nom de la Règle</th>
                  <th className="py-3.5 px-5 font-semibold">Pattern Asterisk</th>
                  <th className="py-3.5 px-5 font-semibold">Description</th>
                  <th className="py-3.5 px-5 font-semibold">Action / Sécurité</th>
                  <th className="py-3.5 px-5 font-semibold">Cible</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Supprimer</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {routingRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-semibold text-white">
                      {rule.name}
                    </td>

                    <td className="py-3.5 px-5 font-mono text-sky-400 bg-slate-950/40 px-2 rounded">
                      {rule.pattern}
                    </td>

                    <td className="py-3.5 px-5 text-slate-300 max-w-xs">
                      {rule.description}
                    </td>

                    <td className="py-3.5 px-5">
                      {rule.action === 'allow' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Autorisé
                        </span>
                      )}

                      {rule.action === 'deny' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Bloqué
                        </span>
                      )}

                      {rule.action === 'require_pin' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Code PIN Requis
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-slate-300">
                      {rule.applies_to === 'all'
                        ? 'Tous les postes'
                        : rule.applies_to === 'department'
                          ? `Département: ${rule.target_id}`
                          : `Extension: ${rule.target_id}`}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => deleteRoutingRule(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Call Forwarding & Transfer */}
      {activeTab === 'forwarding' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">
              Gestion des Renvois d'Appels par Poste
            </h3>

            <p className="text-xs text-slate-400">
              Configurez le renvoi systématique, si occupé ou en cas de non-réponse
            </p>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5 font-semibold">Poste</th>
                <th className="py-3.5 px-5 font-semibold">Titulaire</th>
                <th className="py-3.5 px-5 font-semibold">Renvoi Inconditionnel</th>
                <th className="py-3.5 px-5 font-semibold">Renvoi si Occupé</th>
                <th className="py-3.5 px-5 font-semibold">Renvoi Non-Réponse</th>
                <th className="py-3.5 px-5 font-semibold text-right">Configuration</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {extensions.map((ext) => {
                const cf = callForwardingList.find(
                  (c) => c.extension_number === ext.extension_number
                );

                return (
                  <tr
                    key={ext.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-sky-400">
                      {ext.extension_number}
                    </td>

                    <td className="py-3.5 px-5 text-white font-medium">
                      {ext.user_name}
                    </td>

                    <td className="py-3.5 px-5">
                      {cf?.forward_always_enabled ? (
                        <span className="text-emerald-400 font-mono">
                          → {cf.forward_always_dest}
                        </span>
                      ) : (
                        <span className="text-slate-400">Désactivé</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      {cf?.forward_busy_enabled ? (
                        <span className="text-sky-400 font-mono">
                          → {cf.forward_busy_dest}
                        </span>
                      ) : (
                        <span className="text-slate-400">Désactivé</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      {cf?.forward_no_answer_enabled ? (
                        <span className="text-indigo-400 font-mono">
                          → {cf.forward_no_answer_dest} ({cf.timeout_seconds}s)
                        </span>
                      ) : (
                        <span className="text-slate-400">Désactivé</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() =>
                          handleOpenForwardModal(ext.extension_number)
                        }
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      >
                        Configurer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal New Rule */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Ajouter une Règle de Routage Asterisk"
        subtitle="Définition du dialplan pattern et politiques d'accès"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">

          {/* Rule Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nom de la Règle *
            </label>

            <input
              type="text"
              placeholder="Ex: Restriction Appels GSM"
              value={newRule.name}
              onChange={(e) =>
                setNewRule({ ...newRule, name: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Pattern and Action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pattern Asterisk (ex: _00., _0[5-7]X) *
              </label>

              <input
                type="text"
                placeholder="_00."
                value={newRule.pattern}
                onChange={(e) =>
                  setNewRule({ ...newRule, pattern: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Action
              </label>

              <select
                value={newRule.action}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    action: e.target.value as RoutingRule['action']
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="allow">Autoriser (Allow)</option>
                <option value="deny">Interdire (Block)</option>
                <option value="require_pin">Exiger un Code PIN</option>
              </select>
            </div>
          </div>

          {/* Rule Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Appliquer la règle à
            </label>

            <select
              value={newRule.applies_to}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  applies_to: e.target.value as RoutingRule['applies_to'],
                  target_id: ''
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tous les postes</option>
              <option value="department">Département spécifique</option>
              <option value="extension">Extension spécifique</option>
            </select>
          </div>

          {/* Department Selection */}
          {newRule.applies_to === 'department' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sélectionner le département
              </label>

              <select
                value={newRule.target_id}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    target_id: e.target.value
                  })
                }
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Choisir un département</option>

                {dialplanRanges.map((range) => (
                  <option key={range.id} value={range.department}>
                    {range.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Extension Selection */}
          {newRule.applies_to === 'extension' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sélectionner l'extension
              </label>

              <select
                value={newRule.target_id}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    target_id: e.target.value
                  })
                }
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="">Choisir une extension</option>

                {extensions.map((ext) => (
                  <option key={ext.id} value={ext.extension_number}>
                    {ext.extension_number} - {ext.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PIN */}
          {newRule.action === 'require_pin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Code PIN Secret
              </label>

              <input
                type="password"
                autoComplete="new-password"
                placeholder="Saisir un code PIN"
                value={newRule.pin_code}
                onChange={(e) =>
                  setNewRule({ ...newRule, pin_code: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>

            <textarea
              rows={2}
              placeholder="Description explicative de la restriction..."
              value={newRule.description}
              onChange={(e) =>
                setNewRule({ ...newRule, description: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400"
            >
              Créer la Règle
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Call Forwarding */}
      <Modal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        title={`Renvoi d'Appel pour l'Extension ${forwardData.extension_number}`}
        subtitle="Définissez les conditions et numéros cibles de déviation d'appel"
      >
        <form onSubmit={handleSaveForwarding} className="space-y-4">

          {/* Always Forward */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={forwardData.forward_always_enabled}
                onChange={(e) =>
                  setForwardData({
                    ...forwardData,
                    forward_always_enabled: e.target.checked
                  })
                }
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />

              <span>Renvoi Inconditionnel (Toujours dévier)</span>
            </label>

            {forwardData.forward_always_enabled && (
              <input
                type="text"
                placeholder="Numéro destination ou 'voicemail'"
                value={forwardData.forward_always_dest}
                onChange={(e) =>
                  setForwardData({
                    ...forwardData,
                    forward_always_dest: e.target.value
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            )}
          </div>

          {/* Forward When Busy */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={forwardData.forward_busy_enabled}
                onChange={(e) =>
                  setForwardData({
                    ...forwardData,
                    forward_busy_enabled: e.target.checked
                  })
                }
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />

              <span>Renvoi si la ligne est Occupée</span>
            </label>

            {forwardData.forward_busy_enabled && (
              <input
                type="text"
                placeholder="Ex: 102 ou voicemail"
                value={forwardData.forward_busy_dest}
                onChange={(e) =>
                  setForwardData({
                    ...forwardData,
                    forward_busy_dest: e.target.value
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            )}
          </div>

          {/* Forward When No Answer */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={forwardData.forward_no_answer_enabled}
                onChange={(e) =>
                  setForwardData({
                    ...forwardData,
                    forward_no_answer_enabled: e.target.checked
                  })
                }
                className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />

              <span>Renvoi sur Non-Réponse (Timeout)</span>
            </label>

            {forwardData.forward_no_answer_enabled && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ex: 102 ou voicemail"
                  value={forwardData.forward_no_answer_dest}
                  onChange={(e) =>
                    setForwardData({
                      ...forwardData,
                      forward_no_answer_dest: e.target.value
                    })
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />

                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <input
                    type="number"
                    value={forwardData.timeout_seconds}
                    onChange={(e) =>
                      setForwardData({
                        ...forwardData,
                        timeout_seconds: Number(e.target.value)
                      })
                    }
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />

                  <span>secondes</span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsForwardModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-white"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
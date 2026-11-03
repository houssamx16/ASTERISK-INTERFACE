// Complete Typed API Functions for Frontend-Backend Integration
// Aligned with API_CONTRACT.md

import { apiClient, ApiResponse } from './client';
import {
  Extension,
  DialplanRange,
  RoutingRule,
  CallForwarding,
  VoicemailBox,
  ConferenceRoom,
  MOHFile,
  CallQueue,
  IVRMenu,
  ActiveChannel,
  CDRRecord,
  SystemMetrics,
  BackupArchive
} from '../types';

// ==========================================
// 1. Authentification
// ==========================================
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<{ token: string; user: any }>('/auth/login', { username, password }),
  logout: () => apiClient.post('/auth/logout', {}),
  getMe: () => apiClient.get<any>('/auth/me')
};

// ==========================================
// 2. Tableau de Bord & Système
// ==========================================
export const dashboardApi = {
  getSummary: () => apiClient.get<any>('/dashboard/summary'),
  getResources: () => apiClient.get<SystemMetrics>('/system/resources'),
  controlService: (serviceName: string, action: 'restart' | 'start' | 'stop') =>
    apiClient.post(`/system/service/${serviceName}/${action}`, {})
};

// ==========================================
// 3. Utilisateurs & Extensions PJSIP
// ==========================================
export const extensionsApi = {
  getAll: () => apiClient.get<Extension[]>('/extensions'),
  getById: (id: string) => apiClient.get<Extension>(`/extensions/${id}`),
  create: (data: Partial<Extension>) => apiClient.post<Extension>('/extensions', data),
  update: (id: string, data: Partial<Extension>) => apiClient.put<Extension>(`/extensions/${id}`, data),
  toggleStatus: (id: string) => apiClient.patch<Extension>(`/extensions/${id}/toggle`, {}),
  delete: (id: string) => apiClient.delete(`/extensions/${id}`),
  applyConfig: () => apiClient.post('/extensions/apply-config', {})
};

// ==========================================
// 4. Plan de Numérotation & Dialplan
// ==========================================
export const dialplanApi = {
  getRanges: () => apiClient.get<DialplanRange[]>('/dialplan/ranges'),
  updateRange: (id: number, data: Partial<DialplanRange>) =>
    apiClient.put<DialplanRange>(`/dialplan/ranges/${id}`, data),
  getRules: () => apiClient.get<RoutingRule[]>('/dialplan/rules'),
  createRule: (rule: Omit<RoutingRule, 'id'>) => apiClient.post<RoutingRule>('/dialplan/rules', rule),
  deleteRule: (id: string) => apiClient.delete(`/dialplan/rules/${id}`),
  getForwardingList: () => apiClient.get<CallForwarding[]>('/dialplan/forwarding'),
  updateForwarding: (extNumber: string, data: CallForwarding) =>
    apiClient.put<CallForwarding>(`/dialplan/forwarding/${extNumber}`, data),
  reloadDialplan: () => apiClient.post('/dialplan/reload', {})
};

// ==========================================
// 5. Services Téléphoniques (Voicemail, Conf, MOH)
// ==========================================
export const servicesApi = {
  getVoicemails: () => apiClient.get<VoicemailBox[]>('/services/voicemail'),
  createVoicemail: (data: VoicemailBox) => apiClient.post<VoicemailBox>('/services/voicemail', data),
  updateVoicemail: (number: string, data: Partial<VoicemailBox>) =>
    apiClient.put<VoicemailBox>(`/services/voicemail/${number}`, data),
  getConferences: () => apiClient.get<ConferenceRoom[]>('/services/conferences'),
  createConference: (data: Omit<ConferenceRoom, 'current_participants'>) =>
    apiClient.post<ConferenceRoom>('/services/conferences', data),
  deleteConference: (number: string) => apiClient.delete(`/services/conferences/${number}`),
  getMOHList: () => apiClient.get<MOHFile[]>('/services/moh'),
  deleteMOH: (id: string) => apiClient.delete(`/services/moh/${id}`)
};

// ==========================================
// 6. Centre d'Appels & Files (ACD Queues)
// ==========================================
export const callCenterApi = {
  getQueues: () => apiClient.get<CallQueue[]>('/call-center/queues'),
  createQueue: (data: Partial<CallQueue>) => apiClient.post<CallQueue>('/call-center/queues', data),
  updateQueue: (id: string, data: Partial<CallQueue>) =>
    apiClient.put<CallQueue>(`/call-center/queues/${id}`, data),
  deleteQueue: (id: string) => apiClient.delete(`/call-center/queues/${id}`),
  assignAgent: (queueId: string, extension: string, penalty: number) =>
    apiClient.post(`/call-center/queues/${queueId}/agents`, { extension, penalty }),
  removeAgent: (queueId: string, agentId: string) =>
    apiClient.delete(`/call-center/queues/${queueId}/agents/${agentId}`),
  getQueueStats: (queueId: string) => apiClient.get<any>(`/call-center/queues/${queueId}/stats`)
};

// ==========================================
// 7. Serveur Vocal Interactif (IVR)
// ==========================================
export const ivrApi = {
  getAll: () => apiClient.get<IVRMenu[]>('/ivr'),
  create: (data: IVRMenu) => apiClient.post<IVRMenu>('/ivr', data),
  update: (id: string, data: Partial<IVRMenu>) => apiClient.put<IVRMenu>(`/ivr/${id}`, data),
  delete: (id: string) => apiClient.delete(`/ivr/${id}`)
};

// ==========================================
// 8. Supervision Temps Réel (Monitoring / AMI)
// ==========================================
export const monitoringApi = {
  getLiveChannels: () => apiClient.get<ActiveChannel[]>('/monitoring/live-channels'),
  hangupChannel: (channelId: string) =>
    apiClient.post(`/monitoring/hangup/${encodeURIComponent(channelId)}`, {})
};

// ==========================================
// 9. CDR & Statistiques
// ==========================================
export const cdrApi = {
  getRecords: (params?: { page?: number; limit?: number; disposition?: string; department?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.disposition) query.append('disposition', params.disposition);
    if (params?.department) query.append('department', params.department);
    if (params?.search) query.append('search', params.search);
    return apiClient.get<{ records: CDRRecord[]; pagination: any }>(`/cdr?${query.toString()}`);
  },
  getStats: () => apiClient.get<any>('/cdr/stats'),
  exportCsvUrl: () => '/api/v1/cdr/export'
};

// ==========================================
// 10. Sauvegarde & Maintenance
// ==========================================
export const backupApi = {
  getAll: () => apiClient.get<BackupArchive[]>('/system/backups'),
  create: (type: 'full' | 'config_only') => apiClient.post<BackupArchive>('/system/backups', { type }),
  restore: (id: string) => apiClient.post(`/system/backups/${id}/restore`, {}),
  delete: (id: string) => apiClient.delete(`/system/backups/${id}`),
  getDownloadUrl: (id: string) => `/api/v1/system/backups/${id}/download`
};


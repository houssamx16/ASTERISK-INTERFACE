
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef
} from 'react';

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

import {
  initialSystemMetrics,
  initialDialplanRanges,
  initialCallForwarding,
  initialVoicemails,
  initialConferences,
  initialMOHFiles,
  initialQueues,
  initialIVRMenus,
  initialBackups
} from '../mocks/mockData';

import {
  extensionsApi,
  dialplanApi,
  callCenterApi,
  ivrApi,
  cdrApi,
  monitoringApi
} from '../api';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

type NewExtension = Omit<Extension, 'id' | 'registration'> & {
  sip_password: string;
};

interface AppContextType {
  systemMetrics: SystemMetrics;
  extensions: Extension[];
  dialplanRanges: DialplanRange[];
  routingRules: RoutingRule[];
  callForwardingList: CallForwarding[];
  voicemails: VoicemailBox[];
  conferences: ConferenceRoom[];
  mohFiles: MOHFile[];
  queues: CallQueue[];
  ivrMenus: IVRMenu[];
  activeChannels: ActiveChannel[];
  cdrRecords: CDRRecord[];
  backups: BackupArchive[];
  pendingReload: boolean;
  toasts: Toast[];

  showToast: (type: Toast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  applyAsteriskConfig: () => Promise<boolean>;
  restartService: (serviceName: keyof SystemMetrics['services']) => void;

  loadingExtensions: boolean;
  fetchExtensions: (silent?: boolean) => Promise<void>;

  addExtension: (ext: NewExtension) => Promise<boolean>;
  updateExtension: (id: string, ext: Partial<Extension>) => Promise<boolean>;
  deleteExtension: (id: string) => Promise<boolean>;
  toggleExtensionStatus: (id: string) => Promise<boolean>;

  updateDialplanRange: (
    id: number,
    range_start: number,
    range_end: number,
    description: string
  ) => void;

  fetchRoutingRules: () => Promise<void>;
  addRoutingRule: (rule: Omit<RoutingRule, 'id'>) => Promise<boolean>;
  deleteRoutingRule: (id: string) => Promise<boolean>;

  updateCallForwarding: (cf: CallForwarding) => void;

  addVoicemail: (vm: VoicemailBox) => void;
  updateVoicemail: (mailbox_number: string, vm: Partial<VoicemailBox>) => void;
  addConference: (conf: Omit<ConferenceRoom, 'current_participants'>) => void;
  deleteConference: (room_number: string) => void;
  uploadMOH: (file: File, className: string) => void;
  deleteMOH: (id: string) => void;

  addQueue: (
    queue: Omit<
      CallQueue,
      | 'id'
      | 'active_callers'
      | 'calls_completed_today'
      | 'calls_abandoned_today'
      | 'avg_wait_seconds'
    >
  ) => void;

  updateQueue: (id: string, queue: Partial<CallQueue>) => void;
  deleteQueue: (id: string) => void;
  addAgentToQueue: (
    queueId: string,
    extension_number: string,
    penalty: number
  ) => void;
  removeAgentFromQueue: (queueId: string, extension_number: string) => void;

  saveIVRMenu: (menu: IVRMenu) => void;
  deleteIVRMenu: (id: string) => void;

  hangupChannel: (channel_id: string) => void;

  createBackup: (type: BackupArchive['type']) => void;
  restoreBackup: (id: string) => void;
  deleteBackup: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [systemMetrics, setSystemMetrics] =
    useState<SystemMetrics>(initialSystemMetrics);

  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loadingExtensions, setLoadingExtensions] = useState<boolean>(true);

  const extensionsFetchInProgress = useRef(false);
  const channelsFetchInProgress = useRef(false);
  const cdrFetchInProgress = useRef(false);
  const routingRulesFetchInProgress = useRef(false);

  const [dialplanRanges, setDialplanRanges] =
    useState<DialplanRange[]>(initialDialplanRanges);

  // Routing rules are loaded exclusively from SQLite.
  const [routingRules, setRoutingRules] =
    useState<RoutingRule[]>([]);

  const [callForwardingList, setCallForwardingList] =
    useState<CallForwarding[]>(initialCallForwarding);

  const [voicemails, setVoicemails] =
    useState<VoicemailBox[]>(initialVoicemails);

  const [conferences, setConferences] =
    useState<ConferenceRoom[]>(initialConferences);

  const [mohFiles, setMohFiles] =
    useState<MOHFile[]>(initialMOHFiles);

  const [queues, setQueues] =
    useState<CallQueue[]>(initialQueues);

  const [ivrMenus, setIvrMenus] =
    useState<IVRMenu[]>(initialIVRMenus);

  // Live channels come from Asterisk AMI.
  const [activeChannels, setActiveChannels] =
    useState<ActiveChannel[]>([]);

  // CDR records come exclusively from the backend.
  const [cdrRecords, setCdrRecords] =
    useState<CDRRecord[]>([]);

  const [backups, setBackups] =
    useState<BackupArchive[]>(initialBackups);

  const [pendingReload, setPendingReload] =
    useState<boolean>(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast notifications.
  const showToast = (
    type: Toast['type'],
    title: string,
    message: string
  ) => {
    const id =
      Date.now().toString() +
      Math.random().toString(36).slice(2, 7);

    setToasts((prev) => [
      ...prev,
      { id, type, title, message }
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((toast) => toast.id !== id)
      );
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  };

  // Fetch extensions from the real backend.
  const fetchExtensions = async (
    silent = false
  ): Promise<void> => {
    if (extensionsFetchInProgress.current) {
      return;
    }

    extensionsFetchInProgress.current = true;

    if (!silent) {
      setLoadingExtensions(true);
    }

    try {
      const response = await extensionsApi.getAll();

      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(
          response?.error?.message ||
          'Backend returned an invalid extensions response.'
        );
      }

      setExtensions(response.data);

    } catch (error) {
      console.error('[Extensions] Fetch failed:', error);

      if (!silent) {
        showToast(
          'error',
          'Extensions Loading Failed',
          getErrorMessage(error)
        );
      }

      throw error;

    } finally {
      extensionsFetchInProgress.current = false;

      if (!silent) {
        setLoadingExtensions(false);
      }
    }
  };

  // Fetch routing rules from SQLite through the backend.
  const fetchRoutingRules = async (): Promise<void> => {
    if (routingRulesFetchInProgress.current) {
      return;
    }

    routingRulesFetchInProgress.current = true;

    try {
      const response = await dialplanApi.getRules();

      if (
        !response?.success ||
        !Array.isArray(response.data)
      ) {
        throw new Error(
          response?.error?.message ||
          'Backend returned an invalid routing rules response.'
        );
      }

      // An empty array is valid.
      // It means there are no saved routing rules.
      setRoutingRules(response.data);

      console.log(
        `[Dialplan] Successfully loaded ${response.data.length} routing rules.`
      );

    } catch (error) {
      console.error(
        '[Dialplan] Routing rules fetch failed:',
        error
      );

      showToast(
        'error',
        'Routing Rules Loading Failed',
        getErrorMessage(error)
      );

      throw error;

    } finally {
      routingRulesFetchInProgress.current = false;
    }
  };

  // Fetch live channels from Asterisk AMI.
  const fetchLiveChannels = async (): Promise<void> => {
    if (channelsFetchInProgress.current) {
      return;
    }

    channelsFetchInProgress.current = true;

    try {
      const response = await monitoringApi.getLiveChannels();

      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(
          response?.error?.message ||
          'Invalid live channels response.'
        );
      }

      setActiveChannels(response.data);

    } catch (error) {
      console.error(
        '[Monitoring] Live channels fetch failed:',
        error
      );

    } finally {
      channelsFetchInProgress.current = false;
    }
  };

  // Fetch real CDR records from the backend.
  const fetchCDRRecords = async (): Promise<void> => {
    if (cdrFetchInProgress.current) {
      return;
    }

    cdrFetchInProgress.current = true;

    try {
      // Fetch up to 1000 real Asterisk CDR records.
      const response = await cdrApi.getRecords({
        page: 1,
        limit: 1000
      });

      if (
        !response?.success ||
        !response.data ||
        !Array.isArray(response.data.records)
      ) {
        throw new Error(
          response?.error?.message ||
          'Invalid CDR response from backend.'
        );
      }

      // Replace the current records every time.
      // An empty array is valid and clears old records.
      setCdrRecords(response.data.records);

      console.log(
        `[CDR] Successfully loaded ${response.data.records.length} records.`
      );

    } catch (error) {
      console.error('[CDR] Fetch failed:', error);

    } finally {
      cdrFetchInProgress.current = false;
    }
  };

  // Initial data loading and automatic refresh.
  useEffect(() => {
    // Load real extensions.
    fetchExtensions().catch(() => {
      // Error already handled by fetchExtensions.
    });

    // Load routing rules from SQLite.
    fetchRoutingRules().catch(() => {
      // Error already handled by fetchRoutingRules.
    });

    // Load live channels immediately.
    fetchLiveChannels();

    // Load CDR records immediately.
    fetchCDRRecords();

    // Load dialplan ranges.
    dialplanApi.getRanges()
      .then((response) => {
        if (
          response?.success &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setDialplanRanges(response.data);
        }
      })
      .catch((error) => {
        console.error('[Dialplan] Fetch failed:', error);
      });

    // Load call queues.
    callCenterApi.getQueues()
      .then((response) => {
        if (
          response?.success &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setQueues(response.data);
        }
      })
      .catch((error) => {
        console.error('[Queues] Fetch failed:', error);
      });

    // Load IVR menus.
    ivrApi.getAll()
      .then((response) => {
        if (
          response?.success &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setIvrMenus(response.data);
        }
      })
      .catch((error) => {
        console.error('[IVR] Fetch failed:', error);
      });

    // Refresh extension registration every 3 seconds.
    const extensionPollingInterval = setInterval(() => {
      fetchExtensions(true).catch(() => {
        // Silent polling failure.
      });
    }, 3000);

    // Refresh live Asterisk channels every 3 seconds.
    const channelsPollingInterval = setInterval(() => {
      fetchLiveChannels();
    }, 3000);

    // Refresh CDR records every 3 seconds.
    const cdrPollingInterval = setInterval(() => {
      fetchCDRRecords();
    }, 3000);

    // System metrics are still simulated.
    const metricsInterval = setInterval(() => {
      setSystemMetrics((prev) => ({
        ...prev,

        cpu: {
          ...prev.cpu,
          usage_percent: Math.min(
            85,
            Math.max(
              12,
              Math.round(
                (
                  prev.cpu.usage_percent +
                  (Math.random() * 6 - 3)
                ) * 10
              ) / 10
            )
          )
        },

        memory: {
          ...prev.memory,
          used_mb: Math.min(
            3800,
            Math.max(
              1400,
              prev.memory.used_mb +
              Math.floor(Math.random() * 20 - 10)
            )
          )
        }
      }));
    }, 4000);

    return () => {
      clearInterval(extensionPollingInterval);
      clearInterval(channelsPollingInterval);
      clearInterval(cdrPollingInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  // Apply actual PJSIP configuration through the backend.
  const applyAsteriskConfig = async (): Promise<boolean> => {
    try {
      const response = await extensionsApi.applyConfig();

      if (!response?.success) {
        throw new Error(
          response?.error?.message ||
          'Asterisk configuration reload failed.'
        );
      }

      setPendingReload(false);

      showToast(
        'success',
        'Asterisk Reloaded',
        'PJSIP configuration reloaded successfully through the backend.'
      );

      return true;

    } catch (error) {
      console.error('[Asterisk] Reload failed:', error);

      showToast(
        'error',
        'Asterisk Reload Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  // This action is still a local simulation.
  const restartService = (
    serviceName: keyof SystemMetrics['services']
  ) => {
    setSystemMetrics((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceName]: 'stopped'
      }
    }));

    showToast(
      'warning',
      `Restarting ${serviceName}`,
      'Service restart is simulated.'
    );

    setTimeout(() => {
      setSystemMetrics((prev) => ({
        ...prev,
        services: {
          ...prev.services,
          [serviceName]: 'running'
        }
      }));

      showToast(
        'success',
        `${serviceName} Online`,
        'The simulated service status is now running.'
      );
    }, 1500);
  };

  // Extensions CRUD.

  const addExtension = async (
    extData: NewExtension
  ): Promise<boolean> => {
    try {
      const response = await extensionsApi.create(extData);

      if (!response?.success) {
        throw new Error(
          response?.error?.message ||
          'Backend rejected the extension creation.'
        );
      }

      await fetchExtensions();

      setPendingReload(true);

      showToast(
        'success',
        'Extension Created',
        `Extension ${extData.extension_number} was created in Asterisk and SQLite.`
      );

      return true;

    } catch (error) {
      console.error('[Extensions] Create failed:', error);

      showToast(
        'error',
        'Extension Creation Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  const updateExtension = async (
    id: string,
    extPartial: Partial<Extension>
  ): Promise<boolean> => {
    try {
      const response = await extensionsApi.update(
        id,
        extPartial
      );

      if (!response?.success) {
        throw new Error(
          response?.error?.message ||
          'Backend rejected the extension update.'
        );
      }

      await fetchExtensions();

      setPendingReload(true);

      showToast(
        'success',
        'Extension Updated',
        'Extension metadata was updated successfully.'
      );

      return true;

    } catch (error) {
      console.error('[Extensions] Update failed:', error);

      showToast(
        'error',
        'Extension Update Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  const deleteExtension = async (
    id: string
  ): Promise<boolean> => {
    try {
      const response = await extensionsApi.delete(id);

      if (!response?.success) {
        throw new Error(
          response?.error?.message ||
          'Backend rejected the extension deletion.'
        );
      }

      await fetchExtensions();

      setPendingReload(true);

      showToast(
        'success',
        'Extension Deleted',
        'Extension was deleted from Asterisk and SQLite.'
      );

      return true;

    } catch (error) {
      console.error('[Extensions] Delete failed:', error);

      showToast(
        'error',
        'Extension Deletion Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  const toggleExtensionStatus = async (
    id: string
  ): Promise<boolean> => {
    try {
      const response = await extensionsApi.toggleStatus(id);

      if (!response?.success) {
        throw new Error(
          response?.error?.message ||
          'Backend rejected the status change.'
        );
      }

      await fetchExtensions();

      setPendingReload(true);

      showToast(
        'success',
        'Extension Status Updated',
        'Administrative status was updated in SQLite. This does not unregister the SIP endpoint.'
      );

      return true;

    } catch (error) {
      console.error(
        '[Extensions] Status update failed:',
        error
      );

      showToast(
        'error',
        'Status Update Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  // Dialplan and routing rules.

  const updateDialplanRange = (
    id: number,
    range_start: number,
    range_end: number,
    description: string
  ) => {
    setDialplanRanges((prev) =>
      prev.map((range) =>
        range.id === id
          ? {
              ...range,
              range_start,
              range_end,
              description
            }
          : range
      )
    );

    setPendingReload(true);

    showToast(
      'success',
      'Dialplan Range Updated',
      'Department numbering range saved locally.'
    );
  };

  // Create a routing rule in SQLite through the backend.
  const addRoutingRule = async (
    rule: Omit<RoutingRule, 'id'>
  ): Promise<boolean> => {
    try {
      const response = await dialplanApi.createRule(rule);

      if (!response?.success || !response.data) {
        throw new Error(
          response?.error?.message ||
          'Backend rejected the routing rule creation.'
        );
      }

      // Reload the list from SQLite.
      await fetchRoutingRules();

      setPendingReload(true);

      showToast(
        'success',
        'Routing Rule Created',
        `Rule "${rule.name}" was saved in SQLite.`
      );

      return true;

    } catch (error) {
      console.error(
        '[Dialplan] Routing rule creation failed:',
        error
      );

      showToast(
        'error',
        'Routing Rule Creation Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  // Delete a routing rule from SQLite through the backend.
  const deleteRoutingRule = async (
    id: string
  ): Promise<boolean> => {
    try {
      const response = await dialplanApi.deleteRule(id);

      if (!response?.success) {
        throw new Error(
          response?.error?.message ||
          'Backend rejected the routing rule deletion.'
        );
      }

      // Reload the list from SQLite after successful deletion.
      await fetchRoutingRules();

      setPendingReload(true);

      showToast(
        'success',
        'Routing Rule Deleted',
        'Routing rule was permanently deleted from SQLite.'
      );

      return true;

    } catch (error) {
      console.error(
        '[Dialplan] Routing rule deletion failed:',
        error
      );

      showToast(
        'error',
        'Routing Rule Deletion Failed',
        getErrorMessage(error)
      );

      return false;
    }
  };

  const updateCallForwarding = (
    cf: CallForwarding
  ) => {
    setCallForwardingList((prev) => {
      const index = prev.findIndex(
        (item) =>
          item.extension_number === cf.extension_number
      );

      if (index >= 0) {
        const next = [...prev];
        next[index] = cf;
        return next;
      }

      return [...prev, cf];
    });

    setPendingReload(true);

    showToast(
      'success',
      'Forwarding Updated',
      `Forwarding for ${cf.extension_number} saved locally.`
    );
  };

  // Voicemail and conference management.

  const addVoicemail = (vm: VoicemailBox) => {
    setVoicemails((prev) => [
      ...prev,
      vm
    ]);

    setPendingReload(true);

    showToast(
      'success',
      'Voicemail Configured',
      `Mailbox ${vm.mailbox_number} added locally.`
    );
  };

  const updateVoicemail = (
    mailbox_number: string,
    vm: Partial<VoicemailBox>
  ) => {
    setVoicemails((prev) =>
      prev.map((item) =>
        item.mailbox_number === mailbox_number
          ? { ...item, ...vm }
          : item
      )
    );

    setPendingReload(true);

    showToast(
      'success',
      'Voicemail Updated',
      `Mailbox ${mailbox_number} updated locally.`
    );
  };

  const addConference = (
    conf: Omit<ConferenceRoom, 'current_participants'>
  ) => {
    const newConf: ConferenceRoom = {
      ...conf,
      current_participants: 0
    };

    setConferences((prev) => [
      ...prev,
      newConf
    ]);

    setPendingReload(true);

    showToast(
      'success',
      'Conference Room Created',
      `Room ${conf.room_number} configured locally.`
    );
  };

  const deleteConference = (
    room_number: string
  ) => {
    setConferences((prev) =>
      prev.filter(
        (conference) =>
          conference.room_number !== room_number
      )
    );

    setPendingReload(true);

    showToast(
      'warning',
      'Conference Deleted',
      `Room ${room_number} removed locally.`
    );
  };

  // Music on Hold.

  const uploadMOH = (
    file: File,
    className: string
  ) => {
    const newMOH: MOHFile = {
      id: `moh-${Date.now()}`,
      filename: file.name,
      class_name: className,
      duration_seconds: 180,
      filesize_kb: Math.round(file.size / 1024),
      uploaded_at: new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19)
    };

    setMohFiles((prev) => [
      ...prev,
      newMOH
    ]);

    setPendingReload(true);

    showToast(
      'success',
      'Audio Track Added',
      `${file.name} added locally. File deployment is not implemented.`
    );
  };

  const deleteMOH = (id: string) => {
    setMohFiles((prev) =>
      prev.filter((file) => file.id !== id)
    );

    showToast(
      'info',
      'MOH Track Removed',
      'MOH entry removed locally.'
    );
  };

  // Call center queues.

  const addQueue = (
    queueData: Omit<
      CallQueue,
      | 'id'
      | 'active_callers'
      | 'calls_completed_today'
      | 'calls_abandoned_today'
      | 'avg_wait_seconds'
    >
  ) => {
    const newQueue: CallQueue = {
      ...queueData,
      id: `queue-${queueData.queue_name}`,
      active_callers: 0,
      calls_completed_today: 0,
      calls_abandoned_today: 0,
      avg_wait_seconds: 0
    };

    setQueues((prev) => [
      ...prev,
      newQueue
    ]);

    setPendingReload(true);

    showToast(
      'success',
      'Call Queue Created',
      `Queue "${queueData.display_name}" added locally.`
    );
  };

  const updateQueue = (
    id: string,
    queuePartial: Partial<CallQueue>
  ) => {
    setQueues((prev) =>
      prev.map((queue) =>
        queue.id === id
          ? { ...queue, ...queuePartial }
          : queue
      )
    );

    setPendingReload(true);

    showToast(
      'info',
      'Queue Updated',
      'Queue updated locally.'
    );
  };

  const deleteQueue = (id: string) => {
    setQueues((prev) =>
      prev.filter((queue) => queue.id !== id)
    );

    setPendingReload(true);

    showToast(
      'warning',
      'Queue Removed',
      'Queue removed locally.'
    );
  };

  const addAgentToQueue = (
    queueId: string,
    extension_number: string,
    penalty: number
  ) => {
    const extension = extensions.find(
      (item) =>
        item.extension_number === extension_number
    );

    setQueues((prev) =>
      prev.map((queue) => {
        if (queue.id !== queueId) {
          return queue;
        }

        const exists = queue.agents.some(
          (agent) =>
            agent.extension_number === extension_number
        );

        if (exists) {
          return queue;
        }

        return {
          ...queue,
          agents: [
            ...queue.agents,
            {
              extension_number,
              agent_name: extension
                ? extension.user_name
                : `Ext ${extension_number}`,
              penalty,
              state: 'available',
              calls_taken: 0
            }
          ]
        };
      })
    );

    setPendingReload(true);

    showToast(
      'success',
      'Agent Assigned',
      `Agent ${extension_number} added locally.`
    );
  };

  const removeAgentFromQueue = (
    queueId: string,
    extension_number: string
  ) => {
    setQueues((prev) =>
      prev.map((queue) =>
        queue.id === queueId
          ? {
              ...queue,
              agents: queue.agents.filter(
                (agent) =>
                  agent.extension_number !== extension_number
              )
            }
          : queue
      )
    );

    setPendingReload(true);

    showToast(
      'info',
      'Agent Removed',
      `Agent ${extension_number} removed locally.`
    );
  };

  // IVR.

  const saveIVRMenu = (menu: IVRMenu) => {
    setIvrMenus((prev) => {
      const index = prev.findIndex(
        (item) => item.id === menu.id
      );

      if (index >= 0) {
        const next = [...prev];
        next[index] = menu;
        return next;
      }

      return [...prev, menu];
    });

    setPendingReload(true);

    showToast(
      'success',
      'IVR Menu Saved',
      `Menu "${menu.name}" saved locally.`
    );
  };

  const deleteIVRMenu = (id: string) => {
    setIvrMenus((prev) =>
      prev.filter((menu) => menu.id !== id)
    );

    setPendingReload(true);

    showToast(
      'warning',
      'IVR Deleted',
      'IVR menu removed locally.'
    );
  };

  // Hangup is not implemented yet.
  const hangupChannel = (channel_id: string) => {
    showToast(
      'warning',
      'Hangup Not Implemented',
      `Channel ${channel_id} was not terminated.`
    );
  };

  // Backup operations are still local simulations.

  const createBackup = (
    type: BackupArchive['type']
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newBackup: BackupArchive = {
      id: `bak-${Date.now()}`,
      filename: `asterisk_appliance_${type}_${dateStr}.tar.gz`,
      size_mb:
        type === 'full'
          ? 145.2
          : type === 'config_only'
            ? 14.1
            : 38.6,
      created_at: now
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19),
      type,
      status: 'ready'
    };

    setBackups((prev) => [
      newBackup,
      ...prev
    ]);

    showToast(
      'warning',
      'Backup Simulation',
      `Backup record ${newBackup.filename} was created locally. No archive was written to disk.`
    );
  };

  const restoreBackup = (id: string) => {
    const target = backups.find(
      (backup) => backup.id === id
    );

    showToast(
      'warning',
      'Restore Not Implemented',
      `No restore was performed for ${target?.filename || id}.`
    );
  };

  const deleteBackup = (id: string) => {
    setBackups((prev) =>
      prev.filter((backup) => backup.id !== id)
    );

    showToast(
      'warning',
      'Backup Entry Removed',
      'Only the local entry was removed. No disk archive was deleted.'
    );
  };

  return (
    <AppContext.Provider
      value={{
        systemMetrics,
        extensions,
        loadingExtensions,
        fetchExtensions,
        dialplanRanges,
        routingRules,
        fetchRoutingRules,
        callForwardingList,
        voicemails,
        conferences,
        mohFiles,
        queues,
        ivrMenus,
        activeChannels,
        cdrRecords,
        backups,
        pendingReload,
        toasts,
        showToast,
        removeToast,
        applyAsteriskConfig,
        restartService,
        addExtension,
        updateExtension,
        deleteExtension,
        toggleExtensionStatus,
        updateDialplanRange,
        addRoutingRule,
        deleteRoutingRule,
        updateCallForwarding,
        addVoicemail,
        updateVoicemail,
        addConference,
        deleteConference,
        uploadMOH,
        deleteMOH,
        addQueue,
        updateQueue,
        deleteQueue,
        addAgentToQueue,
        removeAgentFromQueue,
        saveIVRMenu,
        deleteIVRMenu,
        hangupChannel,
        createBackup,
        restoreBackup,
        deleteBackup
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};

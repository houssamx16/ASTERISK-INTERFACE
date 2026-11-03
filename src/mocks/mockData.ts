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

export const initialSystemMetrics: SystemMetrics = {
  cpu: {
    usage_percent: 24.5,
    cores: 4,
    temperature_c: 46
  },
  memory: {
    total_mb: 4096,
    used_mb: 1840,
    usage_percent: 44.9
  },
  disk: {
    total_gb: 64.0,
    used_gb: 21.4,
    usage_percent: 33.4
  },
  services: {
    asterisk: 'running',
    pjsip: 'running',
    mariadb: 'running',
    web_server: 'running'
  },
  uptime_seconds: 354890,
  asterisk_version: 'Asterisk 20.9.2 LTS (PJSIP)'
};

export const initialExtensions: Extension[] = [
  // 100-199: Administration
  {
    id: 'ext-101',
    extension_number: '101',
    sip_password: 'passAdmin101!',
    caller_id: 'Directeur General <101>',
    user_id: 1,
    user_name: 'Dr. Mohamed Larbi',
    user_email: 'm.larbi@telephony.local',
    department: 'Administration',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.101:5060',
      user_agent: 'Grandstream GXP2170 1.0.11.16',
      latency_ms: 8,
      last_registered: '2026-10-17 14:10:22'
    },
    voicemail_enabled: true,
    webrtc_enabled: false,
    max_contacts: 1
  },
  {
    id: 'ext-102',
    extension_number: '102',
    sip_password: 'passAdmin102!',
    caller_id: 'Secrétariat Général <102>',
    user_id: 2,
    user_name: 'Amina Mansouri',
    user_email: 'a.mansouri@telephony.local',
    department: 'Administration',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.102:5060',
      user_agent: 'Yealink SIP-T46U 108.86.0.70',
      latency_ms: 11,
      last_registered: '2026-10-17 15:02:11'
    },
    voicemail_enabled: true,
    webrtc_enabled: true,
    max_contacts: 2
  },
  {
    id: 'ext-103',
    extension_number: '103',
    sip_password: 'passAdmin103!',
    caller_id: 'Ressources Humaines <103>',
    user_id: 3,
    user_name: 'Karim Hadj',
    user_email: 'k.hadj@telephony.local',
    department: 'Administration',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'offline',
      ip_address: '192.168.1.103:5060',
      user_agent: 'MicroSIP/3.21.3',
      latency_ms: 0,
      last_registered: '2026-10-16 18:30:00'
    },
    voicemail_enabled: true,
    webrtc_enabled: false,
    max_contacts: 1
  },

  // 200-299: Finance
  {
    id: 'ext-201',
    extension_number: '201',
    sip_password: 'passFinance201!',
    caller_id: 'Comptabilité Générale <201>',
    user_id: 4,
    user_name: 'Fatima Zohra',
    user_email: 'f.zohra@telephony.local',
    department: 'Finance',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.120:5060',
      user_agent: 'Cisco CP-7841 12.8.1',
      latency_ms: 14,
      last_registered: '2026-10-17 12:45:10'
    },
    voicemail_enabled: true,
    webrtc_enabled: false,
    max_contacts: 1
  },
  {
    id: 'ext-202',
    extension_number: '202',
    sip_password: 'passFinance202!',
    caller_id: 'Auditeur Financier <202>',
    user_id: 5,
    user_name: 'Youcef Benali',
    user_email: 'y.benali@telephony.local',
    department: 'Finance',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'inactive',
    registration: {
      status: 'offline',
      ip_address: '0.0.0.0',
      user_agent: 'None',
      latency_ms: 0,
      last_registered: 'Never'
    },
    voicemail_enabled: false,
    webrtc_enabled: false,
    max_contacts: 1
  },

  // 300-399: IT
  {
    id: 'ext-301',
    extension_number: '301',
    sip_password: 'passIT301!',
    caller_id: 'Admin Réseau & VoIP <301>',
    user_id: 6,
    user_name: 'Tariq Brahimi',
    user_email: 't.brahimi@telephony.local',
    department: 'IT',
    transport: 'transport-tls',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.150:5061',
      user_agent: 'Linphone Android 5.2.1',
      latency_ms: 19,
      last_registered: '2026-10-17 15:20:00'
    },
    voicemail_enabled: true,
    webrtc_enabled: true,
    max_contacts: 3
  },
  {
    id: 'ext-302',
    extension_number: '302',
    sip_password: 'passIT302!',
    caller_id: 'Support Systèmes IT <302>',
    user_id: 7,
    user_name: 'Nadia Saidi',
    user_email: 'n.saidi@telephony.local',
    department: 'IT',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.151:5060',
      user_agent: 'Zoiper v5.5.15',
      latency_ms: 7,
      last_registered: '2026-10-17 13:10:45'
    },
    voicemail_enabled: true,
    webrtc_enabled: false,
    max_contacts: 1
  },

  // 400-499: Customer Service
  {
    id: 'ext-401',
    extension_number: '401',
    sip_password: 'passSupport401!',
    caller_id: 'Agent Support 1 <401>',
    user_id: 8,
    user_name: 'Samir Meziane',
    user_email: 's.meziane@telephony.local',
    department: 'Customer Service',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.180:5060',
      user_agent: 'Yealink SIP-T31P 124.86.0.40',
      latency_ms: 9,
      last_registered: '2026-10-17 08:30:12'
    },
    voicemail_enabled: true,
    webrtc_enabled: true,
    max_contacts: 1
  },
  {
    id: 'ext-402',
    extension_number: '402',
    sip_password: 'passSupport402!',
    caller_id: 'Agent Support 2 <402>',
    user_id: 9,
    user_name: 'Ines Khelif',
    user_email: 'i.khelif@telephony.local',
    department: 'Customer Service',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.181:5060',
      user_agent: 'Yealink SIP-T31P 124.86.0.40',
      latency_ms: 10,
      last_registered: '2026-10-17 08:35:20'
    },
    voicemail_enabled: true,
    webrtc_enabled: true,
    max_contacts: 1
  },

  // 500-599: Management
  {
    id: 'ext-501',
    extension_number: '501',
    sip_password: 'passMgmt501!',
    caller_id: 'Directeur Général Adjoint <501>',
    user_id: 10,
    user_name: 'Sofiane Boudiaf',
    user_email: 's.boudiaf@telephony.local',
    department: 'Management',
    transport: 'transport-udp',
    context: 'from-internal',
    status: 'active',
    registration: {
      status: 'registered',
      ip_address: '192.168.1.199:5060',
      user_agent: 'Polycom VVX 450 6.4.2',
      latency_ms: 15,
      last_registered: '2026-10-17 11:15:00'
    },
    voicemail_enabled: true,
    webrtc_enabled: false,
    max_contacts: 1
  }
];

export const initialDialplanRanges: DialplanRange[] = [
  {
    id: 1,
    department: 'Administration',
    range_start: 100,
    range_end: 199,
    allocated_count: 3,
    description: 'Postes de direction, secrétariat et ressources humaines'
  },
  {
    id: 2,
    department: 'Finance',
    range_start: 200,
    range_end: 299,
    allocated_count: 2,
    description: 'Comptabilité, facturation, trésorerie et audit'
  },
  {
    id: 3,
    department: 'IT',
    range_start: 300,
    range_end: 399,
    allocated_count: 2,
    description: 'Support technique interne, admins systèmes et télécoms'
  },
  {
    id: 4,
    department: 'Customer Service',
    range_start: 400,
    range_end: 499,
    allocated_count: 2,
    description: 'Agents centre d appel, support client et hotline'
  },
  {
    id: 5,
    department: 'Management',
    range_start: 500,
    range_end: 599,
    allocated_count: 1,
    description: 'Comité de direction et chefs de départements'
  }
];

export const initialRoutingRules: RoutingRule[] = [
  {
    id: 'rule-1',
    name: 'Appels Internes Autorisés',
    pattern: '_[1-5]XX',
    description: 'Autoriser la communication bilatérale entre tous les services internes',
    action: 'allow',
    applies_to: 'all'
  },
  {
    id: 'rule-2',
    name: 'Interdiction Appels Internationaux pour Stagiaires',
    pattern: '_00.',
    description: 'Bloquer les appels vers l international pour les postes du Customer Service sans code PIN',
    action: 'require_pin',
    pin_code: '4589',
    applies_to: 'department',
    target_id: 'Customer Service'
  },
  {
    id: 'rule-3',
    name: 'Accès Ligne Directe Direction',
    pattern: '_0[5-7]XXXXXXXX',
    description: 'Accès sortant GSM national prioritaire pour le Management',
    action: 'allow',
    applies_to: 'department',
    target_id: 'Management'
  }
];

export const initialCallForwarding: CallForwarding[] = [
  {
    extension_number: '101',
    forward_always_enabled: false,
    forward_always_dest: '',
    forward_busy_enabled: true,
    forward_busy_dest: '102',
    forward_no_answer_enabled: true,
    forward_no_answer_dest: 'voicemail',
    timeout_seconds: 20
  },
  {
    extension_number: '102',
    forward_always_enabled: false,
    forward_always_dest: '',
    forward_busy_enabled: true,
    forward_busy_dest: '103',
    forward_no_answer_enabled: true,
    forward_no_answer_dest: 'voicemail',
    timeout_seconds: 15
  },
  {
    extension_number: '401',
    forward_always_enabled: false,
    forward_always_dest: '',
    forward_busy_enabled: false,
    forward_busy_dest: '',
    forward_no_answer_enabled: true,
    forward_no_answer_dest: '402',
    timeout_seconds: 18
  }
];

export const initialVoicemails: VoicemailBox[] = [
  {
    mailbox_number: '101',
    owner_name: 'Dr. Mohamed Larbi',
    pin: '1234',
    email: 'm.larbi@telephony.local',
    attach_audio: true,
    messages_count: 5,
    new_messages_count: 2,
    max_messages: 50
  },
  {
    mailbox_number: '102',
    owner_name: 'Amina Mansouri',
    pin: '1020',
    email: 'a.mansouri@telephony.local',
    attach_audio: true,
    messages_count: 12,
    new_messages_count: 0,
    max_messages: 50
  },
  {
    mailbox_number: '201',
    owner_name: 'Fatima Zohra',
    pin: '2020',
    email: 'f.zohra@telephony.local',
    attach_audio: false,
    messages_count: 1,
    new_messages_count: 1,
    max_messages: 30
  },
  {
    mailbox_number: '301',
    owner_name: 'Tariq Brahimi',
    pin: '3010',
    email: 't.brahimi@telephony.local',
    attach_audio: true,
    messages_count: 0,
    new_messages_count: 0,
    max_messages: 100
  }
];

export const initialConferences: ConferenceRoom[] = [
  {
    room_number: '800',
    name: 'Salle Principale de Direction',
    user_pin: '1234',
    admin_pin: '9876',
    max_members: 30,
    mute_on_join: false,
    record_conference: true,
    current_participants: 3
  },
  {
    room_number: '801',
    name: 'Salle Technique IT & Développeurs',
    user_pin: '0000',
    admin_pin: '3333',
    max_members: 15,
    mute_on_join: true,
    record_conference: false,
    current_participants: 0
  }
];

export const initialMOHFiles: MOHFile[] = [
  {
    id: 'moh-1',
    filename: 'macroform-cold_day.wav',
    class_name: 'default',
    duration_seconds: 182,
    filesize_kb: 3120,
    uploaded_at: '2026-10-15 10:20:00'
  },
  {
    id: 'moh-2',
    filename: 'acoustic-corporate-ambient.wav',
    class_name: 'support_queue',
    duration_seconds: 240,
    filesize_kb: 4210,
    uploaded_at: '2026-10-16 11:15:30'
  }
];

export const initialQueues: CallQueue[] = [
  {
    id: 'queue-support-fr',
    queue_name: 'support_fr',
    display_name: 'Support Technique Client (Hotline)',
    strategy: 'rrmemory',
    timeout_seconds: 30,
    max_callers: 15,
    announce_holdtime: true,
    music_on_hold: 'support_queue',
    active_callers: 2,
    calls_completed_today: 94,
    calls_abandoned_today: 4,
    avg_wait_seconds: 38,
    agents: [
      {
        extension_number: '401',
        agent_name: 'Samir Meziane',
        penalty: 1,
        state: 'on_call',
        calls_taken: 48
      },
      {
        extension_number: '402',
        agent_name: 'Ines Khelif',
        penalty: 1,
        state: 'available',
        calls_taken: 46
      },
      {
        extension_number: '302',
        agent_name: 'Nadia Saidi (Backup IT)',
        penalty: 2,
        state: 'available',
        calls_taken: 8
      }
    ]
  },
  {
    id: 'queue-finance-vip',
    queue_name: 'finance_vip',
    display_name: 'Ligne Directe Comptabilité & Fournisseurs',
    strategy: 'leastrecent',
    timeout_seconds: 20,
    max_callers: 5,
    announce_holdtime: false,
    music_on_hold: 'default',
    active_callers: 0,
    calls_completed_today: 28,
    calls_abandoned_today: 1,
    avg_wait_seconds: 18,
    agents: [
      {
        extension_number: '201',
        agent_name: 'Fatima Zohra',
        penalty: 1,
        state: 'available',
        calls_taken: 28
      }
    ]
  }
];

export const initialIVRMenus: IVRMenu[] = [
  {
    id: 'ivr-main',
    name: 'Serveur Vocal Principal Entreprise',
    extension: '700',
    greeting_audio: 'welcome_prompt_univ_ouargla.wav',
    timeout_seconds: 10,
    max_retries: 3,
    invalid_destination: { type: 'extension', value: '102' },
    timeout_destination: { type: 'extension', value: '102' },
    entries: [
      {
        digit: '1',
        description: 'Direction & Administration Générale',
        destination_type: 'extension',
        destination_value: '101'
      },
      {
        digit: '2',
        description: 'Service Financier et Facturation',
        destination_type: 'extension',
        destination_value: '201'
      },
      {
        digit: '3',
        description: 'Support Client & Assistance Technique',
        destination_type: 'queue',
        destination_value: 'support_fr'
      },
      {
        digit: '9',
        description: 'Salle de Conférence Virtuelle',
        destination_type: 'conference',
        destination_value: '800'
      }
    ]
  }
];

export const initialActiveChannels: ActiveChannel[] = [
  {
    channel_id: 'PJSIP/101-0000004f',
    caller_id: '101',
    caller_name: 'Dr. Mohamed Larbi',
    connected_to: '102',
    callee_name: 'Amina Mansouri',
    duration_seconds: 124,
    state: 'Up',
    codec: 'alaw',
    department: 'Administration'
  },
  {
    channel_id: 'PJSIP/401-0000005a',
    caller_id: '0661234567',
    caller_name: 'Appelant Externe (Client)',
    connected_to: '401',
    callee_name: 'Samir Meziane (Support)',
    duration_seconds: 310,
    state: 'Up',
    codec: 'ulaw',
    department: 'Customer Service'
  },
  {
    channel_id: 'PJSIP/301-0000005c',
    caller_id: '301',
    caller_name: 'Tariq Brahimi',
    connected_to: 'ConfBridge/800',
    callee_name: 'Salle Réunion 800',
    duration_seconds: 45,
    state: 'Up',
    codec: 'opus',
    department: 'IT'
  }
];

export const initialCDRRecords: CDRRecord[] = [
  {
    id: 1042,
    call_date: '2026-10-17 15:42:10',
    caller_id: '101',
    source: '101',
    destination: '102',
    context: 'from-internal',
    duration: 180,
    billable_seconds: 172,
    disposition: 'ANSWERED',
    department: 'Administration',
    recording_url: '/recordings/rec-1042.wav'
  },
  {
    id: 1041,
    call_date: '2026-10-17 15:38:05',
    caller_id: '0555987654',
    source: '0555987654',
    destination: '700',
    context: 'from-trunk',
    duration: 45,
    billable_seconds: 40,
    disposition: 'ANSWERED',
    department: 'IVR / Menu',
    recording_url: '/recordings/rec-1041.wav'
  },
  {
    id: 1040,
    call_date: '2026-10-17 15:30:12',
    caller_id: '201',
    source: '201',
    destination: '202',
    context: 'from-internal',
    duration: 35,
    billable_seconds: 0,
    disposition: 'NO ANSWER',
    department: 'Finance'
  },
  {
    id: 1039,
    call_date: '2026-10-17 15:21:40',
    caller_id: '301',
    source: '301',
    destination: '401',
    context: 'from-internal',
    duration: 95,
    billable_seconds: 90,
    disposition: 'ANSWERED',
    department: 'IT',
    recording_url: '/recordings/rec-1039.wav'
  },
  {
    id: 1038,
    call_date: '2026-10-17 15:15:22',
    caller_id: '0662334455',
    source: '0662334455',
    destination: '400',
    context: 'from-trunk',
    duration: 25,
    billable_seconds: 0,
    disposition: 'BUSY',
    department: 'Customer Service'
  },
  {
    id: 1037,
    call_date: '2026-10-17 14:55:00',
    caller_id: '103',
    source: '103',
    destination: '501',
    context: 'from-internal',
    duration: 215,
    billable_seconds: 210,
    disposition: 'ANSWERED',
    department: 'Administration',
    recording_url: '/recordings/rec-1037.wav'
  },
  {
    id: 1036,
    call_date: '2026-10-17 14:40:19',
    caller_id: '402',
    source: '402',
    destination: '0033140506070',
    context: 'from-internal',
    duration: 10,
    billable_seconds: 0,
    disposition: 'FAILED',
    department: 'Customer Service'
  },
  {
    id: 1035,
    call_date: '2026-10-17 14:20:11',
    caller_id: '501',
    source: '501',
    destination: '800',
    context: 'from-internal',
    duration: 1250,
    billable_seconds: 1245,
    disposition: 'ANSWERED',
    department: 'Management',
    recording_url: '/recordings/rec-1035.wav'
  }
];

export const initialBackups: BackupArchive[] = [
  {
    id: 'bak-20261017-01',
    filename: 'asterisk_appliance_full_2026-10-17.tar.gz',
    size_mb: 142.8,
    created_at: '2026-10-17 04:00:00',
    type: 'full',
    status: 'ready'
  },
  {
    id: 'bak-20261016-01',
    filename: 'asterisk_appliance_full_2026-10-16.tar.gz',
    size_mb: 139.2,
    created_at: '2026-10-16 04:00:00',
    type: 'full',
    status: 'ready'
  },
  {
    id: 'bak-20261015-config',
    filename: 'asterisk_pjsip_dialplan_configs.tar.gz',
    size_mb: 12.4,
    created_at: '2026-10-15 16:30:12',
    type: 'config_only',
    status: 'ready'
  }
];


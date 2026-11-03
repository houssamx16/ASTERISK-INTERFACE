
// Comprehensive TypeScript definitions for Asterisk Appliance Management System

export type AsteriskStatus = 'ONLINE' | 'OFFLINE' | 'RELOAD_NEEDED';
export type RegistrationStatus = 'registered' | 'offline' | 'unreachable';
export type ExtensionStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OPERATOR' | 'USER';
  created_at: string;
}

export interface Extension {
  id: string;
  extension_number: string;

  // Backend never returns the SIP password.
  // It is only provided when creating an extension.
  sip_password?: string;

  caller_id: string;
  user_id: number | null;
  user_name: string;
  user_email: string;

  department: 'Administration' | 'Finance' | 'IT' | 'Customer Service' | 'Management';
  transport: 'transport-udp' | 'transport-tcp' | 'transport-tls';
  context: string;
  status: ExtensionStatus;

  registration: {
    status: RegistrationStatus;
    ip_address: string;
    user_agent: string;
    latency_ms: number;
    last_registered: string;
  };

  voicemail_enabled: boolean;
  webrtc_enabled: boolean;
  max_contacts: number;
}

export interface DialplanRange {
  id: number;
  department: string;
  range_start: number;
  range_end: number;
  allocated_count: number;
  description: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  pattern: string;
  description: string;
  action: 'allow' | 'deny' | 'require_pin';
  pin_code?: string;
  applies_to: 'all' | 'department' | 'extension';
  target_id?: string;
}

export interface CallForwarding {
  extension_number: string;
  forward_always_enabled: boolean;
  forward_always_dest: string;
  forward_busy_enabled: boolean;
  forward_busy_dest: string;
  forward_no_answer_enabled: boolean;
  forward_no_answer_dest: string;
  timeout_seconds: number;
}

export interface VoicemailBox {
  mailbox_number: string;
  owner_name: string;
  pin: string;
  email: string;
  attach_audio: boolean;
  messages_count: number;
  new_messages_count: number;
  max_messages: number;
}

export interface ConferenceRoom {
  room_number: string;
  name: string;
  user_pin: string;
  admin_pin: string;
  max_members: number;
  mute_on_join: boolean;
  record_conference: boolean;
  current_participants: number;
}

export interface MOHFile {
  id: string;
  filename: string;
  class_name: string;
  duration_seconds: number;
  filesize_kb: number;
  uploaded_at: string;
}

export interface QueueAgent {
  extension_number: string;
  agent_name: string;
  penalty: number;
  state: 'available' | 'on_call' | 'paused' | 'offline';
  calls_taken: number;
}

export interface CallQueue {
  id: string;
  queue_name: string;
  display_name: string;
  strategy: 'ringall' | 'leastrecent' | 'fewestcalls' | 'random' | 'rrmemory';
  timeout_seconds: number;
  max_callers: number;
  announce_holdtime: boolean;
  music_on_hold: string;
  agents: QueueAgent[];
  active_callers: number;
  calls_completed_today: number;
  calls_abandoned_today: number;
  avg_wait_seconds: number;
}

export interface IVREntry {
  digit: string;
  description: string;
  destination_type: 'extension' | 'queue' | 'conference' | 'voicemail' | 'hangup';
  destination_value: string;
}

export interface IVRMenu {
  id: string;
  name: string;
  extension: string;
  greeting_audio: string;
  timeout_seconds: number;
  max_retries: number;
  invalid_destination: { type: string; value: string };
  timeout_destination: { type: string; value: string };
  entries: IVREntry[];
}

export interface ActiveChannel {
  channel_id: string;
  caller_id: string;
  caller_name: string;
  connected_to: string;
  callee_name: string;
  duration_seconds: number;
  state: 'Ring' | 'Up' | 'Dialing';
  codec: string;
  department: string;
}

export type CDRDisposition = 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED';

export interface CDRRecord {
  id: number;
  call_date: string;
  caller_id: string;
  source: string;
  destination: string;
  context: string;
  duration: number;
  billable_seconds: number;
  disposition: CDRDisposition;
  department: string;
  recording_url?: string;
}

export interface SystemMetrics {
  cpu: {
    usage_percent: number;
    cores: number;
    temperature_c: number;
  };
  memory: {
    total_mb: number;
    used_mb: number;
    usage_percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    usage_percent: number;
  };
  services: {
    asterisk: 'running' | 'stopped';
    pjsip: 'running' | 'stopped';
    mariadb: 'running' | 'stopped';
    web_server: 'running' | 'stopped';
  };
  uptime_seconds: number;
  asterisk_version: string;
}

export interface BackupArchive {
  id: string;
  filename: string;
  size_mb: number;
  created_at: string;
  type: 'full' | 'config_only' | 'cdr_only';
  status: 'ready' | 'restoring' | 'creating';
}

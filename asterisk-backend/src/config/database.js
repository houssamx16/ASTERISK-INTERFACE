const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'appliance.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize all database schemas matching the API Contract
 */
function initDatabase() {
  db.exec(`
    -- 1. Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'SUPER_ADMIN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. PJSIP Extensions table
    CREATE TABLE IF NOT EXISTS extensions (
      id TEXT PRIMARY KEY,
      extension_number TEXT UNIQUE NOT NULL,
      sip_password TEXT NOT NULL,
      caller_id TEXT NOT NULL,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      user_email TEXT,
      department TEXT NOT NULL,
      transport TEXT DEFAULT 'transport-udp',
      context TEXT DEFAULT 'from-internal',
      status TEXT DEFAULT 'active',
      voicemail_enabled INTEGER DEFAULT 1,
      webrtc_enabled INTEGER DEFAULT 0,
      max_contacts INTEGER DEFAULT 1,
      ip_address TEXT DEFAULT '0.0.0.0',
      user_agent TEXT DEFAULT 'None',
      latency_ms INTEGER DEFAULT 0,
      registration_status TEXT DEFAULT 'offline',
      last_registered TEXT DEFAULT 'Never'
    );

    -- 3. Dialplan ranges
    CREATE TABLE IF NOT EXISTS dialplan_ranges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT UNIQUE NOT NULL,
      range_start INTEGER NOT NULL,
      range_end INTEGER NOT NULL,
      allocated_count INTEGER DEFAULT 0,
      description TEXT
    );

    -- 4. Dialplan routing rules
    CREATE TABLE IF NOT EXISTS routing_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pattern TEXT NOT NULL,
      description TEXT,
      action TEXT DEFAULT 'allow',
      pin_code TEXT,
      applies_to TEXT DEFAULT 'all',
      target_id TEXT
    );

    -- 5. Call Forwarding table
    CREATE TABLE IF NOT EXISTS call_forwarding (
      extension_number TEXT PRIMARY KEY,
      forward_always_enabled INTEGER DEFAULT 0,
      forward_always_dest TEXT DEFAULT '',
      forward_busy_enabled INTEGER DEFAULT 0,
      forward_busy_dest TEXT DEFAULT '',
      forward_no_answer_enabled INTEGER DEFAULT 0,
      forward_no_answer_dest TEXT DEFAULT '',
      timeout_seconds INTEGER DEFAULT 20
    );

    -- 6. Voicemail boxes (voicemail.conf)
    CREATE TABLE IF NOT EXISTS voicemail_boxes (
      mailbox_number TEXT PRIMARY KEY,
      owner_name TEXT NOT NULL,
      pin TEXT NOT NULL,
      email TEXT,
      attach_audio INTEGER DEFAULT 1,
      messages_count INTEGER DEFAULT 0,
      new_messages_count INTEGER DEFAULT 0,
      max_messages INTEGER DEFAULT 50
    );

    -- 7. Conference rooms (confbridge.conf)
    CREATE TABLE IF NOT EXISTS conference_rooms (
      room_number TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_pin TEXT DEFAULT '0000',
      admin_pin TEXT DEFAULT '9999',
      max_members INTEGER DEFAULT 20,
      mute_on_join INTEGER DEFAULT 0,
      record_conference INTEGER DEFAULT 0,
      current_participants INTEGER DEFAULT 0
    );

    -- 8. Music on Hold files (musiconhold.conf)
    CREATE TABLE IF NOT EXISTS moh_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      class_name TEXT DEFAULT 'default',
      duration_seconds INTEGER DEFAULT 180,
      filesize_kb INTEGER DEFAULT 2048,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Call Center Queues (queues.conf)
    CREATE TABLE IF NOT EXISTS queues (
      id TEXT PRIMARY KEY,
      queue_name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      strategy TEXT DEFAULT 'rrmemory',
      timeout_seconds INTEGER DEFAULT 30,
      max_callers INTEGER DEFAULT 10,
      announce_holdtime INTEGER DEFAULT 1,
      music_on_hold TEXT DEFAULT 'default',
      active_callers INTEGER DEFAULT 0,
      calls_completed_today INTEGER DEFAULT 0,
      calls_abandoned_today INTEGER DEFAULT 0,
      avg_wait_seconds INTEGER DEFAULT 0
    );

    -- 10. Queue Agents
    CREATE TABLE IF NOT EXISTS queue_agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue_id TEXT NOT NULL,
      extension_number TEXT NOT NULL,
      penalty INTEGER DEFAULT 1,
      state TEXT DEFAULT 'available',
      calls_taken INTEGER DEFAULT 0,
      FOREIGN KEY(queue_id) REFERENCES queues(id) ON DELETE CASCADE
    );

    -- 11. IVR Menus
    CREATE TABLE IF NOT EXISTS ivr_menus (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      extension TEXT UNIQUE NOT NULL,
      greeting_audio TEXT NOT NULL,
      timeout_seconds INTEGER DEFAULT 10,
      max_retries INTEGER DEFAULT 3,
      invalid_destination_type TEXT DEFAULT 'extension',
      invalid_destination_value TEXT DEFAULT '100',
      timeout_destination_type TEXT DEFAULT 'extension',
      timeout_destination_value TEXT DEFAULT '100'
    );

    -- 12. IVR Key Entries
    CREATE TABLE IF NOT EXISTS ivr_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ivr_id TEXT NOT NULL,
      digit TEXT NOT NULL,
      description TEXT NOT NULL,
      destination_type TEXT NOT NULL,
      destination_value TEXT NOT NULL,
      FOREIGN KEY(ivr_id) REFERENCES ivr_menus(id) ON DELETE CASCADE
    );

    -- 13. Call Detail Records (CDR)
    CREATE TABLE IF NOT EXISTS cdr_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      caller_id TEXT NOT NULL,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      context TEXT DEFAULT 'from-internal',
      duration INTEGER DEFAULT 0,
      billable_seconds INTEGER DEFAULT 0,
      disposition TEXT DEFAULT 'ANSWERED',
      department TEXT DEFAULT 'General',
      recording_url TEXT
    );

    -- 14. Backups archive table
    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      size_mb REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT DEFAULT 'full',
      status TEXT DEFAULT 'ready'
    );
  `);

  seedDefaultData();
}

/**
 * Seed initial administrative user and sample university telephony data
 */
function seedDefaultData() {
  // 1. Seed Admin user
  const adminCheck = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminCheck) {
    const passwordHash = bcrypt.hashSync('password', 10);
    db.prepare(`
      INSERT INTO users (username, password_hash, name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', passwordHash, 'Administrateur Principal', 'admin@telephony.local', 'SUPER_ADMIN');
    console.log('✅ Default administrator seeded (user: admin / pass: password)');
  }

  // 2. Seed Dialplan Ranges if empty
  const rangeCheck = db.prepare('SELECT COUNT(*) as count FROM dialplan_ranges').get();
  if (rangeCheck.count === 0) {
    const ranges = [
      { dept: 'Administration', start: 100, end: 199, alloc: 3, desc: 'Direction, secrétariat et ressources humaines' },
      { dept: 'Finance', start: 200, end: 299, alloc: 2, desc: 'Comptabilité, facturation, trésorerie et audit' },
      { dept: 'IT', start: 300, end: 399, alloc: 2, desc: 'Support technique interne, admins systèmes et télécoms' },
      { dept: 'Customer Service', start: 400, end: 499, alloc: 2, desc: 'Agents centre d appel, support client et hotline' },
      { dept: 'Management', start: 500, end: 599, alloc: 1, desc: 'Comité de direction et chefs de départements' }
    ];
    const insertRange = db.prepare(`
      INSERT INTO dialplan_ranges (department, range_start, range_end, allocated_count, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const r of ranges) {
      insertRange.run(r.dept, r.start, r.end, r.alloc, r.desc);
    }
  }

  // 3. Seed Extensions if empty
  const extCheck = db.prepare('SELECT COUNT(*) as count FROM extensions').get();
  if (extCheck.count === 0) {
    const sampleExtensions = [
      { id: 'ext-101', num: '101', pass: 'passAdmin101!', cid: 'Directeur General <101>', name: 'Dr. Mohamed Larbi', email: 'm.larbi@telephony.local', dept: 'Administration', reg: 'registered', ip: '192.168.1.101:5060', ua: 'Grandstream GXP2170', lat: 8 },
      { id: 'ext-102', num: '102', pass: 'passAdmin102!', cid: 'Secrétariat Général <102>', name: 'Amina Mansouri', email: 'a.mansouri@telephony.local', dept: 'Administration', reg: 'registered', ip: '192.168.1.102:5060', ua: 'Yealink SIP-T46U', lat: 11 },
      { id: 'ext-201', num: '201', pass: 'passFinance201!', cid: 'Comptabilité Générale <201>', name: 'Fatima Zohra', email: 'f.zohra@telephony.local', dept: 'Finance', reg: 'registered', ip: '192.168.1.120:5060', ua: 'Cisco CP-7841', lat: 14 },
      { id: 'ext-301', num: '301', pass: 'passIT301!', cid: 'Admin Réseau & VoIP <301>', name: 'Tariq Brahimi', email: 't.brahimi@telephony.local', dept: 'IT', reg: 'registered', ip: '192.168.1.150:5061', ua: 'Linphone Android', lat: 19 },
      { id: 'ext-401', num: '401', pass: 'passSupport401!', cid: 'Agent Support 1 <401>', name: 'Samir Meziane', email: 's.meziane@telephony.local', dept: 'Customer Service', reg: 'registered', ip: '192.168.1.180:5060', ua: 'Yealink SIP-T31P', lat: 9 },
      { id: 'ext-402', num: '402', pass: 'passSupport402!', cid: 'Agent Support 2 <402>', name: 'Ines Khelif', email: 'i.khelif@telephony.local', dept: 'Customer Service', reg: 'registered', ip: '192.168.1.181:5060', ua: 'Yealink SIP-T31P', lat: 10 },
      { id: 'ext-501', num: '501', pass: 'passMgmt501!', cid: 'Directeur Général Adjoint <501>', name: 'Sofiane Boudiaf', email: 's.boudiaf@telephony.local', dept: 'Management', reg: 'registered', ip: '192.168.1.199:5060', ua: 'Polycom VVX 450', lat: 15 }
    ];

    const insertExt = db.prepare(`
      INSERT INTO extensions (id, extension_number, sip_password, caller_id, user_name, user_email, department, registration_status, ip_address, user_agent, latency_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const e of sampleExtensions) {
      insertExt.run(e.id, e.num, e.pass, e.cid, e.name, e.email, e.dept, e.reg, e.ip, e.ua, e.lat);
    }
  }

  // 4. Seed Call Center Queue if empty
  const queueCheck = db.prepare('SELECT COUNT(*) as count FROM queues').get();
  if (queueCheck.count === 0) {
    db.prepare(`
      INSERT INTO queues (id, queue_name, display_name, strategy, timeout_seconds, max_callers, announce_holdtime, calls_completed_today, calls_abandoned_today, avg_wait_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('queue-support-fr', 'support_fr', 'Support Technique Client (Hotline)', 'rrmemory', 30, 15, 1, 94, 4, 38);

    db.prepare(`
      INSERT INTO queue_agents (queue_id, extension_number, penalty, state, calls_taken)
      VALUES (?, ?, ?, ?, ?)
    `).run('queue-support-fr', '401', 1, 'available', 48);
  }

  // 5. Seed IVR Menu if empty
  const ivrCheck = db.prepare('SELECT COUNT(*) as count FROM ivr_menus').get();
  if (ivrCheck.count === 0) {
    db.prepare(`
      INSERT INTO ivr_menus (id, name, extension, greeting_audio, timeout_seconds, max_retries)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('ivr-main', 'Serveur Vocal Principal Entreprise', '700', 'welcome_prompt_univ_ouargla.wav', 10, 3);

    const insertEntry = db.prepare(`
      INSERT INTO ivr_entries (ivr_id, digit, description, destination_type, destination_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertEntry.run('ivr-main', '1', 'Direction & Administration Générale', 'extension', '101');
    insertEntry.run('ivr-main', '2', 'Service Financier et Facturation', 'extension', '201');
    insertEntry.run('ivr-main', '3', 'Support Client & Assistance Technique', 'queue', 'support_fr');
    insertEntry.run('ivr-main', '9', 'Salle de Conférence Virtuelle', 'conference', '800');
  }

  // 6. Seed CDR if empty
  const cdrCheck = db.prepare('SELECT COUNT(*) as count FROM cdr_records').get();
  if (cdrCheck.count === 0) {
    const insertCdr = db.prepare(`
      INSERT INTO cdr_records (caller_id, source, destination, duration, billable_seconds, disposition, department, recording_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertCdr.run('101', '101', '102', 180, 172, 'ANSWERED', 'Administration', '/recordings/rec-1042.wav');
    insertCdr.run('0555987654', '0555987654', '700', 45, 40, 'ANSWERED', 'IVR / Menu', '/recordings/rec-1041.wav');
    insertCdr.run('201', '201', '202', 35, 0, 'NO ANSWER', 'Finance', null);
    insertCdr.run('301', '301', '401', 95, 90, 'ANSWERED', 'IT', '/recordings/rec-1039.wav');
  }

  // 7. Seed Conference & Voicemail
  const confCheck = db.prepare('SELECT COUNT(*) as count FROM conference_rooms').get();
  if (confCheck.count === 0) {
    db.prepare(`
      INSERT INTO conference_rooms (room_number, name, user_pin, admin_pin, max_members, mute_on_join, record_conference, current_participants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('800', 'Salle Principale de Direction', '1234', '9876', 30, 0, 1, 2);
  }

  const vmCheck = db.prepare('SELECT COUNT(*) as count FROM voicemail_boxes').get();
  if (vmCheck.count === 0) {
    db.prepare(`
      INSERT INTO voicemail_boxes (mailbox_number, owner_name, pin, email, attach_audio, messages_count, new_messages_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('101', 'Dr. Mohamed Larbi', '1234', 'm.larbi@telephony.local', 1, 5, 2);
  }
}

module.exports = {
  db,
  initDatabase
};


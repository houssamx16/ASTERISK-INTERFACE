const { db } = require('../config/database');

const servicesController = {
  getVoicemails: (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM voicemail_boxes').all();
      const formatted = rows.map((r) => ({ ...r, attach_audio: Boolean(r.attach_audio) }));
      return res.status(200).json({ success: true, data: formatted, timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  createVoicemail: (req, res) => {
    try {
      const { mailbox_number, owner_name, pin, email, attach_audio = 1, max_messages = 50 } = req.body;
      db.prepare(`
        INSERT INTO voicemail_boxes (mailbox_number, owner_name, pin, email, attach_audio, max_messages)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(mailbox_number, owner_name, pin, email || '', attach_audio ? 1 : 0, max_messages);
      return res.status(201).json({ success: true, message: 'Boîte vocale créée.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  updateVoicemail: (req, res) => {
    try {
      const { num } = req.params;
      const { pin, email, attach_audio } = req.body;
      db.prepare(`
        UPDATE voicemail_boxes
        SET pin = COALESCE(?, pin),
            email = COALESCE(?, email),
            attach_audio = COALESCE(?, attach_audio)
        WHERE mailbox_number = ?
      `).run(pin, email, attach_audio !== undefined ? (attach_audio ? 1 : 0) : null, num);
      return res.status(200).json({ success: true, message: 'Paramètres voicemail mis à jour.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  getConferences: (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM conference_rooms').all();
      const formatted = rows.map((r) => ({
        ...r,
        mute_on_join: Boolean(r.mute_on_join),
        record_conference: Boolean(r.record_conference)
      }));
      return res.status(200).json({ success: true, data: formatted, timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  createConference: (req, res) => {
    try {
      const { room_number, name, user_pin = '0000', admin_pin = '9999', max_members = 20, mute_on_join = 0, record_conference = 0 } = req.body;
      db.prepare(`
        INSERT INTO conference_rooms (room_number, name, user_pin, admin_pin, max_members, mute_on_join, record_conference)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(room_number, name, user_pin, admin_pin, max_members, mute_on_join ? 1 : 0, record_conference ? 1 : 0);
      return res.status(201).json({ success: true, message: 'Salle de conférence créée.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  deleteConference: (req, res) => {
    try {
      const { num } = req.params;
      db.prepare('DELETE FROM conference_rooms WHERE room_number = ?').run(num);
      return res.status(200).json({ success: true, message: 'Salle supprimée.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  getMOHList: (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM moh_files').all();
      return res.status(200).json({ success: true, data: rows, timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  deleteMOH: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM moh_files WHERE id = ?').run(id);
      return res.status(200).json({ success: true, message: 'Audio MOH supprimé.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};

module.exports = servicesController;


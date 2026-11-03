const { db } = require('../config/database');

const ivrController = {
  getAll: (req, res) => {
    try {
      const menus = db.prepare('SELECT * FROM ivr_menus').all();
      const formatted = menus.map((m) => {
        const entries = db.prepare('SELECT digit, description, destination_type, destination_value FROM ivr_entries WHERE ivr_id = ?').all(m.id);
        return {
          id: m.id,
          name: m.name,
          extension: m.extension,
          greeting_audio: m.greeting_audio,
          timeout_seconds: m.timeout_seconds,
          max_retries: m.max_retries,
          invalid_destination: { type: m.invalid_destination_type, value: m.invalid_destination_value },
          timeout_destination: { type: m.timeout_destination_type, value: m.timeout_destination_value },
          entries
        };
      });

      return res.status(200).json({ success: true, data: formatted, timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  create: (req, res) => {
    try {
      const { id = `ivr-${Date.now()}`, name, extension, greeting_audio, timeout_seconds = 10, max_retries = 3, entries = [] } = req.body;

      db.prepare(`
        INSERT INTO ivr_menus (id, name, extension, greeting_audio, timeout_seconds, max_retries)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, name, extension, greeting_audio, timeout_seconds, max_retries);

      const insertEntry = db.prepare(`
        INSERT INTO ivr_entries (ivr_id, digit, description, destination_type, destination_value)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const ent of entries) {
        insertEntry.run(id, ent.digit, ent.description, ent.destination_type, ent.destination_value);
      }

      return res.status(201).json({ success: true, data: { id, name }, message: 'Menu IVR créé.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM ivr_menus WHERE id = ?').run(id);
      return res.status(200).json({ success: true, message: 'Menu IVR supprimé.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};

module.exports = ivrController;


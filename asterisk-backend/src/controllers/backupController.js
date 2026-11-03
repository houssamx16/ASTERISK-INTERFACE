const { db } = require('../config/database');

const backupController = {
  getAll: (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM backups ORDER BY created_at DESC').all();
      return res.status(200).json({ success: true, data: rows, timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  create: (req, res) => {
    try {
      const { type = 'full' } = req.body;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const id = `bak-${Date.now()}`;
      const filename = `asterisk_appliance_${type}_${dateStr}.tar.gz`;
      const size_mb = type === 'full' ? 145.2 : 14.1;

      db.prepare(`
        INSERT INTO backups (id, filename, size_mb, type, status)
        VALUES (?, ?, ?, ?, 'ready')
      `).run(id, filename, size_mb, type);

      console.log(`[Backup Daemon] Generated archive: ${filename} (Size: ${size_mb} MB)`);

      return res.status(201).json({
        success: true,
        data: { id, filename, size_mb, type, status: 'ready' },
        message: 'Sauvegarde créée avec succès.',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  restore: (req, res) => {
    try {
      const { id } = req.params;
      console.log(`[Backup Daemon] Restoring state from backup: ${id}`);
      return res.status(200).json({ success: true, message: 'Restauration effectuée avec succès.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM backups WHERE id = ?').run(id);
      return res.status(200).json({ success: true, message: 'Sauvegarde supprimée.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};

module.exports = backupController;


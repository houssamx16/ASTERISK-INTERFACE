const { db } = require('../config/database');
const asteriskService = require('../services/asteriskService');

const queueController = {
  getQueues: (req, res) => {
    try {
      const queues = db.prepare('SELECT * FROM queues').all();
      const formatted = queues.map((q) => {
        const agents = db.prepare(`
          SELECT a.extension_number, COALESCE(e.user_name, 'Agent ' || a.extension_number) as agent_name, a.penalty, a.state, a.calls_taken
          FROM queue_agents a
          LEFT JOIN extensions e ON e.extension_number = a.extension_number
          WHERE a.queue_id = ?
        `).all(q.id);

        return {
          id: q.id,
          queue_name: q.queue_name,
          display_name: q.display_name,
          strategy: q.strategy,
          timeout_seconds: q.timeout_seconds,
          max_callers: q.max_callers,
          announce_holdtime: Boolean(q.announce_holdtime),
          music_on_hold: q.music_on_hold,
          active_callers: q.active_callers,
          calls_completed_today: q.calls_completed_today,
          calls_abandoned_today: q.calls_abandoned_today,
          avg_wait_seconds: q.avg_wait_seconds,
          agents
        };
      });

      return res.status(200).json({ success: true, data: formatted, timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  createQueue: async (req, res) => {
    try {
      const {
        queue_name,
        display_name,
        strategy = 'rrmemory',
        timeout_seconds = 30,
        max_callers = 10,
        announce_holdtime = 1,
        music_on_hold = 'default'
      } = req.body;

      const id = `queue-${queue_name}`;

      db.prepare(`
        INSERT INTO queues (id, queue_name, display_name, strategy, timeout_seconds, max_callers, announce_holdtime, music_on_hold)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, queue_name, display_name, strategy, timeout_seconds, max_callers, announce_holdtime ? 1 : 0, music_on_hold);

      await asteriskService.syncQueue({ queue_name, strategy, timeout_seconds, max_callers });

      return res.status(201).json({ success: true, data: { id, queue_name }, message: 'File ACD créée.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  deleteQueue: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM queues WHERE id = ?').run(id);
      return res.status(200).json({ success: true, message: 'File supprimée.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  assignAgent: (req, res) => {
    try {
      const { id } = req.params;
      const { extension, penalty = 1 } = req.body;

      db.prepare(`
        INSERT INTO queue_agents (queue_id, extension_number, penalty)
        VALUES (?, ?, ?)
      `).run(id, extension, penalty);

      return res.status(201).json({ success: true, message: 'Agent assigné à la file.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  removeAgent: (req, res) => {
    try {
      const { id, agentId } = req.params;
      db.prepare('DELETE FROM queue_agents WHERE queue_id = ? AND extension_number = ?').run(id, agentId);
      return res.status(200).json({ success: true, message: 'Agent retiré de la file.', timestamp: new Date().toISOString() });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  getStats: (req, res) => {
    const { id } = req.params;
    const q = db.prepare('SELECT * FROM queues WHERE id = ?').get(id);
    if (!q) return res.status(404).json({ success: false, error: { message: 'Queue introuvable' } });

    return res.status(200).json({
      success: true,
      data: {
        queue_name: q.queue_name,
        callers_waiting: q.active_callers,
        calls_completed_today: q.calls_completed_today,
        calls_abandoned_today: q.calls_abandoned_today,
        avg_wait_seconds: q.avg_wait_seconds
      },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = queueController;


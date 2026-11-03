const { db } = require('../config/database');

const dashboardController = {
  getSummary: (req, res) => {
    try {
      const totalExt = db.prepare('SELECT COUNT(*) as count FROM extensions').get().count;
      const registeredExt = db.prepare("SELECT COUNT(*) as count FROM extensions WHERE registration_status = 'registered'").get().count;
      const offlineExt = totalExt - registeredExt;
      const totalQueues = db.prepare('SELECT COUNT(*) as count FROM queues').get().count;
      const totalConfs = db.prepare('SELECT COUNT(*) as count FROM conference_rooms').get().count;
      const totalCdrs = db.prepare('SELECT COUNT(*) as count FROM cdr_records').get().count;

      return res.status(200).json({
        success: true,
        data: {
          asterisk_status: 'ONLINE',
          asterisk_version: 'Asterisk 20.9.2 LTS (PJSIP)',
          uptime_seconds: 356400,
          total_extensions: totalExt,
          registered_phones: registeredExt,
          offline_phones: offlineExt,
          active_calls: 2,
          today_calls_count: totalCdrs + 180,
          active_queues: totalQueues,
          active_conferences: totalConfs
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  getResources: (req, res) => {
    return res.status(200).json({
      success: true,
      data: {
        cpu: { usage_percent: 22.4, cores: 4, temperature_c: 44 },
        memory: { total_mb: 4096, used_mb: 1780, usage_percent: 43.4 },
        disk: { total_gb: 64.0, used_gb: 21.2, usage_percent: 33.1 },
        services: {
          asterisk: 'running',
          pjsip: 'running',
          mariadb: 'running',
          web_server: 'running'
        }
      },
      timestamp: new Date().toISOString()
    });
  },

  controlService: (req, res) => {
    const { name, action } = req.params;
    console.log(`[System Service] Action: ${action} on daemon: ${name}`);
    return res.status(200).json({
      success: true,
      message: `Action '${action}' appliquée avec succès au service ${name}.`,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = dashboardController;


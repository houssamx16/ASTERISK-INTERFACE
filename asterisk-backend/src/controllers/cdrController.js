
const { db } = require('../config/database');

const cdrController = {
  getRecords: (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const { disposition, department, search } = req.query;

      // Only real Asterisk CDR records.
      const whereConditions = [
        'asterisk_uniqueid IS NOT NULL'
      ];

      const params = [];

      if (disposition && disposition !== 'all') {
        whereConditions.push('disposition = ?');
        params.push(disposition);
      }

      if (department && department !== 'all') {
        whereConditions.push('department = ?');
        params.push(department);
      }

      if (search) {
        whereConditions.push(
          '(source LIKE ? OR destination LIKE ? OR caller_id LIKE ?)'
        );

        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      const totalRecords = db.prepare(`
        SELECT COUNT(*) AS count
        FROM cdr_records
        ${whereClause}
      `).get(...params).count;

      const records = db.prepare(`
        SELECT *
        FROM cdr_records
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      return res.status(200).json({
        success: true,
        data: {
          records,
          pagination: {
            current_page: page,
            per_page: limit,
            total_records: totalRecords,
            total_pages: Math.ceil(totalRecords / limit)
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[CDR] Get records error:', err);

      return res.status(500).json({
        success: false,
        error: { message: err.message }
      });
    }
  },

  getStats: (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT
          COUNT(*) AS total_calls,
          SUM(CASE
            WHEN disposition = 'ANSWERED' THEN 1
            ELSE 0
          END) AS answered_calls
        FROM cdr_records
        WHERE asterisk_uniqueid IS NOT NULL
      `).get();

      const total = stats.total_calls || 0;
      const answered = stats.answered_calls || 0;

      return res.status(200).json({
        success: true,
        data: {
          total_calls: total,
          answered_calls: answered,
          answer_rate: total > 0
            ? Math.round((answered / total) * 100)
            : 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[CDR] Get stats error:', err);

      return res.status(500).json({
        success: false,
        error: { message: err.message }
      });
    }
  },

  exportCsv: (req, res) => {
    try {
      const records = db.prepare(`
        SELECT *
        FROM cdr_records
        WHERE asterisk_uniqueid IS NOT NULL
        ORDER BY id DESC
      `).all();

      const headers = [
        'id',
        'call_date',
        'caller_id',
        'source',
        'destination',
        'context',
        'duration',
        'billable_seconds',
        'disposition',
        'department'
      ];

      const csvLines = [headers.join(',')];

      for (const r of records) {
        csvLines.push([
          r.id,
          `"${r.call_date}"`,
          `"${r.caller_id}"`,
          `"${r.source}"`,
          `"${r.destination}"`,
          `"${r.context}"`,
          r.duration,
          r.billable_seconds,
          `"${r.disposition}"`,
          `"${r.department}"`
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="asterisk_cdr.csv"'
      );

      return res.status(200).send(csvLines.join('\n'));

    } catch (err) {
      console.error('[CDR] Export error:', err);

      return res.status(500).json({
        success: false,
        error: { message: err.message }
      });
    }
  }
};

module.exports = cdrController;

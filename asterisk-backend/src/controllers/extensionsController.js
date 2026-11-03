
const { db } = require('../config/database');
const asteriskService = require('../services/asteriskService');

// Parse live PJSIP contacts returned by Asterisk.
function parseAsteriskContacts(output) {
  const contacts = new Map();

  const lines = String(output || '').split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(
      /^\s*Contact:\s+(\d+)\/(sip:\S+)\s+\S+\s+(\S+)\s+(\S+)/i
    );

    if (!match) {
      continue;
    }

    const extension = match[1];
    const sipUri = match[2];
    const asteriskStatus = match[3];
    const rtt = match[4];

    // Extract the IP address from the SIP contact URI.
    const ipMatch = sipUri.match(
      /@\[?([0-9a-fA-F:.]+)\]?(?::\d+)?(?:;|$)/i
    );

    const numericRtt = Number(rtt);

    contacts.set(extension, {
      status: 'registered',
      asterisk_status: asteriskStatus,
      ip_address: ipMatch ? ipMatch[1] : null,
      latency_ms: Number.isFinite(numericRtt)
        ? numericRtt
        : null
    });
  }

  return contacts;
}

const extensionsController = {

  // GET /api/v1/extensions
  // Retrieve extension information from SQLite
  // and live registration information from Asterisk.
  getAll: async (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT *
        FROM extensions
        ORDER BY CAST(extension_number AS INTEGER) ASC
      `).all();

      let liveContacts = new Map();
      let asteriskAvailable = false;

      try {
        const result = await asteriskService.getContacts();

        liveContacts = parseAsteriskContacts(result.output);
        asteriskAvailable = true;

      } catch (asteriskError) {
        console.error(
          '[Extensions] Failed to retrieve live Asterisk contacts:',
          asteriskError.message
        );
      }

      const formatted = rows.map((r) => {
        const liveContact = liveContacts.get(
          String(r.extension_number)
        );

        return {
          id: r.id,
          extension_number: r.extension_number,
          caller_id: r.caller_id,
          user_id: r.user_id,
          user_name: r.user_name,
          user_email: r.user_email,
          department: r.department,
          transport: r.transport,
          context: r.context,
          status: r.status,
          voicemail_enabled: Boolean(r.voicemail_enabled),
          webrtc_enabled: Boolean(r.webrtc_enabled),
          max_contacts: r.max_contacts,

          registration: {
            status: asteriskAvailable
              ? (liveContact ? 'registered' : 'offline')
              : 'unknown',

            ip_address: liveContact
              ? liveContact.ip_address
              : (asteriskAvailable ? null : r.ip_address),

            user_agent: r.user_agent,

            latency_ms: liveContact
              ? liveContact.latency_ms
              : (asteriskAvailable ? null : r.latency_ms),

            last_registered: r.last_registered,

            asterisk_status: liveContact
              ? liveContact.asterisk_status
              : null
          }
        };
      });

      return res.status(200).json({
        success: true,
        data: formatted,
        asterisk_status_available: asteriskAvailable,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Extensions] getAll error:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve extensions.' }
      });
    }
  },

  // POST /api/v1/extensions
  create: async (req, res) => {
    let asteriskSynced = false;
    let extension = '';

    try {
      const {
        extension_number,
        sip_password,
        caller_id,
        user_name,
        user_email,
        department = 'Administration',
        transport = 'transport-udp',
        context = 'internal',
        voicemail_enabled = 1,
        webrtc_enabled = 0,
        max_contacts = 1
      } = req.body;

      if (!extension_number || !sip_password || !user_name) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Extension number, SIP password and user name are required.'
          }
        });
      }

      extension = String(extension_number).trim();

      if (!/^[1-5][0-9]{2}$/.test(extension)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Extension number must be between 100 and 599.'
          }
        });
      }

      if (
        typeof sip_password !== 'string' ||
        !/^[A-Za-z0-9_-]{16,128}$/.test(sip_password)
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'SIP password must contain 16 to 128 valid characters.'
          }
        });
      }

      if (transport !== 'transport-udp' || context !== 'internal') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Currently only UDP transport and internal context are supported.'
          }
        });
      }

      const range = db.prepare(`
        SELECT range_start, range_end
        FROM dialplan_ranges
        WHERE department = ?
      `).get(department);

      if (!range) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid department.' }
        });
      }

      const number = Number(extension);

      if (number < range.range_start || number > range.range_end) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Extension must be within the ${department} range (${range.range_start}-${range.range_end}).`
          }
        });
      }

      const contacts = Number(max_contacts);

      if (contacts !== 1) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Currently max_contacts must be 1.'
          }
        });
      }

      const id = `ext-${extension}`;
      const cid = caller_id || `${user_name} <${extension}>`;

      const existing = db.prepare(`
        SELECT id
        FROM extensions
        WHERE extension_number = ? OR id = ?
      `).get(extension, id);

      if (existing) {
        return res.status(409).json({
          success: false,
          error: { message: 'Extension already exists.' }
        });
      }

      // Step 1: Create the actual PJSIP configuration in Asterisk.
      try {
        await asteriskService.syncExtension({
          extension_number: extension,
          sip_password
        });

        asteriskSynced = true;

      } catch (asteriskError) {
        console.error('[Extensions] Asterisk sync error:', asteriskError);

        return res.status(502).json({
          success: false,
          error: {
            message: 'Failed to create the extension in Asterisk. Database was not modified.'
          }
        });
      }

      // Step 2: Save the extension in SQLite.
      try {
        db.prepare(`
          INSERT INTO extensions (
            id,
            extension_number,
            sip_password,
            caller_id,
            user_name,
            user_email,
            department,
            transport,
            context,
            status,
            voicemail_enabled,
            webrtc_enabled,
            max_contacts,
            registration_status,
            ip_address,
            user_agent,
            latency_ms
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            'active', ?, ?, ?, 'offline',
            '0.0.0.0', 'Unknown', 0
          )
        `).run(
          id,
          extension,
          sip_password,
          cid,
          user_name,
          user_email || '',
          department,
          transport,
          context,
          voicemail_enabled ? 1 : 0,
          webrtc_enabled ? 1 : 0,
          contacts
        );

      } catch (databaseError) {
        // Compensate: remove the Asterisk configuration if SQLite fails.
        if (asteriskSynced) {
          try {
            await asteriskService.deleteExtension(extension);
          } catch (rollbackError) {
            console.error(
              '[Extensions] Asterisk rollback failed:',
              rollbackError
            );
          }
        }

        throw databaseError;
      }

      return res.status(201).json({
        success: true,
        data: {
          id,
          extension_number: extension,
          caller_id: cid,
          status: 'active',
          registration_status: 'offline'
        },
        message: 'Extension created successfully in Asterisk and SQLite.',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Extensions] create error:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create extension.' }
      });
    }
  },

  // PUT /api/v1/extensions/:id
  update: (req, res) => {
    try {
      const { id } = req.params;

      const existing = db.prepare(`
        SELECT id
        FROM extensions
        WHERE id = ?
      `).get(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: 'Extension not found.' }
        });
      }

      const {
        user_name,
        user_email,
        department,
        caller_id,
        voicemail_enabled,
        webrtc_enabled,
        sip_password
      } = req.body;

      if (sip_password !== undefined) {
        return res.status(501).json({
          success: false,
          error: {
            message: 'SIP password updates are not implemented yet.'
          }
        });
      }

      const result = db.prepare(`
        UPDATE extensions
        SET
          user_name = COALESCE(?, user_name),
          user_email = COALESCE(?, user_email),
          department = COALESCE(?, department),
          caller_id = COALESCE(?, caller_id),
          voicemail_enabled = COALESCE(?, voicemail_enabled),
          webrtc_enabled = COALESCE(?, webrtc_enabled)
        WHERE id = ?
      `).run(
        user_name ?? null,
        user_email ?? null,
        department ?? null,
        caller_id ?? null,
        voicemail_enabled !== undefined
          ? (voicemail_enabled ? 1 : 0)
          : null,
        webrtc_enabled !== undefined
          ? (webrtc_enabled ? 1 : 0)
          : null,
        id
      );

      return res.status(200).json({
        success: true,
        data: { id, updated: result.changes > 0 },
        message: 'Extension updated in SQLite.',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Extensions] update error:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update extension.' }
      });
    }
  },

  // PATCH /api/v1/extensions/:id/toggle
  toggleStatus: (req, res) => {
    try {
      const { id } = req.params;

      const ext = db.prepare(`
        SELECT status
        FROM extensions
        WHERE id = ?
      `).get(id);

      if (!ext) {
        return res.status(404).json({
          success: false,
          error: { message: 'Extension not found.' }
        });
      }

      const newStatus =
        ext.status === 'active' ? 'inactive' : 'active';

      db.prepare(`
        UPDATE extensions
        SET status = ?
        WHERE id = ?
      `).run(newStatus, id);

      return res.status(200).json({
        success: true,
        data: { status: newStatus },
        message: `Administrative status changed to ${newStatus}. SIP endpoint was not disabled in Asterisk.`,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Extensions] toggleStatus error:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to change extension status.' }
      });
    }
  },

  // DELETE /api/v1/extensions/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const existing = db.prepare(`
        SELECT id, extension_number
        FROM extensions
        WHERE id = ? OR extension_number = ?
      `).get(id, id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: 'Extension not found.' }
        });
      }

      // Step 1: Remove the actual PJSIP configuration.
      try {
        await asteriskService.deleteExtension(existing.extension_number);
      } catch (asteriskError) {
        console.error('[Extensions] Asterisk delete error:', asteriskError);

        return res.status(502).json({
          success: false,
          error: {
            message: 'Failed to delete the extension from Asterisk. Database was not modified.'
          }
        });
      }

      // Step 2: Remove the database record.
      db.prepare(`
        DELETE FROM extensions
        WHERE id = ?
      `).run(existing.id);

      return res.status(200).json({
        success: true,
        message: `Extension ${existing.extension_number} deleted from Asterisk and SQLite.`,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Extensions] delete error:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete extension.' }
      });
    }
  },

  // POST /api/v1/extensions/apply-config
  applyConfig: async (req, res) => {
    try {
      const result = await asteriskService.reloadPJSIP();

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Asterisk PJSIP configuration reloaded successfully.',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Extensions] applyConfig error:', err);

      return res.status(502).json({
        success: false,
        error: {
          message: 'Failed to reload Asterisk PJSIP configuration.'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = extensionsController;

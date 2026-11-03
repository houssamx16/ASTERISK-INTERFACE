
const { db } = require('../config/database');
const asteriskService = require('../services/asteriskService');
const { randomUUID } = require('crypto');

// --------------------------------------------------
// Validation helpers
// --------------------------------------------------

const VALID_ACTIONS = ['allow', 'deny'];
const VALID_SCOPES = ['all', 'department', 'extension'];

const validationError = (res, message) => {
  return res.status(400).json({
    success: false,
    error: { message },
    timestamp: new Date().toISOString()
  });
};

const validatePattern = (pattern) => {
  if (typeof pattern !== 'string') {
    return 'Pattern must be a string.';
  }

  const value = pattern.trim();

  if (!value) {
    return 'Pattern is required.';
  }

  if (value.length > 80) {
    return 'Pattern cannot exceed 80 characters.';
  }

  // Only allow characters used in ordinary Asterisk dial patterns.
  // This prevents configuration injection characters.
  const allowedCharacters = /^[0-9*#_XxZzNn.[\]!-]+$/;

  if (!allowedCharacters.test(value)) {
    return 'Pattern contains unsupported characters.';
  }

  // Validate bracket groups.
  let insideBracket = false;
  let bracketContent = '';

  for (const character of value) {
    if (character === '[') {
      if (insideBracket) {
        return 'Pattern contains nested brackets.';
      }

      insideBracket = true;
      bracketContent = '';
      continue;
    }

    if (character === ']') {
      if (!insideBracket || bracketContent.length === 0) {
        return 'Pattern contains invalid brackets.';
      }

      insideBracket = false;
      continue;
    }

    if (insideBracket) {
      bracketContent += character;
    }
  }

  if (insideBracket) {
    return 'Pattern contains an unclosed bracket.';
  }

  return null;
};

const validateRule = (body) => {
  const {
    name,
    pattern,
    action = 'allow',
    pin_code,
    applies_to = 'all',
    target_id
  } = body;

  if (typeof name !== 'string' || !name.trim()) {
    return 'Rule name is required.';
  }

  if (name.trim().length > 100) {
    return 'Rule name cannot exceed 100 characters.';
  }

  const patternError = validatePattern(pattern);

  if (patternError) {
    return patternError;
  }

  if (!VALID_ACTIONS.includes(action)) {
    return 'Invalid action. Allowed values are: allow, deny.';
  }

  if (!VALID_SCOPES.includes(applies_to)) {
    return 'Invalid scope. Allowed values are: all, department, extension.';
  }

  // PIN is optional, but if supplied it must be 4-10 digits.
  if (
    pin_code !== undefined &&
    pin_code !== null &&
    pin_code !== ''
  ) {
    if (
      typeof pin_code !== 'string' ||
      !/^\d{4,10}$/.test(pin_code)
    ) {
      return 'PIN must contain between 4 and 10 digits.';
    }
  }

  if (applies_to === 'all') {
    return null;
  }

  if (
    typeof target_id !== 'string' &&
    typeof target_id !== 'number'
  ) {
    return 'A target must be selected for this scope.';
  }

  if (String(target_id).trim() === '') {
    return 'Target cannot be empty.';
  }

  return null;
};

const validateTarget = (applies_to, target_id) => {
  if (applies_to === 'all') {
    return null;
  }

  if (applies_to === 'department') {
    const department = db.prepare(`
      SELECT department
      FROM dialplan_ranges
      WHERE department = ?
    `).get(String(target_id));

    if (!department) {
      return 'The selected department does not exist.';
    }

    return null;
  }

  if (applies_to === 'extension') {
    const extension = db.prepare(`
      SELECT extension_number
      FROM extensions
      WHERE extension_number = ?
    `).get(String(target_id));

    if (!extension) {
      return 'The selected extension does not exist.';
    }

    return null;
  }

  return 'Invalid target scope.';
};

// --------------------------------------------------
// Dialplan controller
// --------------------------------------------------

const dialplanController = {

  // ------------------------------------------------
  // Get dialplan ranges with real allocated counts
  // ------------------------------------------------

  getRanges: (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT
          r.id,
          r.department,
          r.range_start,
          r.range_end,
          r.description,
          COUNT(
            CASE
              WHEN CAST(e.extension_number AS INTEGER)
                   BETWEEN r.range_start AND r.range_end
              THEN e.extension_number
            END
          ) AS allocated_count
        FROM dialplan_ranges r
        LEFT JOIN extensions e
          ON e.department = r.department
        GROUP BY
          r.id,
          r.department,
          r.range_start,
          r.range_end,
          r.description
        ORDER BY r.range_start ASC
      `).all();

      return res.status(200).json({
        success: true,
        data: rows,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Get ranges failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve dialplan ranges.' }
      });
    }
  },

  // ------------------------------------------------
  // Update dialplan range
  // ------------------------------------------------

  updateRange: (req, res) => {
    try {
      const { id } = req.params;
      const {
        range_start,
        range_end,
        description
      } = req.body;

      const existing = db.prepare(`
        SELECT id
        FROM dialplan_ranges
        WHERE id = ?
      `).get(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: { message: 'Dialplan range not found.' }
        });
      }

      if (
        range_start !== undefined &&
        (!Number.isInteger(Number(range_start)) ||
          Number(range_start) < 1 ||
          Number(range_start) > 999999)
      ) {
        return validationError(
          res,
          'Invalid range_start value.'
        );
      }

      if (
        range_end !== undefined &&
        (!Number.isInteger(Number(range_end)) ||
          Number(range_end) < 1 ||
          Number(range_end) > 999999)
      ) {
        return validationError(
          res,
          'Invalid range_end value.'
        );
      }

      const current = db.prepare(`
        SELECT range_start, range_end
        FROM dialplan_ranges
        WHERE id = ?
      `).get(id);

      const newStart =
        range_start !== undefined
          ? Number(range_start)
          : current.range_start;

      const newEnd =
        range_end !== undefined
          ? Number(range_end)
          : current.range_end;

      if (newStart > newEnd) {
        return validationError(
          res,
          'range_start cannot be greater than range_end.'
        );
      }

      db.prepare(`
        UPDATE dialplan_ranges
        SET range_start = ?,
            range_end = ?,
            description = COALESCE(?, description)
        WHERE id = ?
      `).run(
        newStart,
        newEnd,
        description,
        id
      );

      return res.status(200).json({
        success: true,
        message: 'Plage mise à jour.',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Update range failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update dialplan range.' }
      });
    }
  },

  // ------------------------------------------------
  // Get routing rules
  // ------------------------------------------------

  getRules: (req, res) => {
    try {
      // Never return PIN values to the frontend.
      // Only indicate whether a PIN has been configured.
      const rows = db.prepare(`
        SELECT
          id,
          name,
          pattern,
          description,
          action,
          applies_to,
          target_id,
          CASE
            WHEN pin_code IS NOT NULL AND pin_code != ''
            THEN 1
            ELSE 0
          END AS pin_configured
        FROM routing_rules
        ORDER BY rowid DESC
      `).all();

      return res.status(200).json({
        success: true,
        data: rows,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Get rules failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve routing rules.' }
      });
    }
  },

  // ------------------------------------------------
  // Create routing rule
  // ------------------------------------------------

  createRule: (req, res) => {
    try {
      if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        return validationError(
          res,
          'Invalid request body.'
        );
      }

      const {
        name,
        pattern,
        description,
        action = 'allow',
        pin_code,
        applies_to = 'all',
        target_id
      } = req.body;

      // Step 1: Validate fields.
      const error = validateRule(req.body);

      if (error) {
        return validationError(res, error);
      }

      // Step 2: Validate the selected target against SQLite.
      const targetError = validateTarget(
        applies_to,
        target_id
      );

      if (targetError) {
        return validationError(res, targetError);
      }

      // Step 3: Normalize values.
      const id = `rule-${randomUUID()}`;

      const normalizedName = name.trim();
      const normalizedPattern = pattern.trim();

      const normalizedDescription =
        typeof description === 'string'
          ? description.trim().slice(0, 500)
          : '';

      const normalizedPin =
        pin_code === undefined ||
        pin_code === null ||
        pin_code === ''
          ? null
          : pin_code;

      const normalizedTarget =
        applies_to === 'all'
          ? null
          : String(target_id);

      // Step 4: Save the rule in SQLite.
      db.prepare(`
        INSERT INTO routing_rules (
          id,
          name,
          pattern,
          description,
          action,
          pin_code,
          applies_to,
          target_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        normalizedName,
        normalizedPattern,
        normalizedDescription,
        action,
        normalizedPin,
        applies_to,
        normalizedTarget
      );

      console.log(
        `[Dialplan] Routing rule created: ${id}`
      );

      // Do not return the PIN to the frontend.
      return res.status(201).json({
        success: true,
        data: {
          id,
          name: normalizedName,
          pattern: normalizedPattern,
          description: normalizedDescription,
          action,
          applies_to,
          target_id: normalizedTarget,
          pin_configured: Boolean(normalizedPin)
        },
        message: 'Routing rule saved successfully.',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Create rule failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create routing rule.' }
      });
    }
  },

  // ------------------------------------------------
  // Delete routing rule
  // ------------------------------------------------

  deleteRule: (req, res) => {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        return validationError(
          res,
          'A valid rule ID is required.'
        );
      }

      const result = db.prepare(`
        DELETE FROM routing_rules
        WHERE id = ?
      `).run(id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: { message: 'Routing rule not found.' }
        });
      }

      console.log(
        `[Dialplan] Routing rule deleted: ${id}`
      );

      return res.status(200).json({
        success: true,
        message: 'Règle supprimée.',
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Delete rule failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete routing rule.' }
      });
    }
  },

  // ------------------------------------------------
  // Get call forwarding list
  // ------------------------------------------------

  getForwardingList: (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT *
        FROM call_forwarding
      `).all();

      const formatted = rows.map((r) => ({
        extension_number: r.extension_number,
        forward_always_enabled: Boolean(r.forward_always_enabled),
        forward_always_dest: r.forward_always_dest,
        forward_busy_enabled: Boolean(r.forward_busy_enabled),
        forward_busy_dest: r.forward_busy_dest,
        forward_no_answer_enabled: Boolean(r.forward_no_answer_enabled),
        forward_no_answer_dest: r.forward_no_answer_dest,
        timeout_seconds: r.timeout_seconds
      }));

      return res.status(200).json({
        success: true,
        data: formatted,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Get forwarding failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve call forwarding settings.' }
      });
    }
  },

  // ------------------------------------------------
  // Update call forwarding
  // ------------------------------------------------

  updateForwarding: (req, res) => {
    try {
      const { ext } = req.params;

      const {
        forward_always_enabled,
        forward_always_dest,
        forward_busy_enabled,
        forward_busy_dest,
        forward_no_answer_enabled,
        forward_no_answer_dest,
        timeout_seconds = 20
      } = req.body;

      if (!/^\d{1,10}$/.test(String(ext))) {
        return validationError(
          res,
          'Invalid extension number.'
        );
      }

      if (
        !Number.isInteger(Number(timeout_seconds)) ||
        Number(timeout_seconds) < 1 ||
        Number(timeout_seconds) > 120
      ) {
        return validationError(
          res,
          'Timeout must be between 1 and 120 seconds.'
        );
      }

      db.prepare(`
        INSERT INTO call_forwarding (
          extension_number,
          forward_always_enabled,
          forward_always_dest,
          forward_busy_enabled,
          forward_busy_dest,
          forward_no_answer_enabled,
          forward_no_answer_dest,
          timeout_seconds
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(extension_number) DO UPDATE SET
          forward_always_enabled = excluded.forward_always_enabled,
          forward_always_dest = excluded.forward_always_dest,
          forward_busy_enabled = excluded.forward_busy_enabled,
          forward_busy_dest = excluded.forward_busy_dest,
          forward_no_answer_enabled = excluded.forward_no_answer_enabled,
          forward_no_answer_dest = excluded.forward_no_answer_dest,
          timeout_seconds = excluded.timeout_seconds
      `).run(
        ext,
        forward_always_enabled ? 1 : 0,
        forward_always_dest || '',
        forward_busy_enabled ? 1 : 0,
        forward_busy_dest || '',
        forward_no_answer_enabled ? 1 : 0,
        forward_no_answer_dest || '',
        Number(timeout_seconds)
      );

      return res.status(200).json({
        success: true,
        message: `Renvoi pour ${ext} enregistré.`,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Update forwarding failed:', err);

      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update call forwarding.' }
      });
    }
  },

  // ------------------------------------------------
  // Reload Asterisk dialplan
  // ------------------------------------------------

  reloadDialplan: async (req, res) => {
    try {
      const result = await asteriskService.reloadDialplan();

      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('[Dialplan] Reload failed:', err);

      return res.status(500).json({
        success: false,
        error: {
          message: err.message || 'Dialplan reload failed.'
        }
      });
    }
  }
};

module.exports = dialplanController;

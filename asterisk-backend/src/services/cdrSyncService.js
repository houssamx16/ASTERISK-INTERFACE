const fs = require('node:fs');
const { db } = require('../config/database');

const CSV_PATH =
  process.env.ASTERISK_CDR_CSV ||
  '\\\\wsl.localhost\\Ubuntu\\var\\log\\asterisk\\cdr-csv\\Master.csv';

function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      fields.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  fields.push(value);
  return fields;
}

function parseCsv(content) {
  const lines = [];
  let line = '';
  let quoted = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      line += char;

      if (quoted && content[i + 1] === '"') {
        line += content[++i];
      } else {
        quoted = !quoted;
      }
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (line.trim()) lines.push(line);
      line = '';

      if (char === '\r' && content[i + 1] === '\n') i++;
    } else {
      line += char;
    }
  }

  if (line.trim()) lines.push(line);

  return lines.map(parseCsvLine);
}

function syncCdrRecords() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`Asterisk CDR CSV not found: ${CSV_PATH}`);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(content);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO cdr_records (
      call_date, caller_id, source, destination, context,
      duration, billable_seconds, disposition, department,
      recording_url, asterisk_uniqueid
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let imported = 0;
  let skipped = 0;

  db.exec('BEGIN IMMEDIATE');

  try {
    for (const row of rows) {
      if (row.length < 17) {
        skipped++;
        continue;
      }

      const [
        accountCode, source, destination, context, callerId,
        channel, destinationChannel, lastApp, lastData,
        start, answer, end, duration, billableSeconds,
        disposition, amaFlags, uniqueId
      ] = row;

      if (!uniqueId || !source || !destination || !start) {
        skipped++;
        continue;
      }

      const result = insert.run(
        start,
        callerId || source,
        source,
        destination,
        context || 'from-internal',
        Number(duration) || 0,
        Number(billableSeconds) || 0,
        disposition || 'UNKNOWN',
        'General',
        null,
        uniqueId
      );

      if (result.changes > 0) imported++;
      else skipped++;
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return {
    totalRows: rows.length,
    imported,
    skipped
  };
}

module.exports = { syncCdrRecords, parseCsv, parseCsvLine };


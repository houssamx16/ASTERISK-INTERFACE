
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

const amiService = require('./amiService');

const SSH_USER = process.env.ASTERISK_SSH_USER || 'houssam';
const SSH_HOST = process.env.ASTERISK_SSH_HOST || '127.0.0.1';

const SSH_KEY =
  process.env.ASTERISK_SSH_KEY ||
  path.join(os.homedir(), '.ssh', 'asterisk_backend');

const HELPER_PATH = '/usr/local/sbin/asterisk-backend-helper';

const SSH_TIMEOUT = 20000;

function runHelper(payload) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', SSH_KEY,
      '-o', 'BatchMode=yes',
      '-o', 'ConnectTimeout=10',
      '-o', 'StrictHostKeyChecking=yes',
      `${SSH_USER}@${SSH_HOST}`,
      'sudo', '-n', HELPER_PATH
    ];

    const child = spawn('ssh', args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill();
        reject(new Error('Asterisk SSH helper timed out.'));
      }
    }, SSH_TIMEOUT);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      if (finished) return;

      finished = true;
      clearTimeout(timeout);
      reject(new Error(`SSH execution failed: ${error.message}`));
    });

    child.on('close', (code) => {
      if (finished) return;

      finished = true;
      clearTimeout(timeout);

      if (code !== 0) {
        return reject(
          new Error(
            `Asterisk helper failed (${code}): ${stderr || stdout}`
          )
        );
      }

      resolve({
        success: true,
        output: stdout.trim()
      });
    });

    child.stdin.on('error', (error) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        child.kill();
        reject(error);
      }
    });

    child.stdin.end(JSON.stringify(payload));
  });
}

const asteriskService = {
  // Create or update an Asterisk extension.
  syncExtension: async (extension) => {
    if (
      !extension ||
      !extension.extension_number ||
      !extension.sip_password
    ) {
      throw new Error('Extension number and SIP password are required.');
    }

    return runHelper({
      action: 'write',
      extension: String(extension.extension_number),
      password: extension.sip_password
    });
  },

  // Delete an Asterisk extension.
  deleteExtension: async (extensionNumber) => {
    if (!extensionNumber) {
      throw new Error('Extension number is required.');
    }

    return runHelper({
      action: 'delete',
      extension: String(extensionNumber)
    });
  },

  // Reload PJSIP configuration.
  reloadPJSIP: async () => {
    return runHelper({
      action: 'reload'
    });
  },

  // Retrieve PJSIP contacts.
  getContacts: async () => {
    return runHelper({
      action: 'contacts'
    });
  },

  // Reload dialplan (not implemented in SSH helper).
  reloadDialplan: async () => {
    throw new Error(
      'Dialplan reload is not implemented in the SSH helper.'
    );
  },

  // Queue synchronization (not implemented yet).
  syncQueue: async () => {
    throw new Error('Queue synchronization is not implemented yet.');
  },

  // Retrieve active channels using Asterisk Manager Interface.
  getLiveChannels: async () => {
    return amiService.getLiveChannels();
  },

  // Hang up a channel (will be implemented in the next step).
  hangupChannel: async () => {
    throw new Error('AMI channel hangup is not implemented yet.');
  }
};

module.exports = asteriskService;

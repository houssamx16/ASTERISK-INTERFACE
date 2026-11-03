
const net = require('node:net');

const HOST = process.env.AMI_HOST || '127.0.0.1';
const PORT = Number(process.env.AMI_PORT || 5038);
const USERNAME = process.env.AMI_USERNAME;
const SECRET = process.env.AMI_SECRET;

function parseMessage(raw) {
  const message = {};

  for (const line of raw.split('\r\n')) {
    const separator = line.indexOf(':');

    if (separator > 0) {
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      message[key] = value;
    }
  }

  return message;
}

function requestAMI(action, headers = {}, completionEvent = null) {
  return new Promise((resolve, reject) => {
    if (!USERNAME || !SECRET) {
      return reject(new Error('AMI credentials are not configured.'));
    }

    const socket = net.createConnection({ host: HOST, port: PORT });
    let buffer = '';
    let greetingReceived = false;
    let loggedIn = false;
    let actionAccepted = false;
    let finished = false;
    const events = [];

    const timeout = setTimeout(() => {
      fail('AMI request timed out.');
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      socket.destroy();
    }

    function fail(message) {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(message));
    }

    function succeed(result) {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(result);
    }

    function sendAction(name, actionHeaders = {}) {
      let packet = `Action: ${name}\r\n`;

      for (const [key, value] of Object.entries(actionHeaders)) {
        packet += `${key}: ${value}\r\n`;
      }

      socket.write(packet + '\r\n');
    }

    function processMessage(raw) {
      const message = parseMessage(raw);

      if (!loggedIn) {
        if (/^Success$/i.test(message.Response || '')) {
          loggedIn = true;

          if (!action) {
            return succeed({
              success: true,
              message: 'AMI authentication successful.'
            });
          }

          sendAction(action, headers);
          return;
        }

        if (/^Error$/i.test(message.Response || '')) {
          return fail('AMI authentication failed. Check credentials and permissions.');
        }

        return;
      }

      if (message.Response) {
        if (/^Error$/i.test(message.Response)) {
          return fail(message.Message || 'AMI action failed.');
        }

        if (/^Success$/i.test(message.Response)) {
          actionAccepted = true;

          if (!completionEvent) {
            return succeed(message);
          }
        }
      }

      if (message.Event === 'CoreShowChannel') {
        events.push({
          channel: message.Channel || '',
          state: message.ChannelStateDesc || '',
          callerId: message.CallerIDNum || '',
          connectedLine: message.ConnectedLineNum || '',
          duration: message.Duration || '',
          application: message.Application || '',
          applicationData: message.ApplicationData || '',
          bridgeId: message.BridgeId || ''
        });
      }

      if (completionEvent && message.Event === completionEvent) {
        return succeed(events);
      }
    }

    socket.setEncoding('utf8');

    socket.on('data', (chunk) => {
      buffer += chunk;

      if (!greetingReceived) {
        const greetingEnd = buffer.indexOf('\r\n');

        if (greetingEnd === -1) return;

        const greeting = buffer.slice(0, greetingEnd);
        buffer = buffer.slice(greetingEnd + 2);
        greetingReceived = true;

        if (!/^Asterisk Call Manager\//i.test(greeting)) {
          return fail('Unexpected AMI greeting.');
        }

        sendAction('Login', {
          Username: USERNAME,
          Secret: SECRET,
          Events: action ? 'on' : 'off'
        });
      }

      let messageEnd;

      while ((messageEnd = buffer.indexOf('\r\n\r\n')) !== -1) {
        const raw = buffer.slice(0, messageEnd);
        buffer = buffer.slice(messageEnd + 4);

        if (raw.trim()) {
          processMessage(raw);
        }

        if (finished) return;
      }
    });

    socket.on('error', (error) => {
      fail(`AMI socket error: ${error.message}`);
    });

    socket.on('close', () => {
      if (!finished) {
        fail('AMI connection closed unexpectedly.');
      }
    });
  });
}

function testConnection() {
  return requestAMI(null);
}

function getLiveChannels() {
  return requestAMI(
    'CoreShowChannels',
    {},
    'CoreShowChannelsComplete'
  );
}

module.exports = {
  testConnection,
  getLiveChannels
};

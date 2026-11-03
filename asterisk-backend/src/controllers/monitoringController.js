const asteriskService = require('../services/asteriskService');

function parseDuration(duration) {
  if (!duration) return 0;

  const parts = duration.split(':').map(Number);

  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

function mapChannel(channel) {
  const rawState = (channel.state || '').toLowerCase();

  let state = 'Dialing';

  if (rawState === 'up') {
    state = 'Up';
  } else if (rawState === 'ring' || rawState === 'ringing') {
    state = 'Ring';
  }

  return {
    channel_id: channel.channel || '',
    caller_id: channel.callerId || '',
    caller_name: channel.callerId || '',
    connected_to: channel.connectedLine || '',
    callee_name: channel.connectedLine || '',
    duration_seconds: parseDuration(channel.duration),
    state,
    codec: 'Unknown',
    department: 'Unknown'
  };
}

const monitoringController = {
  getLiveChannels: async (req, res) => {
    try {
      const channels = await asteriskService.getLiveChannels();
      const mappedChannels = channels.map(mapChannel);

      return res.status(200).json({
        success: true,
        data: mappedChannels,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { message: err.message }
      });
    }
  },

  hangupChannel: async (req, res) => {
    try {
      const { channelId } = req.params;
      await asteriskService.hangupChannel(channelId);

      return res.status(200).json({
        success: true,
        message: `Channel ${channelId} hung up.`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { message: err.message }
      });
    }
  }
};

module.exports = monitoringController;
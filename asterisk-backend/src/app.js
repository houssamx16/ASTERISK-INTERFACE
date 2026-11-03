const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const extensionRoutes = require('./routes/extensionRoutes');
const userRoutes = require('./routes/userRoutes');
const dialplanRoutes = require('./routes/dialplanRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const queueRoutes = require('./routes/queueRoutes');
const ivrRoutes = require('./routes/ivrRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const cdrRoutes = require('./routes/cdrRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow connections from frontend dev server
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    appliance: 'Asterisk PBX Manager',
    university: 'Université Kasdi Merbah Ouargla - ASR2',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/system', dashboardRoutes);
app.use('/api/v1/system', backupRoutes);
app.use('/api/v1/extensions', extensionRoutes);
app.use('/api/v1/dialplan', dialplanRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/call-center', queueRoutes);
app.use('/api/v1/ivr', ivrRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/cdr', cdrRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.url} introuvable.`
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = app;


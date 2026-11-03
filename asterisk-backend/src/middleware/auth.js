const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_asterisk_appliance_jwt_key_2026_ouargla';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Accès refusé. Jeton d’authentification manquant.'
      },
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Session expirée ou jeton invalide.'
        },
        timestamp: new Date().toISOString()
      });
    }

    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken
};


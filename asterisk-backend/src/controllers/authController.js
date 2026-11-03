const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_asterisk_appliance_jwt_key_2026_ouargla';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  /**
   * POST /api/v1/auth/login
   */
  login: (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Veuillez renseigner le nom d’utilisateur et le mot de passe.'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Query database
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Nom d’utilisateur ou mot de passe incorrect.'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Compare password with bcrypt hash
      const isValid = bcrypt.compareSync(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Nom d’utilisateur ou mot de passe incorrect.'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Generate real JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
          }
        },
        message: 'Authentification réussie',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur serveur est survenue lors de la connexion.'
        },
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout: (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Session déconnectée avec succès.',
      timestamp: new Date().toISOString()
    });
  },

  /**
   * GET /api/v1/auth/me
   */
  getMe: (req, res) => {
    try {
      const user = db.prepare('SELECT id, username, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      });
    }
  }
};

module.exports = authController;


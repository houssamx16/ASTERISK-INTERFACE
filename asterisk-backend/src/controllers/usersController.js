const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

const usersController = {
  /**
   * GET /api/v1/users
   * Lists all users with their associated extension info
   */
  getAll: (req, res) => {
    try {
      const users = db.prepare(`
        SELECT u.id, u.username, u.name, u.email, u.role, u.created_at,
               e.extension_number, e.department
        FROM users u
        LEFT JOIN extensions e ON e.user_name = u.name OR e.user_id = u.id
        ORDER BY u.id ASC
      `).all();

      return res.status(200).json({
        success: true,
        data: users,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: err.message }
      });
    }
  },

  /**
   * POST /api/v1/users
   */
  create: (req, res) => {
    try {
      const { username, password, name, email, role = 'USER' } = req.body;

      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          error: { message: 'Les champs username, password et name sont obligatoires.' }
        });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const result = db.prepare(`
        INSERT INTO users (username, password_hash, name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(username.trim(), passwordHash, name.trim(), email || '', role);

      return res.status(201).json({
        success: true,
        data: { id: result.lastInsertRowid, username, name, email, role },
        message: 'Utilisateur créé avec succès.',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { message: err.message }
      });
    }
  },

  /**
   * DELETE /api/v1/users/:id
   */
  delete: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé de la base de données.',
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

module.exports = usersController;


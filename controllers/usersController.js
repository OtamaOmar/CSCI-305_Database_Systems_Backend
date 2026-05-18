const { db } = require('../db/connection');

exports.getAllUsers = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      `
        SELECT
          u.id,
          u.hospital_id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.department_id,
          dep.name AS department,
          u.is_active,
          DATE_FORMAT(u.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM users u
        LEFT JOIN departments dep ON dep.id = u.department_id AND dep.hospital_id = u.hospital_id
        WHERE u.hospital_id = ?
        ORDER BY created_at DESC, id DESC
      `,
      [hospitalId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      `
        SELECT
          u.id,
          u.hospital_id,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.department_id,
          dep.name AS department,
          u.is_active,
          DATE_FORMAT(u.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM users u
        LEFT JOIN departments dep ON dep.id = u.department_id AND dep.hospital_id = u.hospital_id
        WHERE u.id = ? AND u.hospital_id = ?
        LIMIT 1
      `,
      [req.params.id, hospitalId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  res.status(400).json({
    error:
      'Direct user creation is disabled. Use invitation-based registration via /api/invitations.',
  });
};

exports.updateUser = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const targetUserId = Number(req.params.id);

    const [targetRows] = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND hospital_id = ? LIMIT 1',
      [targetUserId, hospitalId]
    );
    const targetUser = targetRows[0];
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.role === 'owner') {
      return res.status(403).json({ error: 'The hospital owner cannot be modified.' });
    }

    const { first_name, last_name, role, is_active } = req.body;

    if (role && role === 'owner') {
      return res.status(400).json({ error: 'Cannot assign owner role.' });
    }

    await db.query(
      'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ? AND hospital_id = ?',
      [
        first_name ?? null,
        last_name ?? null,
        role ?? null,
        typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
        targetUserId,
        hospitalId,
      ]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const targetUserId = Number(req.params.id);

    const [targetRows] = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND hospital_id = ? LIMIT 1',
      [targetUserId, hospitalId]
    );
    const targetUser = targetRows[0];
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.role === 'owner') {
      return res.status(403).json({ error: 'The hospital owner cannot be deleted.' });
    }

    await db.query('UPDATE users SET is_active = 0 WHERE id = ? AND hospital_id = ?', [targetUserId, hospitalId]);
    res.json({ message: 'User disabled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

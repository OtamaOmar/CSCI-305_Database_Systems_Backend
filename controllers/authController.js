const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function sha256Hex(value) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

async function getUserForResponse(userId) {
  const [rows] = await db.query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.hospital_id,
        h.name AS hospital
      FROM users u
      INNER JOIN hospitals h ON h.id = u.hospital_id
      WHERE u.id = ?
      LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

// Hospital onboarding (first registration)
// Creates a hospital + owner user + baseline departments/rooms.
const registerOwner = async (req, res) => {
  const { first_name, last_name, email, password, hospital_name, rooms_count } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const hospitalName = String(hospital_name || '').trim();
  const roomsCount = Number(rooms_count);

  if (!hospitalName) {
    return res.status(400).json({ error: 'Hospital name is required.' });
  }

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (!Number.isInteger(roomsCount) || roomsCount < 0 || roomsCount > 5000) {
    return res.status(400).json({ error: 'Rooms count must be a valid number.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[existingHospital]] = await connection.query(
      'SELECT id FROM hospitals WHERE name = ? LIMIT 1',
      [hospitalName]
    );
    if (existingHospital) {
      await connection.rollback();
      return res.status(409).json({ error: 'Hospital already exists.' });
    }

    const [hospitalResult] = await connection.query(
      'INSERT INTO hospitals (name, rooms_count) VALUES (?, ?)',
      [hospitalName, roomsCount]
    );
    const hospitalId = hospitalResult.insertId;

    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      'INSERT INTO users (hospital_id, first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, first_name, last_name, normalizedEmail, hashed, 'owner']
    );

    const ownerUserId = userResult.insertId;

    // Baseline departments
    const [deptResult] = await connection.query(
      'INSERT INTO departments (hospital_id, name, code, location, staff_count) VALUES (?, ?, ?, ?, ?)',
      [hospitalId, 'General', 'GEN', 'Main building', 0]
    );
    const defaultDepartmentId = deptResult.insertId;

    await connection.query(
      'INSERT INTO departments (hospital_id, name, code, location, staff_count) VALUES (?, ?, ?, ?, ?)',
      [hospitalId, 'Emergency', 'ER', 'Ground floor', 0]
    );

    // Rooms (optional initial generation)
    if (roomsCount > 0) {
      const roomValues = [];
      for (let index = 1; index <= roomsCount; index += 1) {
        const roomNumber = `R-${String(index).padStart(3, '0')}`;
        roomValues.push([hospitalId, roomNumber, 'General', 'Available', defaultDepartmentId]);
      }

      await connection.query(
        'INSERT INTO rooms (hospital_id, room_number, room_type, status, department_id) VALUES ?',
        [roomValues]
      );
    }

    await connection.commit();

    const token = signToken(ownerUserId);
    const user = await getUserForResponse(ownerUserId);
    res.status(201).json({ token, user });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// Invitation-based staff registration (creates a pending account)
const register = async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email) return res.status(400).json({ error: 'Invitation email is required.' });
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const normalizedEmail = normalizeEmail(email);
    const [rows] = await db.query(
      `
        SELECT *
        FROM invitations
        WHERE email = ?
          AND revoked_at IS NULL
          AND used_at IS NULL
          AND rejected_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [normalizedEmail]
    );

    const invitation = rows[0];
    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation email.' });
    }

    if (invitation.registered_user_id) {
      return res.status(409).json({ error: 'Invitation already registered. Please sign in.' });
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE hospital_id = ? AND email = ? LIMIT 1',
      [invitation.hospital_id, normalizedEmail]
    );
    if (existingUsers.length) {
      return res.status(409).json({ error: 'User already registered. Please sign in.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        'INSERT INTO users (hospital_id, first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [
          invitation.hospital_id,
          first_name,
          last_name,
          normalizedEmail,
          hashed,
          'pending',
        ]
      );

      const userId = userResult.insertId;
      await connection.query(
        'UPDATE invitations SET registered_user_id = ?, registered_at = NOW() WHERE id = ?',
        [userId, invitation.id]
      );
      await connection.commit();

      const tokenOut = signToken(userId);
      const user = await getUserForResponse(userId);
      res.status(201).json({ token: tokenOut, user });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPendingInvitation = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const [rows] = await db.query(
      `
        SELECT
          i.id,
          i.hospital_id,
          i.email,
          i.role,
          h.name AS hospital_name,
          DATE_FORMAT(i.expires_at, '%Y-%m-%dT%H:%i:%s') AS expires_at,
          DATE_FORMAT(i.registered_at, '%Y-%m-%dT%H:%i:%s') AS registered_at,
          DATE_FORMAT(i.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM invitations i
        INNER JOIN hospitals h ON h.id = i.hospital_id
        WHERE i.registered_user_id = ?
          AND i.used_at IS NULL
          AND i.rejected_at IS NULL
          AND i.revoked_at IS NULL
          AND i.expires_at > NOW()
        ORDER BY i.created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const acceptInvitation = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM invitations
        WHERE registered_user_id = ?
          AND used_at IS NULL
          AND rejected_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    const invitation = rows[0];
    if (!invitation) {
      return res.status(404).json({ error: 'No pending invitation found.' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE users SET role = ?, hospital_id = ?, is_active = 1 WHERE id = ?',
        [invitation.role, invitation.hospital_id, userId]
      );

      await connection.query(
        'UPDATE invitations SET used_at = NOW() WHERE id = ?',
        [invitation.id]
      );

      await connection.commit();

      const user = await getUserForResponse(userId);
      res.json({ user });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const rejectInvitation = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM invitations
        WHERE registered_user_id = ?
          AND used_at IS NULL
          AND rejected_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

    const invitation = rows[0];
    if (!invitation) {
      return res.status(404).json({ error: 'No pending invitation found.' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE invitations SET rejected_at = NOW() WHERE id = ?', [invitation.id]);
      await connection.query('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);

      await connection.commit();
      res.json({ message: 'Invitation rejected.' });
    } catch (err) {
      await connection.rollback();
      res.status(500).json({ error: err.message });
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = normalizeEmail(email);
    const [rows] = await db.query(
      `
        SELECT
          u.*,
          h.name AS hospital_name
        FROM users u
        INNER JOIN hospitals h ON h.id = u.hospital_id
        WHERE u.email = ?
        LIMIT 1
      `,
      [normalizedEmail]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    if (!rows[0].is_active) return res.status(401).json({ error: 'Account disabled.' });

    const { id, first_name, last_name, role, hospital_id, hospital_name } = rows[0];
    const token = signToken(id);
    res.json({ token, user: { id, first_name, last_name, email: normalizedEmail, role, hospital_id, hospital: hospital_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  registerOwner,
  register,
  login,
  getPendingInvitation,
  acceptInvitation,
  rejectInvitation,
};

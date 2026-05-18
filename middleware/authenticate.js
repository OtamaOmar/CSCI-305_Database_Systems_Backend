const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');

function parseBearerToken(value = '') {
  if (typeof value !== 'string') return '';
  const [scheme, token] = value.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== 'bearer') return '';
  return token || '';
}

module.exports = async function authenticate(req, res, next) {
  try {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Missing authorization token.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    if (!payload?.id) return res.status(401).json({ error: 'Invalid token payload.' });

    const [rows] = await db.query(
      `
        SELECT
          u.id,
          u.hospital_id,
          h.name AS hospital_name,
          u.first_name,
          u.last_name,
          u.email,
          u.role,
          u.is_active
        FROM users u
        INNER JOIN hospitals h ON h.id = u.hospital_id
        WHERE u.id = ?
        LIMIT 1
      `,
      [payload.id]
    );

    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Account disabled.' });

    req.user = {
      id: user.id,
      hospital_id: user.hospital_id,
      hospital: user.hospital_name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    };

    req.tenantId = user.hospital_id;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


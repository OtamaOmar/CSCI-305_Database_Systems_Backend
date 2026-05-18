const crypto = require('crypto');
const { db } = require('../db/connection');
const { sendInvitationEmail } = require('../utils/emailer');
const { emitNotification } = require('../utils/notifications');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

exports.listInvitations = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      `
        SELECT
          id,
          email,
          role,
          invited_by,
          DATE_FORMAT(expires_at, '%Y-%m-%dT%H:%i:%s') AS expires_at,
          DATE_FORMAT(used_at, '%Y-%m-%dT%H:%i:%s') AS used_at,
          DATE_FORMAT(revoked_at, '%Y-%m-%dT%H:%i:%s') AS revoked_at,
          DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM invitations
        WHERE hospital_id = ?
        ORDER BY created_at DESC, id DESC
      `,
      [hospitalId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createInvitation = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const actorUserId = req.user?.id || null;
    const email = normalizeEmail(req.body.email);
    const role = String(req.body.role || '').trim();

    if (!email) return res.status(400).json({ error: 'Email is required.' });
    if (!['admin', 'doctor', 'nurse'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for invitation.' });
    }

    const days = Number(req.body.expires_in_days ?? 7);
    const expiresAt = addDays(new Date(), Number.isFinite(days) && days > 0 ? days : 7);

    const tokenHash = sha256Hex(`${hospitalId}:${email}:${Date.now()}:${Math.random()}`);

    const [result] = await db.query(
      'INSERT INTO invitations (hospital_id, email, role, token_hash, invited_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, email, role, tokenHash, actorUserId, expiresAt]
    );

    const [[hospitalRow]] = await db.query('SELECT name FROM hospitals WHERE id = ? LIMIT 1', [hospitalId]);
    const hospitalName = hospitalRow?.name || 'your hospital';

    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const inviteUrl = `${frontendBaseUrl}/signup?email=${encodeURIComponent(email)}`;

    const emailResult = await sendInvitationEmail({ to: email, hospitalName, inviteUrl });

    await emitNotification({
      hospitalId,
      actorUserId,
      title: 'User invited',
      message: `${email} invited as ${role}.`,
      level: 'Info',
      type: 'audit',
      entity_type: 'invitation',
      entity_id: String(result.insertId),
    });

    res.status(201).json({
      id: result.insertId,
      email,
      role,
      expires_at: expiresAt.toISOString(),
      invite_url: inviteUrl,
      email_delivery: emailResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.revokeInvitation = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const invitationId = Number(req.params.id);

    const [result] = await db.query(
      'UPDATE invitations SET revoked_at = NOW() WHERE id = ? AND hospital_id = ? AND used_at IS NULL AND revoked_at IS NULL',
      [invitationId, hospitalId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invitation not found or already used/revoked.' });
    }

    res.json({ message: 'Invitation revoked successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

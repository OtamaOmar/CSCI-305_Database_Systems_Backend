const { db } = require('../db/connection');

const getAllNotifications = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE hospital_id = ? ORDER BY created_at DESC',
      [hospitalId]
    );
    const normalized = rows.map((row) => ({
      ...row,
      time: row.created_at,
    }));
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createNotification = async (req, res) => {
  const { title, message, level, type } = req.body;
  try {
    const hospitalId = req.tenantId;
    const actorUserId = req.user?.id || null;
    const [result] = await db.query(
      'INSERT INTO notifications (hospital_id, actor_user_id, title, message, `level`, type) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, actorUserId, title, message, level, type || 'system']
    );
    res.status(201).json({ message: 'Notification created successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllNotifications, createNotification };

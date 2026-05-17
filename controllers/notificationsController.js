const { db } = require('../db/connection');

const getAllNotifications = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
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
    const [result] = await db.query(
      'INSERT INTO notifications (title, message, level, type) VALUES (?, ?, ?, ?)',
      [title, message, level, type]
    );
    res.status(201).json({ message: 'Notification created successfully.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllNotifications, createNotification };

const { db } = require('../db/connection');

exports.getAllMessages = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM contact_messages WHERE hospital_id = ? ORDER BY created_at DESC',
      [hospitalId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM contact_messages WHERE id = ? AND hospital_id = ?',
      [req.params.id, hospitalId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { name, email, subject, message } = req.body;
    const [result] = await db.query(
      'INSERT INTO contact_messages (hospital_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      [hospitalId, name, email, subject, message]
    );
    res.status(201).json({ id: result.insertId, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    await db.query('DELETE FROM contact_messages WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

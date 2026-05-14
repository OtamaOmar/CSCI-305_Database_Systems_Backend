const { db } = require('../db/connection');

exports.getAllMessages = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contact_messages');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM contact_messages WHERE id = ?', [req.params.id]);
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
    const { name, email, subject, message } = req.body;
    const [result] = await db.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );
    res.status(201).json({ id: result.insertId, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    await db.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

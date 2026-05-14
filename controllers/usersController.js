const { db } = require('../db/connection');

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, role_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, email, phone, role_id) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, phone, role_id]
    );
    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, role_id } = req.body;
    await db.query(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, role_id = ? WHERE id = ?',
      [first_name, last_name, email, phone, role_id, req.params.id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

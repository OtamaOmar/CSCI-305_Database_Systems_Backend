const { db } = require('../db/connection');

exports.getAllRoles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { role_name, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO roles (role_name, description) VALUES (?, ?)',
      [role_name, description]
    );
    res.status(201).json({ id: result.insertId, message: 'Role created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role_name, description } = req.body;
    await db.query(
      'UPDATE roles SET role_name = ?, description = ? WHERE id = ?',
      [role_name, description, req.params.id]
    );
    res.json({ message: 'Role updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    await db.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

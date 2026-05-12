const { db } = require('../db/connection');

const getAllDoctors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDoctor = async (req, res) => {
  const { id, name, email, specialty, department, shift, status, phone, notes } = req.body;
  try {
    await db.query(
      'INSERT INTO doctors (id, name, email, specialty, department, shift, status, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, specialty, department, shift, status, phone || null, notes || null]
    );
    res.status(201).json({ message: 'Doctor created successfully.', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { name, email, specialty, department, shift, status, phone, notes } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE doctors SET name = ?, email = ?, specialty = ?, department = ?, shift = ?, status = ?, phone = ?, notes = ? WHERE id = ?',
      [name, email, specialty, department, shift, status, phone || null, notes || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Doctor not found.' });
    res.json({ message: 'Doctor updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM doctors WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Doctor not found.' });
    res.json({ message: 'Doctor deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllDoctors, createDoctor, updateDoctor, deleteDoctor };

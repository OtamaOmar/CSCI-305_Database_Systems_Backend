const { db } = require('../db/connection');

const getAllCases = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM emergency_cases ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCase = async (req, res) => {
  const {
    id,
    name,
    age,
    gender,
    complaint,
    room,
    doctor,
    severity,
    status,
    arrival_time,
    notes,
  } = req.body;
  const normalizedArrival = arrival_time
    ? String(arrival_time).replace('T', ' ').trim()
    : null;

  try {
    await db.query(
      'INSERT INTO emergency_cases (id, name, age, gender, complaint, room, doctor, severity, status, arrival_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        age,
        gender,
        complaint,
        room,
        doctor,
        severity,
        status,
        normalizedArrival,
        notes || null,
      ]
    );
    res.status(201).json({ message: 'Case created successfully.', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCase = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    age,
    gender,
    complaint,
    room,
    doctor,
    severity,
    status,
    arrival_time,
    notes,
  } = req.body;
  const normalizedArrival = arrival_time
    ? String(arrival_time).replace('T', ' ').trim()
    : null;

  try {
    const [result] = await db.query(
      'UPDATE emergency_cases SET name = ?, age = ?, gender = ?, complaint = ?, room = ?, doctor = ?, severity = ?, status = ?, arrival_time = ?, notes = ? WHERE id = ?',
      [
        name,
        age,
        gender,
        complaint,
        room,
        doctor,
        severity,
        status,
        normalizedArrival,
        notes || null,
        id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Case not found.' });
    res.json({ message: 'Case updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCase = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM emergency_cases WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Case not found.' });
    res.json({ message: 'Case deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllCases, createCase, updateCase, deleteCase };

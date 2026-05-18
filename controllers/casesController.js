const { db } = require('../db/connection');
const { generatePrefixedId } = require('../utils/entityResolvers');

const getAllCases = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM emergency_cases WHERE hospital_id = ? ORDER BY created_at DESC',
      [hospitalId]
    );
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
    const hospitalId = req.tenantId;
    const caseId = id || await generatePrefixedId('emergency_cases', 'CAS', hospitalId);
    await db.query(
      'INSERT INTO emergency_cases (id, hospital_id, name, age, gender, complaint, room, doctor, severity, status, arrival_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        caseId,
        hospitalId,
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
    res.status(201).json({ message: 'Case created successfully.', id: caseId });
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
    const hospitalId = req.tenantId;
    const [result] = await db.query(
      'UPDATE emergency_cases SET name = ?, age = ?, gender = ?, complaint = ?, room = ?, doctor = ?, severity = ?, status = ?, arrival_time = ?, notes = ? WHERE id = ? AND hospital_id = ?',
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
        hospitalId,
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
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM emergency_cases WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Case not found.' });
    res.json({ message: 'Case deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllCases, createCase, updateCase, deleteCase };

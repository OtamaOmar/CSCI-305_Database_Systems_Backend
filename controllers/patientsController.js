const { db } = require('../db/connection');
const { generatePrefixedId } = require('../utils/entityResolvers');

const getAllPatients = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      'SELECT * FROM patients WHERE hospital_id = ? ORDER BY created_at DESC',
      [hospitalId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPatient = async (req, res) => {
  const { id, name, age, gender, condition, doctor, bay, level } = req.body;
  try {
    const hospitalId = req.tenantId;
    const patientId = id || await generatePrefixedId('patients', 'PAT', hospitalId);
    await db.query(
      'INSERT INTO patients (id, hospital_id, name, age, gender, `condition`, doctor, bay, `level`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [patientId, hospitalId, name, age, gender, condition, doctor, bay, level]
    );
    res.status(201).json({ message: 'Patient created successfully.', id: patientId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePatient = async (req, res) => {
  const { id } = req.params;
  const { name, age, gender, condition, doctor, bay, level } = req.body;
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query(
      'UPDATE patients SET name = ?, age = ?, gender = ?, `condition` = ?, doctor = ?, bay = ?, `level` = ? WHERE id = ? AND hospital_id = ?',
      [name, age, gender, condition, doctor, bay, level, id, hospitalId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Patient not found.' });
    res.json({ message: 'Patient updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePatient = async (req, res) => {
  const { id } = req.params;
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM patients WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Patient not found.' });
    res.json({ message: 'Patient deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllPatients, createPatient, updatePatient, deletePatient };

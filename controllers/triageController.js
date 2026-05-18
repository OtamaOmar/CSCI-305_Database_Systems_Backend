const { db } = require('../db/connection');

exports.getAllTriageCases = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM triage WHERE hospital_id = ? ORDER BY created_at DESC', [hospitalId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTriageCaseById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM triage WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Triage case not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTriageCase = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { patient_id, priority_level, symptoms, assessment, assigned_doctor_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO triage (hospital_id, patient_id, priority_level, symptoms, assessment, assigned_doctor_id) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, patient_id, priority_level, symptoms, assessment, assigned_doctor_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Triage case created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTriageCase = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { patient_id, priority_level, symptoms, assessment, assigned_doctor_id } = req.body;
    await db.query(
      'UPDATE triage SET patient_id = ?, priority_level = ?, symptoms = ?, assessment = ?, assigned_doctor_id = ? WHERE id = ? AND hospital_id = ?',
      [patient_id, priority_level, symptoms, assessment, assigned_doctor_id, req.params.id, hospitalId]
    );
    res.json({ message: 'Triage case updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTriageCase = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    await db.query('DELETE FROM triage WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    res.json({ message: 'Triage case deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

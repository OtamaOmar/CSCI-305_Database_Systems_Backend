const { db } = require('../db/connection');
const { generatePrefixedId, resolveDepartment } = require('../utils/entityResolvers');

const getAllDoctors = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query(
      `
        SELECT
          d.id,
          d.name,
          d.email,
          d.specialty,
          dep.name AS department,
          d.department_id,
          d.shift,
          d.status,
          d.phone,
          d.notes,
          DATE_FORMAT(d.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM doctors d
        LEFT JOIN departments dep ON dep.id = d.department_id
        WHERE d.hospital_id = ?
        ORDER BY d.created_at DESC
      `,
      [hospitalId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createDoctor = async (req, res) => {
  const { id, name, email, specialty, shift, status, phone, notes } = req.body;
  try {
    const hospitalId = req.tenantId;
    const department = await resolveDepartment(req.body, hospitalId);
    if (!department) {
      return res.status(400).json({ error: 'Doctor department is required.' });
    }

    const doctorId = id || await generatePrefixedId('doctors', 'DOC', hospitalId);
    await db.query(
      'INSERT INTO doctors (id, hospital_id, name, email, specialty, department_id, shift, status, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doctorId, hospitalId, name, email, specialty, department.id, shift, status, phone || null, notes || null]
    );
    res.status(201).json({ message: 'Doctor created successfully.', id: doctorId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { name, email, specialty, shift, status, phone, notes } = req.body;
  try {
    const hospitalId = req.tenantId;
    const department = await resolveDepartment(req.body, hospitalId);
    if (!department) {
      return res.status(400).json({ error: 'Doctor department is required.' });
    }

    const [result] = await db.query(
      'UPDATE doctors SET name = ?, email = ?, specialty = ?, department_id = ?, shift = ?, status = ?, phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE id = ? AND hospital_id = ?',
      [name, email, specialty, department.id, shift, status, phone || null, notes || null, id, hospitalId]
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
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM doctors WHERE id = ? AND hospital_id = ?', [id, hospitalId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Doctor not found.' });
    res.json({ message: 'Doctor deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllDoctors, createDoctor, updateDoctor, deleteDoctor };

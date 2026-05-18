const { db } = require('../db/connection');

async function fetchDepartmentRows(hospitalId, extraWhere = '', extraParams = []) {
  const whereParts = ['dep.hospital_id = ?'];
  const params = [hospitalId];

  if (extraWhere) {
    whereParts.push(extraWhere);
    params.push(...extraParams);
  }

  const whereClause = `WHERE ${whereParts.join(' AND ')}`;

  const [rows] = await db.query(
    `
      SELECT
        dep.id,
        dep.hospital_id,
        dep.name,
        dep.code,
        dep.chairman_id,
        dep.location,
        dep.staff_count,
        DATE_FORMAT(dep.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at,
        doc.name AS chairman,
        (
          SELECT COUNT(DISTINCT a.patient_id)
          FROM appointments a
          INNER JOIN doctors d2 ON d2.id = a.doctor_id AND d2.hospital_id = a.hospital_id
          WHERE a.hospital_id = dep.hospital_id AND d2.department_id = dep.id
        ) AS patient_count
      FROM departments dep
      LEFT JOIN doctors doc ON doc.id = dep.chairman_id AND doc.hospital_id = dep.hospital_id
      ${whereClause}
      ORDER BY dep.name ASC
    `,
    params
  );

  return rows;
}

exports.getAllDepartments = async (req, res) => {
  try {
    const rows = await fetchDepartmentRows(req.tenantId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const rows = await fetchDepartmentRows(req.tenantId, 'dep.id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { name, code, chairman_id, location, staff_count } = req.body;
    const [result] = await db.query(
      'INSERT INTO departments (hospital_id, name, code, chairman_id, location, staff_count) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, name, code, chairman_id || null, location, staff_count || 0]
    );

    const rows = await fetchDepartmentRows(hospitalId, 'dep.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { name, code, chairman_id, location, staff_count } = req.body;
    const [result] = await db.query(
      'UPDATE departments SET name = ?, code = ?, chairman_id = ?, location = ?, staff_count = ? WHERE id = ? AND hospital_id = ?',
      [name, code, chairman_id || null, location, staff_count || 0, req.params.id, hospitalId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const rows = await fetchDepartmentRows(hospitalId, 'dep.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM departments WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

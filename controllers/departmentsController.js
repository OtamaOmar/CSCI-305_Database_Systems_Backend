const { db } = require('../db/connection');

async function fetchDepartmentRows(whereClause = '', params = []) {
  const [rows] = await db.query(
    `
      SELECT
        dep.id,
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
          INNER JOIN doctors d2 ON d2.id = a.doctor_id
          WHERE d2.department = dep.name
        ) AS patient_count
      FROM departments dep
      LEFT JOIN doctors doc ON doc.id = dep.chairman_id
      ${whereClause}
      ORDER BY dep.name ASC
    `,
    params
  );

  return rows;
}

exports.getAllDepartments = async (req, res) => {
  try {
    const rows = await fetchDepartmentRows();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const rows = await fetchDepartmentRows('WHERE dep.id = ?', [req.params.id]);
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
    const { name, code, chairman_id, location, staff_count } = req.body;
    const [result] = await db.query(
      'INSERT INTO departments (name, code, chairman_id, location, staff_count) VALUES (?, ?, ?, ?, ?)',
      [name, code, chairman_id || null, location, staff_count || 0]
    );

    const rows = await fetchDepartmentRows('WHERE dep.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name, code, chairman_id, location, staff_count } = req.body;
    const [result] = await db.query(
      'UPDATE departments SET name = ?, code = ?, chairman_id = ?, location = ?, staff_count = ? WHERE id = ?',
      [name, code, chairman_id || null, location, staff_count || 0, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const rows = await fetchDepartmentRows('WHERE dep.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

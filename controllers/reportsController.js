const { db } = require('../db/connection');

exports.getReportsDashboard = async (req, res) => {
  try {
    const hospitalId = req.tenantId;

    const [patientsPerDepartment] = await db.query(
      `
        SELECT
          dep.id,
          dep.name,
          COUNT(DISTINCT a.patient_id) AS patient_count
        FROM departments dep
        LEFT JOIN doctors d ON d.department_id = dep.id AND d.hospital_id = dep.hospital_id
        LEFT JOIN appointments a ON a.doctor_id = d.id AND a.hospital_id = dep.hospital_id
        WHERE dep.hospital_id = ?
        GROUP BY dep.id
        ORDER BY patient_count DESC, dep.name ASC
      `,
      [hospitalId]
    );

    const [doctorWorkload] = await db.query(
      `
        SELECT
          d.id,
          d.name,
          COUNT(a.id) AS appointment_count
        FROM doctors d
        LEFT JOIN appointments a ON a.doctor_id = d.id AND a.hospital_id = d.hospital_id
        WHERE d.hospital_id = ?
        GROUP BY d.id
        ORDER BY appointment_count DESC, d.name ASC
        LIMIT 10
      `,
      [hospitalId]
    );

    const [roomStats] = await db.query(
      'SELECT status, COUNT(*) as count FROM rooms WHERE hospital_id = ? GROUP BY status',
      [hospitalId]
    );

    const [emergencyStats] = await db.query(
      'SELECT severity, COUNT(*) as count FROM emergency_cases WHERE hospital_id = ? GROUP BY severity',
      [hospitalId]
    );

    res.json({
      patientsPerDepartment,
      doctorWorkload,
      roomAllocation: roomStats || [],
      emergencyStats: emergencyStats || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM reports WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

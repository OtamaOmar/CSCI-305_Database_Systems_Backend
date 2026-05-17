const { db } = require('../db/connection');

exports.getReportsDashboard = async (req, res) => {
  try {
    // Get patients per department
    const [patientsPerDept] = await db.query(
      'SELECT COUNT(*) as patient_count FROM patients WHERE department_id IS NOT NULL'
    );
    
    // Get doctor workload
    const [doctorWorkload] = await db.query(
      'SELECT COUNT(*) as appointment_count FROM appointments'
    );
    
    // Get room statistics
    const [roomStats] = await db.query(
      'SELECT status, COUNT(*) as count FROM rooms GROUP BY status'
    );
    
    // Get emergency statistics
    const [emergencyStats] = await db.query(
      'SELECT severity, COUNT(*) as count FROM cases GROUP BY severity'
    );

    res.json({
      patientsPerDepartment: patientsPerDept[0] || {},
      doctorWorkload: doctorWorkload[0] || {},
      roomAllocation: roomStats || [],
      emergencyStats: emergencyStats || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

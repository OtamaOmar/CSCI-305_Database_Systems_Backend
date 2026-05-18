const { db } = require('../db/connection');

exports.getDashboardStats = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [[patients]] = await db.query('SELECT COUNT(*) as count FROM patients WHERE hospital_id = ?', [hospitalId]);
    const [[doctors]] = await db.query('SELECT COUNT(*) as count FROM doctors WHERE hospital_id = ?', [hospitalId]);
    const [[appointments]] = await db.query('SELECT COUNT(*) as count FROM appointments WHERE hospital_id = ?', [hospitalId]);
    const [[cases]] = await db.query('SELECT COUNT(*) as count FROM emergency_cases WHERE hospital_id = ?', [hospitalId]);

    res.json({
      totalPatients: patients.count,
      totalDoctors: doctors.count,
      totalAppointments: appointments.count,
      totalCases: cases.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

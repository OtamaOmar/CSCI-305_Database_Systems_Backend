const { db } = require('../db/connection');

exports.getDashboardStats = async (req, res) => {
  try {
    const [patients] = await db.query('SELECT COUNT(*) as count FROM patients');
    const [doctors] = await db.query('SELECT COUNT(*) as count FROM doctors');
    const [appointments] = await db.query('SELECT COUNT(*) as count FROM appointments');
    const [cases] = await db.query('SELECT COUNT(*) as count FROM cases');

    res.json({
      totalPatients: patients[0].count,
      totalDoctors: doctors[0].count,
      totalAppointments: appointments[0].count,
      totalCases: cases[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { db } = require('../db/connection');
const { pickFirstNonEmpty, resolveDoctor, resolvePatient } = require('../utils/entityResolvers');

const appointmentStatusMap = {
  Scheduled: 'Scheduled',
  scheduled: 'Scheduled',
  Confirmed: 'Scheduled',
  Pending: 'Scheduled',
  Completed: 'Completed',
  completed: 'Completed',
  Cancelled: 'Cancelled',
  cancelled: 'Cancelled',
};

function normalizeAppointmentStatus(value) {
  const normalized = pickFirstNonEmpty(value);
  return appointmentStatusMap[normalized] || 'Scheduled';
}

async function fetchAppointmentRows(whereClause = '', params = []) {
  const [rows] = await db.query(
    `
      SELECT
        a.id,
        a.patient_id,
        p.name AS patient_name,
        a.doctor_id,
        d.name AS doctor_name,
        d.department,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        TIME_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
        a.status,
        DATE_FORMAT(a.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
      FROM appointments a
      INNER JOIN patients p ON p.id = a.patient_id
      INNER JOIN doctors d ON d.id = a.doctor_id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC, a.id DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    patient: row.patient_name,
    doctor: row.doctor_name,
    date: row.appointment_date,
    time: row.appointment_time,
    payment: 'Not tracked',
    refund: 'Not requested',
  }));
}

exports.getAllAppointments = async (req, res) => {
  try {
    const rows = await fetchAppointmentRows();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const rows = await fetchAppointmentRows('WHERE a.id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const patient = await resolvePatient(req.body);
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before saving the appointment.' });
    }

    const doctor = await resolveDoctor(req.body);
    if (!doctor) {
      return res.status(400).json({ error: 'Select an existing doctor before saving the appointment.' });
    }

    const appointmentDate = pickFirstNonEmpty(req.body.appointment_date, req.body.date);
    const appointmentTime = pickFirstNonEmpty(req.body.appointment_time, req.body.time);

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Appointment date and time are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?)',
      [patient.id, doctor.id, appointmentDate, appointmentTime, normalizeAppointmentStatus(req.body.status)]
    );

    const rows = await fetchAppointmentRows('WHERE a.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const [existingRows] = await db.query('SELECT * FROM appointments WHERE id = ? LIMIT 1', [req.params.id]);
    const existingAppointment = existingRows[0];

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const shouldResolvePatient = Boolean(
      pickFirstNonEmpty(req.body.patient_id, req.body.patient, req.body.patient_name)
    );
    const shouldResolveDoctor = Boolean(
      pickFirstNonEmpty(req.body.doctor_id, req.body.doctor, req.body.doctor_name)
    );

    const patient = shouldResolvePatient
      ? await resolvePatient(req.body)
      : { id: existingAppointment.patient_id };
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before updating the appointment.' });
    }

    const doctor = shouldResolveDoctor
      ? await resolveDoctor(req.body)
      : { id: existingAppointment.doctor_id };
    if (!doctor) {
      return res.status(400).json({ error: 'Select an existing doctor before updating the appointment.' });
    }

    const appointmentDate =
      pickFirstNonEmpty(req.body.appointment_date, req.body.date) || existingAppointment.appointment_date;
    const appointmentTime =
      pickFirstNonEmpty(req.body.appointment_time, req.body.time) || existingAppointment.appointment_time;
    const status = pickFirstNonEmpty(req.body.status)
      ? normalizeAppointmentStatus(req.body.status)
      : existingAppointment.status;

    await db.query(
      'UPDATE appointments SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ? WHERE id = ?',
      [patient.id, doctor.id, appointmentDate, appointmentTime, status, req.params.id]
    );

    const rows = await fetchAppointmentRows('WHERE a.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

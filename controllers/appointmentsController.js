const { db } = require('../db/connection');
const { pickFirstNonEmpty, resolveDoctor, resolvePatient } = require('../utils/entityResolvers');
const { emitNotification } = require('../utils/notifications');

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

async function fetchAppointmentRows(hospitalId, extraWhere = '', extraParams = []) {
  const whereParts = ['a.hospital_id = ?'];
  const params = [hospitalId];

  if (extraWhere) {
    whereParts.push(extraWhere);
    params.push(...extraParams);
  }

  const whereClause = `WHERE ${whereParts.join(' AND ')}`;

  const [rows] = await db.query(
    `
      SELECT
        a.id,
        a.hospital_id,
        a.patient_id,
        p.name AS patient_name,
        a.doctor_id,
        d.name AS doctor_name,
        dep.name AS department,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        TIME_FORMAT(a.appointment_time, '%H:%i') AS appointment_time,
        a.status,
        DATE_FORMAT(a.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
      FROM appointments a
      INNER JOIN patients p ON p.id = a.patient_id AND p.hospital_id = a.hospital_id
      INNER JOIN doctors d ON d.id = a.doctor_id AND d.hospital_id = a.hospital_id
      LEFT JOIN departments dep ON dep.id = d.department_id
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
    const rows = await fetchAppointmentRows(req.tenantId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const rows = await fetchAppointmentRows(req.tenantId, 'a.id = ?', [req.params.id]);
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
    const hospitalId = req.tenantId;
    const patient = await resolvePatient(req.body, hospitalId);
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before saving the appointment.' });
    }

    const doctor = await resolveDoctor(req.body, hospitalId);
    if (!doctor) {
      return res.status(400).json({ error: 'Select an existing doctor before saving the appointment.' });
    }

    const appointmentDate = pickFirstNonEmpty(req.body.appointment_date, req.body.date);
    const appointmentTime = pickFirstNonEmpty(req.body.appointment_time, req.body.time);

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Appointment date and time are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO appointments (hospital_id, patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, patient.id, doctor.id, appointmentDate, appointmentTime, normalizeAppointmentStatus(req.body.status)]
    );

    await emitNotification({
      hospitalId,
      actorUserId: req.user?.id || null,
      title: 'Appointment created',
      message: `Appointment scheduled for ${patient.name} with ${doctor.name} on ${appointmentDate} at ${appointmentTime}.`,
      level: 'Info',
      type: 'audit',
      entity_type: 'appointment',
      entity_id: String(result.insertId),
    });

    const rows = await fetchAppointmentRows(hospitalId, 'a.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [existingRows] = await db.query(
      'SELECT * FROM appointments WHERE id = ? AND hospital_id = ? LIMIT 1',
      [req.params.id, hospitalId]
    );
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
      ? await resolvePatient(req.body, hospitalId)
      : { id: existingAppointment.patient_id };
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before updating the appointment.' });
    }

    const doctor = shouldResolveDoctor
      ? await resolveDoctor(req.body, hospitalId)
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
      'UPDATE appointments SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ? WHERE id = ? AND hospital_id = ?',
      [patient.id, doctor.id, appointmentDate, appointmentTime, status, req.params.id, hospitalId]
    );

    const rows = await fetchAppointmentRows(hospitalId, 'a.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query(
      'DELETE FROM appointments WHERE id = ? AND hospital_id = ?',
      [req.params.id, hospitalId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

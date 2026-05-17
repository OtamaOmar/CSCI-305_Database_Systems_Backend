const { db } = require('../db/connection');
const { pickFirstNonEmpty, resolveDoctor, resolvePatient } = require('../utils/entityResolvers');

async function fetchPrescriptionRows(whereClause = '', params = []) {
  const [rows] = await db.query(
    `
      SELECT
        pr.id,
        pr.patient_id,
        p.name AS patient_name,
        pr.doctor_id,
        d.name AS doctor_name,
        pr.medication,
        pr.dosage,
        pr.directions,
        DATE_FORMAT(pr.start_date, '%Y-%m-%d') AS start_date,
        CASE
          WHEN pr.end_date IS NULL THEN NULL
          ELSE DATE_FORMAT(pr.end_date, '%Y-%m-%d')
        END AS end_date,
        pr.notes,
        DATE_FORMAT(pr.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
      FROM prescriptions pr
      INNER JOIN patients p ON p.id = pr.patient_id
      INNER JOIN doctors d ON d.id = pr.doctor_id
      ${whereClause}
      ORDER BY pr.created_at DESC, pr.id DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    patient: row.patient_name,
    doctor: row.doctor_name,
  }));
}

exports.getAllPrescriptions = async (req, res) => {
  try {
    const rows = await fetchPrescriptionRows();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPrescriptionById = async (req, res) => {
  try {
    const rows = await fetchPrescriptionRows('WHERE pr.id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const patient = await resolvePatient(req.body);
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before saving the prescription.' });
    }

    const doctor = await resolveDoctor(req.body);
    if (!doctor) {
      return res.status(400).json({ error: 'Select an existing doctor before saving the prescription.' });
    }

    const medication = pickFirstNonEmpty(req.body.medication);
    const dosage = pickFirstNonEmpty(req.body.dosage);
    const directions = pickFirstNonEmpty(req.body.directions);
    const startDate = pickFirstNonEmpty(req.body.start_date, req.body.start);
    const endDate = pickFirstNonEmpty(req.body.end_date, req.body.end) || null;
    const notes = pickFirstNonEmpty(req.body.notes) || null;

    if (!medication || !dosage || !directions || !startDate) {
      return res.status(400).json({ error: 'Medication, dosage, directions, and start date are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO prescriptions (patient_id, doctor_id, medication, dosage, directions, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient.id, doctor.id, medication, dosage, directions, startDate, endDate, notes]
    );

    const rows = await fetchPrescriptionRows('WHERE pr.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const [existingRows] = await db.query('SELECT * FROM prescriptions WHERE id = ? LIMIT 1', [req.params.id]);
    const existingPrescription = existingRows[0];

    if (!existingPrescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const shouldResolvePatient = Boolean(
      pickFirstNonEmpty(req.body.patient_id, req.body.patient, req.body.patient_name)
    );
    const shouldResolveDoctor = Boolean(
      pickFirstNonEmpty(req.body.doctor_id, req.body.doctor, req.body.doctor_name)
    );

    const patient = shouldResolvePatient
      ? await resolvePatient(req.body)
      : { id: existingPrescription.patient_id };
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before updating the prescription.' });
    }

    const doctor = shouldResolveDoctor
      ? await resolveDoctor(req.body)
      : { id: existingPrescription.doctor_id };
    if (!doctor) {
      return res.status(400).json({ error: 'Select an existing doctor before updating the prescription.' });
    }

    const medication = pickFirstNonEmpty(req.body.medication) || existingPrescription.medication;
    const dosage = pickFirstNonEmpty(req.body.dosage) || existingPrescription.dosage;
    const directions = pickFirstNonEmpty(req.body.directions) || existingPrescription.directions;
    const startDate =
      pickFirstNonEmpty(req.body.start_date, req.body.start) || existingPrescription.start_date;
    const endDate =
      pickFirstNonEmpty(req.body.end_date, req.body.end)
      || existingPrescription.end_date
      || null;
    const notes = pickFirstNonEmpty(req.body.notes) || existingPrescription.notes || null;

    await db.query(
      'UPDATE prescriptions SET patient_id = ?, doctor_id = ?, medication = ?, dosage = ?, directions = ?, start_date = ?, end_date = ?, notes = ? WHERE id = ?',
      [patient.id, doctor.id, medication, dosage, directions, startDate, endDate, notes, req.params.id]
    );

    const rows = await fetchPrescriptionRows('WHERE pr.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM prescriptions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

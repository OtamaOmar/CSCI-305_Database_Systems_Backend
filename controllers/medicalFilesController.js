const { db } = require('../db/connection');
const { pickFirstNonEmpty, resolvePatient } = require('../utils/entityResolvers');
const { emitNotification } = require('../utils/notifications');

const fileTypeMap = {
  'X-Ray': 'X-Ray',
  'Blood Report': 'Blood Test',
  'CT Scan': 'CT Scan',
  'MRI Scan': 'MRI',
  'Medical Note': 'Prescription',
};

function normalizeFileType(value) {
  const normalized = pickFirstNonEmpty(value);
  return fileTypeMap[normalized] || normalized || 'Other';
}

async function fetchMedicalFileRows(whereClause = '', params = []) {
  const [rows] = await db.query(
    `
      SELECT
        mf.id,
        mf.patient_id,
        p.name AS patient_name,
        mf.file_type,
        mf.file_name,
        mf.file_url,
        DATE_FORMAT(mf.uploaded_date, '%Y-%m-%d') AS uploaded_date
      FROM medical_files mf
      INNER JOIN patients p ON p.id = mf.patient_id AND p.hospital_id = mf.hospital_id
      ${whereClause}
      ORDER BY mf.uploaded_date DESC, mf.id DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    patient: row.patient_name,
    created_at: row.uploaded_date,
    size: null,
  }));
}

exports.getAllMedicalFiles = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const rows = await fetchMedicalFileRows('WHERE mf.hospital_id = ?', [hospitalId]);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMedicalFileById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const rows = await fetchMedicalFileRows('WHERE mf.id = ? AND mf.hospital_id = ?', [req.params.id, hospitalId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Medical file not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMedicalFile = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const patient = await resolvePatient(req.body, hospitalId);
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before uploading a file.' });
    }

    const fileName = pickFirstNonEmpty(req.body.file_name, req.body.file_url);
    if (!fileName) {
      return res.status(400).json({ error: 'A file name is required.' });
    }

    const [result] = await db.query(
      'INSERT INTO medical_files (hospital_id, patient_id, file_type, file_name, file_url, uploaded_date) VALUES (?, ?, ?, ?, ?, NOW())',
      [hospitalId, patient.id, normalizeFileType(req.body.file_type || req.body.type), fileName, fileName]
    );

    await emitNotification({
      hospitalId,
      actorUserId: req.user?.id || null,
      title: 'Medical file uploaded',
      message: `${fileName} uploaded for ${patient.name}.`,
      level: 'Info',
      type: 'audit',
      entity_type: 'medical_file',
      entity_id: String(result.insertId),
    });

    const rows = await fetchMedicalFileRows('WHERE mf.id = ? AND mf.hospital_id = ?', [result.insertId, hospitalId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMedicalFile = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [existingRows] = await db.query(
      'SELECT * FROM medical_files WHERE id = ? AND hospital_id = ? LIMIT 1',
      [req.params.id, hospitalId]
    );
    const existingFile = existingRows[0];

    if (!existingFile) {
      return res.status(404).json({ error: 'Medical file not found' });
    }

    const shouldResolvePatient = Boolean(
      pickFirstNonEmpty(req.body.patient_id, req.body.patient, req.body.patient_name)
    );
    const patient = shouldResolvePatient
      ? await resolvePatient(req.body, hospitalId)
      : { id: existingFile.patient_id };
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before updating the file.' });
    }

    const fileName = pickFirstNonEmpty(req.body.file_name, req.body.file_url) || existingFile.file_name;
    const fileType = pickFirstNonEmpty(req.body.file_type, req.body.type)
      ? normalizeFileType(req.body.file_type || req.body.type)
      : existingFile.file_type;

    await db.query(
      'UPDATE medical_files SET patient_id = ?, file_type = ?, file_name = ?, file_url = ? WHERE id = ? AND hospital_id = ?',
      [patient.id, fileType, fileName, fileName, req.params.id, hospitalId]
    );

    const rows = await fetchMedicalFileRows('WHERE mf.id = ? AND mf.hospital_id = ?', [req.params.id, hospitalId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMedicalFile = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM medical_files WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medical file not found' });
    }

    res.json({ message: 'Medical file deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

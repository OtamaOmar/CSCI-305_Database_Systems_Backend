const { db } = require('../db/connection');
const { pickFirstNonEmpty, resolvePatient } = require('../utils/entityResolvers');
const { emitNotification } = require('../utils/notifications');

async function fetchHospitalFileRows(hospitalId, extraWhere = '', extraParams = []) {
  const whereParts = ['hf.hospital_id = ?'];
  const params = [hospitalId];

  if (extraWhere) {
    whereParts.push(extraWhere);
    params.push(...extraParams);
  }

  const whereClause = `WHERE ${whereParts.join(' AND ')}`;

  const [rows] = await db.query(
    `
      SELECT
        hf.id,
        hf.hospital_id,
        hf.patient_id,
        p.name AS patient_name,
        hf.uploaded_by,
        hf.file_name,
        hf.file_type,
        hf.mime_type,
        hf.parsed_data,
        DATE_FORMAT(hf.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
      FROM hospital_files hf
      LEFT JOIN patients p ON p.id = hf.patient_id AND p.hospital_id = hf.hospital_id
      ${whereClause}
      ORDER BY hf.created_at DESC, hf.id DESC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    patient: row.patient_name || null,
  }));
}

exports.getAllHospitalFiles = async (req, res) => {
  try {
    const rows = await fetchHospitalFileRows(req.tenantId);
    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHospitalFileById = async (req, res) => {
  try {
    const rows = await fetchHospitalFileRows(req.tenantId, 'hf.id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'File not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createHospitalFile = async (req, res) => {
  try {
    const hospitalId = req.tenantId;

    const fileName = pickFirstNonEmpty(req.body.file_name, req.body.name);
    if (!fileName) return res.status(400).json({ error: 'File name is required.' });

    const fileType = pickFirstNonEmpty(req.body.file_type, req.body.type) || 'OTHER';
    const mimeType = pickFirstNonEmpty(req.body.mime_type) || null;

    const patientLookup = pickFirstNonEmpty(req.body.patient_id, req.body.patient, req.body.patient_name);
    const patient = patientLookup ? await resolvePatient(req.body, hospitalId) : null;

    const parsedData = req.body.parsed_data ?? null;

    const [result] = await db.query(
      'INSERT INTO hospital_files (hospital_id, patient_id, uploaded_by, file_name, file_type, mime_type, parsed_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [hospitalId, patient?.id || null, req.user?.id || null, fileName, fileType, mimeType, parsedData ? JSON.stringify(parsedData) : null]
    );

    await emitNotification({
      hospitalId,
      actorUserId: req.user?.id || null,
      title: 'File uploaded',
      message: `${fileName} uploaded${patient?.name ? ` for ${patient.name}` : ''}.`,
      level: 'Info',
      type: 'audit',
      entity_type: 'hospital_file',
      entity_id: String(result.insertId),
    });

    const rows = await fetchHospitalFileRows(hospitalId, 'hf.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteHospitalFile = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM hospital_files WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'File not found.' });
    res.json({ message: 'File deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const { db } = require('../db/connection');

async function fetchRoomRows(hospitalId, extraWhere = '', extraParams = []) {
  const whereParts = ['r.hospital_id = ?'];
  const params = [hospitalId];

  if (extraWhere) {
    whereParts.push(extraWhere);
    params.push(...extraParams);
  }

  const whereClause = `WHERE ${whereParts.join(' AND ')}`;

  const [rows] = await db.query(
    `
      SELECT
        r.id,
        r.hospital_id,
        r.room_number,
        r.room_type,
        r.status,
        d.name AS department_name,
        latest_reservation.patient_name,
        latest_reservation.check_in_date
      FROM rooms r
      LEFT JOIN departments d ON d.id = r.department_id AND d.hospital_id = r.hospital_id
      LEFT JOIN (
        SELECT
          rr.room_id,
          p.name AS patient_name,
          DATE_FORMAT(rr.check_in_date, '%Y-%m-%d') AS check_in_date
        FROM room_reservations rr
        INNER JOIN rooms r2 ON r2.id = rr.room_id AND r2.hospital_id = rr.hospital_id
        INNER JOIN (
          SELECT room_id, MAX(id) AS latest_id
          FROM room_reservations
          WHERE status IN ('Reserved', 'Checked In')
          GROUP BY room_id
        ) latest ON latest.latest_id = rr.id
        INNER JOIN patients p ON p.id = rr.patient_id AND p.hospital_id = rr.hospital_id
      ) latest_reservation ON latest_reservation.room_id = r.id
      ${whereClause}
      ORDER BY r.room_number ASC, r.id ASC
    `,
    params
  );

  return rows.map((row) => ({
    ...row,
    type: row.room_type,
    patient: row.patient_name || 'None',
    monitor: row.department_name
      ? `${row.department_name}${row.check_in_date ? ` - reserved from ${row.check_in_date}` : ''}`
      : 'No department assigned',
  }));
}

exports.getAllRooms = async (req, res) => {
  try {
    const rows = await fetchRoomRows(req.tenantId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const rows = await fetchRoomRows(req.tenantId, 'r.id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { room_number, room_type, status, department_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO rooms (hospital_id, room_number, room_type, status, department_id) VALUES (?, ?, ?, ?, ?)',
      [hospitalId, room_number, room_type, status || 'Available', department_id || null]
    );
    const rows = await fetchRoomRows(hospitalId, 'r.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { room_number, room_type, status, department_id } = req.body;
    const [result] = await db.query(
      'UPDATE rooms SET room_number = ?, room_type = ?, status = ?, department_id = ? WHERE id = ? AND hospital_id = ?',
      [room_number, room_type, status, department_id || null, req.params.id, hospitalId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const rows = await fetchRoomRows(hospitalId, 'r.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [result] = await db.query('DELETE FROM rooms WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

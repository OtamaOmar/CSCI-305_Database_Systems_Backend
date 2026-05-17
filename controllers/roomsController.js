const { db } = require('../db/connection');

async function fetchRoomRows(whereClause = '', params = []) {
  const [rows] = await db.query(
    `
      SELECT
        r.id,
        r.room_number,
        r.room_type,
        r.status,
        d.name AS department_name,
        latest_reservation.patient_name,
        latest_reservation.check_in_date
      FROM rooms r
      LEFT JOIN departments d ON d.id = r.department_id
      LEFT JOIN (
        SELECT
          rr.room_id,
          p.name AS patient_name,
          DATE_FORMAT(rr.check_in_date, '%Y-%m-%d') AS check_in_date
        FROM room_reservations rr
        INNER JOIN (
          SELECT room_id, MAX(id) AS latest_id
          FROM room_reservations
          WHERE status IN ('Reserved', 'Checked In')
          GROUP BY room_id
        ) latest ON latest.latest_id = rr.id
        INNER JOIN patients p ON p.id = rr.patient_id
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
    const rows = await fetchRoomRows();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const rows = await fetchRoomRows('WHERE r.id = ?', [req.params.id]);
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
    const { room_number, room_type, status, department_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO rooms (room_number, room_type, status, department_id) VALUES (?, ?, ?, ?)',
      [room_number, room_type, status || 'Available', department_id]
    );
    const rows = await fetchRoomRows('WHERE r.id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { room_number, room_type, status, department_id } = req.body;
    const [result] = await db.query(
      'UPDATE rooms SET room_number = ?, room_type = ?, status = ?, department_id = ? WHERE id = ?',
      [room_number, room_type, status, department_id, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const rows = await fetchRoomRows('WHERE r.id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

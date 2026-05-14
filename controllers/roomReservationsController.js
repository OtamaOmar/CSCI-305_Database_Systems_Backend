const { db } = require('../db/connection');
const { pickFirstNonEmpty, resolvePatient, resolveRoom } = require('../utils/entityResolvers');

const reservationStatusMap = {
  Reserved: 'Reserved',
  reserved: 'Reserved',
  'Checked In': 'Checked In',
  'Checked Out': 'Checked Out',
  Cancelled: 'Cancelled',
  cancelled: 'Cancelled',
};

function normalizeReservationStatus(value) {
  const normalized = pickFirstNonEmpty(value);
  return reservationStatusMap[normalized] || 'Reserved';
}

exports.getAllReservations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT
          rr.id,
          rr.room_id,
          r.room_number,
          r.room_type,
          rr.patient_id,
          p.name AS patient_name,
          DATE_FORMAT(rr.check_in_date, '%Y-%m-%d') AS check_in_date,
          CASE
            WHEN rr.check_out_date IS NULL THEN NULL
            ELSE DATE_FORMAT(rr.check_out_date, '%Y-%m-%d')
          END AS check_out_date,
          rr.status,
          DATE_FORMAT(rr.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
        FROM room_reservations rr
        INNER JOIN rooms r ON r.id = rr.room_id
        INNER JOIN patients p ON p.id = rr.patient_id
        ORDER BY rr.created_at DESC, rr.id DESC
      `
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM room_reservations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createReservation = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const patient = await resolvePatient(req.body);
    if (!patient) {
      return res.status(400).json({ error: 'Select an existing patient before reserving a room.' });
    }

    const room = await resolveRoom(req.body);
    if (!room) {
      return res.status(400).json({ error: 'No matching available room was found for this reservation.' });
    }

    if (room.status !== 'Available') {
      return res.status(400).json({ error: 'The selected room is not currently available.' });
    }

    const checkInDate = pickFirstNonEmpty(req.body.check_in_date, req.body.date);
    if (!checkInDate) {
      return res.status(400).json({ error: 'Reservation date is required.' });
    }

    const checkOutDate = pickFirstNonEmpty(req.body.check_out_date) || null;
    const status = normalizeReservationStatus(req.body.status);

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO room_reservations (room_id, patient_id, check_in_date, check_out_date, status) VALUES (?, ?, ?, ?, ?)',
      [room.id, patient.id, checkInDate, checkOutDate, status]
    );

    await connection.query('UPDATE rooms SET status = ? WHERE id = ?', ['Occupied', room.id]);

    await connection.commit();

    res.status(201).json({
      id: result.insertId,
      room_id: room.id,
      room_number: room.room_number,
      room_type: room.room_type,
      patient_id: patient.id,
      patient_name: patient.name,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      status,
      message: 'Reservation created successfully',
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { room_id, patient_id, check_in_date, check_out_date, status } = req.body;
    await db.query(
      'UPDATE room_reservations SET room_id = ?, patient_id = ?, check_in_date = ?, check_out_date = ?, status = ? WHERE id = ?',
      [room_id, patient_id, check_in_date, check_out_date, status, req.params.id]
    );
    res.json({ message: 'Reservation updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    await db.query('DELETE FROM room_reservations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reservation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

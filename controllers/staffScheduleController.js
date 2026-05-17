const { db } = require('../db/connection');

exports.getAllSchedules = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff_schedule');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff_schedule WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { staff_id, date, shift, start_time, end_time } = req.body;
    const [result] = await db.query(
      'INSERT INTO staff_schedule (staff_id, date, shift, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      [staff_id, date, shift, start_time, end_time]
    );
    res.status(201).json({ id: result.insertId, message: 'Schedule created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { staff_id, date, shift, start_time, end_time } = req.body;
    await db.query(
      'UPDATE staff_schedule SET staff_id = ?, date = ?, shift = ?, start_time = ?, end_time = ? WHERE id = ?',
      [staff_id, date, shift, start_time, end_time, req.params.id]
    );
    res.json({ message: 'Schedule updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    await db.query('DELETE FROM staff_schedule WHERE id = ?', [req.params.id]);
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

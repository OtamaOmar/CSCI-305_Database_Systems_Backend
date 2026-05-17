const { db } = require('../db/connection');

exports.getAllAmbulances = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ambulances');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAmbulanceById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ambulances WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAmbulance = async (req, res) => {
  try {
    const { license_plate, status, driver_id, current_location } = req.body;
    const [result] = await db.query(
      'INSERT INTO ambulances (license_plate, status, driver_id, current_location) VALUES (?, ?, ?, ?)',
      [license_plate, status || 'available', driver_id, current_location]
    );
    res.status(201).json({ id: result.insertId, message: 'Ambulance created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAmbulance = async (req, res) => {
  try {
    const { license_plate, status, driver_id, current_location } = req.body;
    await db.query(
      'UPDATE ambulances SET license_plate = ?, status = ?, driver_id = ?, current_location = ? WHERE id = ?',
      [license_plate, status, driver_id, current_location, req.params.id]
    );
    res.json({ message: 'Ambulance updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAmbulance = async (req, res) => {
  try {
    await db.query('DELETE FROM ambulances WHERE id = ?', [req.params.id]);
    res.json({ message: 'Ambulance deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

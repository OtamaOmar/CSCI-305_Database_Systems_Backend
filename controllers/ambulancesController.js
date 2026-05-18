const { db } = require('../db/connection');

exports.getAllAmbulances = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM ambulances WHERE hospital_id = ? ORDER BY created_at DESC', [hospitalId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAmbulanceById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM ambulances WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
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
    const hospitalId = req.tenantId;
    const { license_plate, status, driver_id, current_location } = req.body;
    const [result] = await db.query(
      'INSERT INTO ambulances (hospital_id, license_plate, status, driver_id, current_location) VALUES (?, ?, ?, ?, ?)',
      [hospitalId, license_plate, status || 'Available', driver_id || null, current_location || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Ambulance created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAmbulance = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { license_plate, status, driver_id, current_location } = req.body;
    await db.query(
      'UPDATE ambulances SET license_plate = ?, status = ?, driver_id = ?, current_location = ? WHERE id = ? AND hospital_id = ?',
      [license_plate, status, driver_id || null, current_location || null, req.params.id, hospitalId]
    );
    res.json({ message: 'Ambulance updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAmbulance = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    await db.query('DELETE FROM ambulances WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    res.json({ message: 'Ambulance deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

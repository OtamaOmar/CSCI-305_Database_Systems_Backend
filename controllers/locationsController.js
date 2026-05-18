const { db } = require('../db/connection');

exports.getAllLocations = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM locations WHERE hospital_id = ? ORDER BY created_at DESC', [hospitalId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const [rows] = await db.query('SELECT * FROM locations WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { name, type, latitude, longitude, address } = req.body;
    const [result] = await db.query(
      'INSERT INTO locations (hospital_id, name, type, latitude, longitude, address) VALUES (?, ?, ?, ?, ?, ?)',
      [hospitalId, name, type, latitude, longitude, address]
    );
    res.status(201).json({ id: result.insertId, message: 'Location created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    const { name, type, latitude, longitude, address } = req.body;
    await db.query(
      'UPDATE locations SET name = ?, type = ?, latitude = ?, longitude = ?, address = ? WHERE id = ? AND hospital_id = ?',
      [name, type, latitude, longitude, address, req.params.id, hospitalId]
    );
    res.json({ message: 'Location updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const hospitalId = req.tenantId;
    await db.query('DELETE FROM locations WHERE id = ? AND hospital_id = ?', [req.params.id, hospitalId]);
    res.json({ message: 'Location deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

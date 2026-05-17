const { db } = require('../db/connection');

exports.getAllLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM locations');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM locations WHERE id = ?', [req.params.id]);
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
    const { name, type, latitude, longitude, address } = req.body;
    const [result] = await db.query(
      'INSERT INTO locations (name, type, latitude, longitude, address) VALUES (?, ?, ?, ?, ?)',
      [name, type, latitude, longitude, address]
    );
    res.status(201).json({ id: result.insertId, message: 'Location created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { name, type, latitude, longitude, address } = req.body;
    await db.query(
      'UPDATE locations SET name = ?, type = ?, latitude = ?, longitude = ?, address = ? WHERE id = ?',
      [name, type, latitude, longitude, address, req.params.id]
    );
    res.json({ message: 'Location updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    await db.query('DELETE FROM locations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Location deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

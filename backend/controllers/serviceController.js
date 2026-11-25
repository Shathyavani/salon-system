const db = require('../config/db');

// GET all services (anyone can see)
exports.getServices = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADD a service (admin only)
exports.addService = async (req, res) => {
  try {
    const { name, description, price, duration_minutes } = req.body;

    if (!name || !price || !duration_minutes) {
      return res.status(400).json({ message: 'Name, price and duration are required' });
    }

    await db.query(
      'INSERT INTO services (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)',
      [name, description || null, price, duration_minutes]
    );
    res.status(201).json({ message: 'Service added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE a service (admin only)
exports.updateService = async (req, res) => {
  try {
    const { name, description, price, duration_minutes } = req.body;

    const [result] = await db.query(
      'UPDATE services SET name = ?, description = ?, price = ?, duration_minutes = ? WHERE id = ?',
      [name, description, price, duration_minutes, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE a service (admin only)
exports.deleteService = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Cannot delete. This service may already have bookings.' });
  }
};
const db = require('../config/db');

exports.getStaff = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM staff ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
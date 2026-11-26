const db = require('../config/db');

const OPEN_TIME = 9 * 60;    // 9:00 AM in minutes
const CLOSE_TIME = 18 * 60;  // 6:00 PM in minutes
const STEP = 30;             // one slot every 30 minutes

// "09:30" -> 570
function toMinutes(time) {
  const [h, m] = time.split(':');
  return parseInt(h) * 60 + parseInt(m);
}

// 570 -> "09:30"
function toTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// today as "2026-11-26"
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// THE SMART PART: find free start times
async function getFreeSlots(serviceId, staffId, date) {
  const [services] = await db.query(
    'SELECT duration_minutes FROM services WHERE id = ?', [serviceId]
  );
  if (services.length === 0) return null; // service not found

  const duration = services[0].duration_minutes;

  // wrong date format or a date in the past
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayString()) {
    return [];
  }

  // bookings that already exist for this staff on this day
  const [booked] = await db.query(
    `SELECT TIME_FORMAT(a.start_time, '%H:%i') AS start_time, s.duration_minutes
     FROM appointments a
     JOIN services s ON a.service_id = s.id
     WHERE a.staff_id = ? AND a.appointment_date = ? AND a.status != 'cancelled'`,
    [staffId, date]
  );

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = date === todayString();

  const slots = [];
  for (let start = OPEN_TIME; start + duration <= CLOSE_TIME; start += STEP) {
    if (isToday && start <= nowMinutes) continue; // time already passed

    const end = start + duration;
    const clash = booked.some(b => {
      const bStart = toMinutes(b.start_time);
      const bEnd = bStart + b.duration_minutes;
      return start < bEnd && end > bStart;
    });

    if (!clash) slots.push(toTime(start));
  }
  return slots;
}

// GET /api/appointments/slots?serviceId=1&staffId=1&date=2026-11-30
exports.getSlots = async (req, res) => {
  try {
    const { serviceId, staffId, date } = req.query;
    if (!serviceId || !staffId || !date) {
      return res.status(400).json({ message: 'serviceId, staffId and date are required' });
    }

    const slots = await getFreeSlots(serviceId, staffId, date);
    if (slots === null) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/appointments  (customer must be logged in)
exports.createAppointment = async (req, res) => {
  try {
    const { service_id, staff_id, appointment_date, start_time } = req.body;

    if (!service_id || !staff_id || !appointment_date || !start_time) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const [staff] = await db.query('SELECT id FROM staff WHERE id = ?', [staff_id]);
    if (staff.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // check again that the slot is still free (someone else may have just booked it)
    const slots = await getFreeSlots(service_id, staff_id, appointment_date);
    if (slots === null) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (!slots.includes(start_time)) {
      return res.status(400).json({ message: 'Sorry, this time is not available. Please choose another time.' });
    }

    await db.query(
      `INSERT INTO appointments (user_id, service_id, staff_id, appointment_date, start_time)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, service_id, staff_id, appointment_date, start_time]
    );

    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/appointments/my  (only my own bookings)
exports.getMyAppointments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, s.name AS service_name, s.price, st.name AS staff_name,
              DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
              TIME_FORMAT(a.start_time, '%H:%i') AS start_time,
              a.status
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       LEFT JOIN staff st ON a.staff_id = st.id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/appointments/5/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE appointments SET status = 'cancelled'
       WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found or cannot be cancelled' });
    }
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
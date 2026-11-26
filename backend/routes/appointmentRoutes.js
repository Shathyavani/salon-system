const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getSlots, createAppointment, getMyAppointments, cancelAppointment
} = require('../controllers/appointmentController');

router.get('/slots', getSlots);
router.get('/my', verifyToken, getMyAppointments);
router.post('/', verifyToken, createAppointment);
router.put('/:id/cancel', verifyToken, cancelAppointment);

module.exports = router;
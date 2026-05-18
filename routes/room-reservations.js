const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} = require('../controllers/roomReservationsController');

router.use(authenticate);

router.get('/', requirePermission('room_reservations:read'), getAllReservations);
router.get('/:id', requirePermission('room_reservations:read'), getReservationById);
router.post('/', requirePermission('room_reservations:write'), createReservation);
router.put('/:id', requirePermission('room_reservations:write'), updateReservation);
router.delete('/:id', requirePermission('room_reservations:write'), deleteReservation);

module.exports = router;

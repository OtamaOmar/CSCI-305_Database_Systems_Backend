const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentsController');

router.use(authenticate);

router.get('/', requirePermission('appointments:read'), getAllAppointments);
router.get('/:id', requirePermission('appointments:read'), getAppointmentById);
router.post('/', requirePermission('appointments:write'), createAppointment);
router.put('/:id', requirePermission('appointments:write'), updateAppointment);
router.delete('/:id', requirePermission('appointments:write'), deleteAppointment);

module.exports = router;

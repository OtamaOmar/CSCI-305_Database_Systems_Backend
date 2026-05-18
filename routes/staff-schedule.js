const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/staffScheduleController');

router.use(authenticate);

router.get('/', requirePermission('staff_schedule:read'), getAllSchedules);
router.get('/:id', requirePermission('staff_schedule:read'), getScheduleById);
router.post('/', requirePermission('staff_schedule:write'), createSchedule);
router.put('/:id', requirePermission('staff_schedule:write'), updateSchedule);
router.delete('/:id', requirePermission('staff_schedule:write'), deleteSchedule);

module.exports = router;

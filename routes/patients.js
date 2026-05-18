const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllPatients,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patientsController');

router.use(authenticate);

router.get('/', requirePermission('patients:read'), getAllPatients);
router.post('/', requirePermission('patients:write'), createPatient);
router.put('/:id', requirePermission('patients:write'), updatePatient);
router.delete('/:id', requirePermission('patients:write'), deletePatient);

module.exports = router;

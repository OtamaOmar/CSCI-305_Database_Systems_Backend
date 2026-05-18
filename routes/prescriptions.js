const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescriptionsController');

router.use(authenticate);

router.get('/', requirePermission('prescriptions:read'), getAllPrescriptions);
router.get('/:id', requirePermission('prescriptions:read'), getPrescriptionById);
router.post('/', requirePermission('prescriptions:write'), createPrescription);
router.put('/:id', requirePermission('prescriptions:write'), updatePrescription);
router.delete('/:id', requirePermission('prescriptions:write'), deletePrescription);

module.exports = router;

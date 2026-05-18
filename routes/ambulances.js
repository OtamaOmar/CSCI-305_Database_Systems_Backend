const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
} = require('../controllers/ambulancesController');

router.use(authenticate);

router.get('/', requirePermission('ambulances:read'), getAllAmbulances);
router.get('/:id', requirePermission('ambulances:read'), getAmbulanceById);
router.post('/', requirePermission('ambulances:write'), createAmbulance);
router.put('/:id', requirePermission('ambulances:write'), updateAmbulance);
router.delete('/:id', requirePermission('ambulances:write'), deleteAmbulance);

module.exports = router;

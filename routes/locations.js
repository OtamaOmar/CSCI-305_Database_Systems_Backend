const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationsController');

router.use(authenticate);

router.get('/', requirePermission('locations:read'), getAllLocations);
router.get('/:id', requirePermission('locations:read'), getLocationById);
router.post('/', requirePermission('locations:write'), createLocation);
router.put('/:id', requirePermission('locations:write'), updateLocation);
router.delete('/:id', requirePermission('locations:write'), deleteLocation);

module.exports = router;

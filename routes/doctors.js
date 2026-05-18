const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorsController');

router.use(authenticate);

router.get('/', requirePermission('doctors:read'), getAllDoctors);
router.post('/', requirePermission('doctors:write'), createDoctor);
router.put('/:id', requirePermission('doctors:write'), updateDoctor);
router.delete('/:id', requirePermission('doctors:write'), deleteDoctor);

module.exports = router;

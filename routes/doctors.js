const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorsController');

router.get('/', getAllDoctors);
router.post('/', createDoctor);
router.put('/:id', updateDoctor);
router.delete('/:id', deleteDoctor);

module.exports = router;

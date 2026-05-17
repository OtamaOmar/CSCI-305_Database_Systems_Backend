const express = require('express');
const router = express.Router();
const {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
} = require('../controllers/ambulancesController');

router.get('/', getAllAmbulances);
router.get('/:id', getAmbulanceById);
router.post('/', createAmbulance);
router.put('/:id', updateAmbulance);
router.delete('/:id', deleteAmbulance);

module.exports = router;

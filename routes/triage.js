const express = require('express');
const router = express.Router();
const {
  getAllTriageCases,
  getTriageCaseById,
  createTriageCase,
  updateTriageCase,
  deleteTriageCase,
} = require('../controllers/triageController');

router.get('/', getAllTriageCases);
router.get('/:id', getTriageCaseById);
router.post('/', createTriageCase);
router.put('/:id', updateTriageCase);
router.delete('/:id', deleteTriageCase);

module.exports = router;

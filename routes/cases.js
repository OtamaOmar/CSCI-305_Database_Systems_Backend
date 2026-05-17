const express = require('express');
const router = express.Router();
const {
  getAllCases,
  createCase,
  updateCase,
  deleteCase,
} = require('../controllers/casesController');

router.get('/', getAllCases);
router.post('/', createCase);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);

module.exports = router;

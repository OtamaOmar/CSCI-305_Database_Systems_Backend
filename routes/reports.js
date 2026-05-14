const express = require('express');
const router = express.Router();
const {
  getReportsDashboard,
  getReportById,
} = require('../controllers/reportsController');

router.get('/dashboard', getReportsDashboard);
router.get('/:id', getReportById);

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getReportsDashboard,
  getReportById,
} = require('../controllers/reportsController');

router.use(authenticate);

router.get('/dashboard', requirePermission('reports:read'), getReportsDashboard);
router.get('/:id', requirePermission('reports:read'), getReportById);

module.exports = router;

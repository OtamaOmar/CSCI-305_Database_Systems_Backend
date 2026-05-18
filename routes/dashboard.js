const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getDashboardStats,
} = require('../controllers/dashboardController');

router.use(authenticate);

router.get('/', requirePermission('dashboard:read'), getDashboardStats);

module.exports = router;

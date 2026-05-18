const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const { getAllNotifications, createNotification } = require('../controllers/notificationsController');

router.use(authenticate);

router.get('/', requirePermission('notifications:read'), getAllNotifications);
router.post('/', requirePermission('notifications:write'), createNotification);

module.exports = router;

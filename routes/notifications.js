const express = require('express');
const router = express.Router();
const { getAllNotifications, createNotification } = require('../controllers/notificationsController');

router.get('/',  getAllNotifications);
router.post('/', createNotification);

module.exports = router;

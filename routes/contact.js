const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllMessages,
  getMessageById,
  createMessage,
  deleteMessage,
} = require('../controllers/contactController');

router.use(authenticate);

router.get('/', requirePermission('contact:read'), getAllMessages);
router.get('/:id', requirePermission('contact:read'), getMessageById);
router.post('/', requirePermission('contact:write'), createMessage);
router.delete('/:id', requirePermission('contact:write'), deleteMessage);

module.exports = router;

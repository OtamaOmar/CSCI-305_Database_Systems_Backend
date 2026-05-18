const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomsController');

router.use(authenticate);

router.get('/', requirePermission('rooms:read'), getAllRooms);
router.get('/:id', requirePermission('rooms:read'), getRoomById);
router.post('/', requirePermission('rooms:write'), createRoom);
router.put('/:id', requirePermission('rooms:write'), updateRoom);
router.delete('/:id', requirePermission('rooms:write'), deleteRoom);

module.exports = router;

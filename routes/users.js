const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/usersController');

router.use(authenticate);

router.get('/', requirePermission('users:manage'), getAllUsers);
router.get('/:id', requirePermission('users:manage'), getUserById);
router.post('/', requirePermission('users:manage'), createUser);
router.put('/:id', requirePermission('users:manage'), updateUser);
router.delete('/:id', requirePermission('users:manage'), deleteUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require('../controllers/rolesController');

router.use(authenticate);

router.get('/', requirePermission('roles:manage'), getAllRoles);
router.get('/:id', requirePermission('roles:manage'), getRoleById);
router.post('/', requirePermission('roles:manage'), createRole);
router.put('/:id', requirePermission('roles:manage'), updateRole);
router.delete('/:id', requirePermission('roles:manage'), deleteRole);

module.exports = router;

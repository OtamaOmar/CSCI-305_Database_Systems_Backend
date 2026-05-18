const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentsController');

router.use(authenticate);

router.get('/', requirePermission('departments:read'), getAllDepartments);
router.get('/:id', requirePermission('departments:read'), getDepartmentById);
router.post('/', requirePermission('departments:write'), createDepartment);
router.put('/:id', requirePermission('departments:write'), updateDepartment);
router.delete('/:id', requirePermission('departments:write'), deleteDepartment);

module.exports = router;

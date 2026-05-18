const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllCases,
  createCase,
  updateCase,
  deleteCase,
} = require('../controllers/casesController');

router.use(authenticate);

router.get('/', requirePermission('cases:read'), getAllCases);
router.post('/', requirePermission('cases:write'), createCase);
router.put('/:id', requirePermission('cases:write'), updateCase);
router.delete('/:id', requirePermission('cases:write'), deleteCase);

module.exports = router;

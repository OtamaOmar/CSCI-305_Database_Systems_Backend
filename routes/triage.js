const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllTriageCases,
  getTriageCaseById,
  createTriageCase,
  updateTriageCase,
  deleteTriageCase,
} = require('../controllers/triageController');

router.use(authenticate);

router.get('/', requirePermission('triage:read'), getAllTriageCases);
router.get('/:id', requirePermission('triage:read'), getTriageCaseById);
router.post('/', requirePermission('triage:write'), createTriageCase);
router.put('/:id', requirePermission('triage:write'), updateTriageCase);
router.delete('/:id', requirePermission('triage:write'), deleteTriageCase);

module.exports = router;

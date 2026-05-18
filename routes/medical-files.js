const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');
const {
  getAllMedicalFiles,
  getMedicalFileById,
  createMedicalFile,
  updateMedicalFile,
  deleteMedicalFile,
} = require('../controllers/medicalFilesController');

router.use(authenticate);

router.get('/', requirePermission('medical_files:read'), getAllMedicalFiles);
router.get('/:id', requirePermission('medical_files:read'), getMedicalFileById);
router.post('/', requirePermission('medical_files:write'), createMedicalFile);
router.put('/:id', requirePermission('medical_files:write'), updateMedicalFile);
router.delete('/:id', requirePermission('medical_files:write'), deleteMedicalFile);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getAllMedicalFiles,
  getMedicalFileById,
  createMedicalFile,
  updateMedicalFile,
  deleteMedicalFile,
} = require('../controllers/medicalFilesController');

router.get('/', getAllMedicalFiles);
router.get('/:id', getMedicalFileById);
router.post('/', createMedicalFile);
router.put('/:id', updateMedicalFile);
router.delete('/:id', deleteMedicalFile);

module.exports = router;

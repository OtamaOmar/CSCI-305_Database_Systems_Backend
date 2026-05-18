const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const {
  getAllHospitalFiles,
  getHospitalFileById,
  createHospitalFile,
  deleteHospitalFile,
} = require('../controllers/hospitalFilesController');

router.use(authenticate);

router.get('/', requirePermission('hospital_files:read'), getAllHospitalFiles);
router.get('/:id', requirePermission('hospital_files:read'), getHospitalFileById);
router.post('/', requirePermission('hospital_files:write'), createHospitalFile);
router.delete('/:id', requirePermission('hospital_files:write'), deleteHospitalFile);

module.exports = router;


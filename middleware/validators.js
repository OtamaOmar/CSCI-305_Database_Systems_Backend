const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
}

// Auth validators
const authValidators = {
  registerOwner: [
    body('hospital_name').trim().notEmpty().withMessage('Hospital name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    handleValidationErrors,
  ],
  
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],

  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    handleValidationErrors,
  ],
};

// Patient validators
const patientValidators = {
  create: [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    body('date_of_birth').optional().isISO8601().withMessage('Valid date required'),
    handleValidationErrors,
  ],

  update: [
    param('id').isInt().withMessage('Valid patient ID required'),
    body('first_name').optional().trim(),
    body('last_name').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    handleValidationErrors,
  ],
};

// Case validators
const caseValidators = {
  create: [
    body('patient_id').isInt().withMessage('Valid patient ID required'),
    body('triage_level').isIn(['RED', 'YELLOW', 'GREEN']).withMessage('Valid triage level required'),
    body('chief_complaint').trim().notEmpty().withMessage('Chief complaint is required'),
    handleValidationErrors,
  ],

  update: [
    param('id').isInt().withMessage('Valid case ID required'),
    body('status').optional().isIn(['OPEN', 'CLOSED']).withMessage('Valid status required'),
    handleValidationErrors,
  ],
};

module.exports = {
  handleValidationErrors,
  authValidators,
  patientValidators,
  caseValidators,
};

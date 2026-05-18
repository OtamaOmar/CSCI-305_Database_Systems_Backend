const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
	registerOwner,
	register,
	login,
	getPendingInvitation,
	acceptInvitation,
	rejectInvitation,
} = require('../controllers/authController');

// Owner onboarding creates a new hospital tenant.
router.post('/register-owner', registerOwner);

// Staff registration is invitation-based (token required).
router.post('/register', register);
router.post('/login', login);

// Pending invitation workflow for invited users.
router.get('/invitation', authenticate, getPendingInvitation);
router.post('/invitation/accept', authenticate, acceptInvitation);
router.post('/invitation/reject', authenticate, rejectInvitation);

module.exports = router;

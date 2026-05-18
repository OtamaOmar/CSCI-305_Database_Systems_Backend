const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/authorize');

const {
  listInvitations,
  createInvitation,
  revokeInvitation,
} = require('../controllers/invitationsController');

router.use(authenticate);

router.get('/', requirePermission('invitations:manage'), listInvitations);
router.post('/', requirePermission('invitations:manage'), createInvitation);
router.post('/:id/revoke', requirePermission('invitations:manage'), revokeInvitation);

module.exports = router;


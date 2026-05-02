const express = require('express');
const router = express.Router();
const { sendInvite, getInvite, acceptInvite } = require('../controllers/inviteController');
const { protect } = require('../middleware/auth');

router.get('/:token', getInvite);            // Public - no auth needed to view invite
router.post('/send', protect, sendInvite);
router.post('/accept', protect, acceptInvite);

module.exports = router;

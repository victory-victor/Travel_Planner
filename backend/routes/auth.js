const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, forgotPassword, verifyOTPRoute, resetPassword, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password',forgotPassword);
router.post('/verify-otp', verifyOTPRoute);
router.post('/reset-password', resetPassword);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;

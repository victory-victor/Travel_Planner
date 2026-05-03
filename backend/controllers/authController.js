const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Invitation = require('../models/Invitation');
const { generateOTP, saveOTP, verifyOTP, isOTPVerified, deleteOTP } = require('../services/Otpservice');
const { sendOTPEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        travelStyle: user.travelStyle,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        travelStyle: user.travelStyle,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('trips', 'title destination startDate endDate status coverImage');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, travelStyle, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, travelStyle, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete account
// @route DELETE /api/auth/delete-account
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all trips created by this user
    await Trip.deleteMany({ creator: userId });

    // Remove user from all trips they're a member of
    await Trip.updateMany(
      { 'members.user': userId },
      { $pull: { members: { user: userId } } }
    );

    // Delete all invitations sent by or to this user
    await Invitation.deleteMany({
      $or: [{ invitedBy: userId }, { email: req.user.email }]
    });

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Send OTP to email
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    saveOTP(email, otp);
    await sendOTPEmail({ toEmail: email, otp, userName: user.name });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// @desc  Verify OTP (step 2) — marks it as verified without consuming
// @route POST /api/auth/verify-otp
const verifyOTPRoute = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = verifyOTP(email, otp, true); // peek = true, don't delete yet
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    // Mark as verified so reset-password can proceed
    verifyOTP(email, otp, false); // call again with peek=false to set verified flag
    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Reset password (step 3) — requires OTP to have been verified in step 2
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Make sure OTP was verified in the previous step
    if (!isOTPVerified(email)) {
      return res.status(400).json({ success: false, message: 'OTP not verified. Please restart the process.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword; // bcrypt hashing via pre-save hook in User model
    await user.save();

    deleteOTP(email); // clean up

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        travelStyle: user.travelStyle,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, forgotPassword, verifyOTPRoute, resetPassword, deleteAccount };

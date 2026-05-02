const Invitation = require('../models/Invitation');
const Trip = require('../models/Trip');
const User = require('../models/User');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../services/emailService');

// @desc    Send email invitation
// @route   POST /api/invites/send
const sendInvite = async (req, res) => {
  try {
    const { tripId, email } = req.body;

    const trip = await Trip.findById(tripId).populate('creator', 'name email');
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    // Check if creator or admin
    const isAdmin = trip.members.find(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    if (!isAdmin && trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only admins can send invites' });
    }

    // Check if already invited
    const existing = await Invitation.findOne({ trip: tripId, email, status: 'pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Invitation already sent to this email' });
    }

    const token = crypto.randomUUID();
    const invitation = await Invitation.create({ trip: tripId, invitedBy: req.user._id, email, token });

    const appUrl = process.env.CLIENT_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`;
    const inviteLink = `${appUrl}/join/${token}`;

    // Send email
    await sendInvitationEmail({
      toEmail: email,
      inviterName: req.user.name,
      tripTitle: trip.title,
      destination: trip.destination.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      inviteLink
    });

    res.status(201).json({ success: true, message: `Invitation sent to ${email}`, invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invite details by token
// @route   GET /api/invites/:token
const getInvite = async (req, res) => {
  try {
    let invitation = await Invitation.findOne({ token: req.params.token })
      .populate({ path: 'trip', populate: { path: 'creator', select: 'name email avatar' } })
      .populate('invitedBy', 'name email avatar');

    if (!invitation) {
      // Check if it's a general trip invite token
      const trip = await Trip.findOne({ inviteToken: req.params.token })
        .populate('creator', 'name email avatar');
      
      if (!trip) return res.status(404).json({ success: false, message: 'Invitation not found or expired' });

      // Create a "virtual" invitation object for the frontend to consume
      invitation = {
        trip,
        invitedBy: trip.creator,
        status: 'pending',
        isGeneral: true,
        token: req.params.token
      };
      return res.json({ success: true, invitation });
    }
    if (invitation.status === 'expired') return res.status(400).json({ success: false, message: 'Invitation has expired' });
    if (invitation.expiresAt < new Date()) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }

    res.json({ success: true, invitation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept invitation (requires auth)
// @route   POST /api/invites/accept
const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;

    let invitation = await Invitation.findOne({ token }).populate('trip');
    let tripId;

    if (!invitation) {
      // Check if it's a general trip invite token
      const trip = await Trip.findOne({ inviteToken: token });
      if (!trip) return res.status(404).json({ success: false, message: 'Invitation not found' });
      tripId = trip._id;
    } else {
      if (invitation.status !== 'pending') return res.status(400).json({ success: false, message: 'Invitation already used' });
      tripId = invitation.trip._id;
    }

    const trip = await Trip.findById(tripId);
    const alreadyMember = trip.members.some(m => m.user.toString() === req.user._id.toString());

    if (!alreadyMember) {
      trip.members.push({ user: req.user._id, role: 'member' });
      await trip.save();
      await User.findByIdAndUpdate(req.user._id, { $push: { trips: trip._id } });
    }

    if (invitation && invitation.status === 'pending') {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'accepted' });
    }

    res.json({ success: true, message: 'Successfully joined the trip!', tripId: trip._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendInvite, getInvite, acceptInvite };

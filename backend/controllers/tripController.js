const Trip = require('../models/Trip');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../services/emailService');

// @desc    Create trip
// @route   POST /api/trips
const createTrip = async (req, res) => {
  try {
    const { title, description, destination, startDate, endDate, budget, preferences, coverImage, inviteEmails, invitePhones } = req.body;

    const inviteToken = crypto.randomUUID();

    const trip = await Trip.create({
      title, description, destination, startDate, endDate,
      budget, preferences, coverImage,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      inviteToken,
      invitePhones: invitePhones || []
    });

    // Add trip to user's trips
    await User.findByIdAndUpdate(req.user._id, { $push: { trips: trip._id } });

    // Process email invitations
    if (inviteEmails && Array.isArray(inviteEmails) && inviteEmails.length > 0) {
      for (const email of inviteEmails) {
        const token = crypto.randomUUID();
        await Invitation.create({ trip: trip._id, invitedBy: req.user._id, email, token });
        const appUrl = process.env.CLIENT_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`;
        const inviteLink = `${appUrl}/join/${token}`;

        try {
          await sendInvitationEmail({
            toEmail: email,
            inviterName: req.user.name,
            tripTitle: trip.title,
            destination: trip.destination.name,
            startDate: trip.startDate,
            endDate: trip.endDate,
            inviteLink
          });
        } catch (emailErr) {
          console.error(`Failed to send invite email to ${email}:`, emailErr);
        }
      }
    }

    const populated = await Trip.findById(trip._id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({ success: true, trip: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all trips for current user
// @route   GET /api/trips
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      $or: [
        { creator: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: trips.length, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('expenses.paidBy', 'name email avatar')
      .lean();

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check access
    const isMember = trip.members.some(m => m.user?._id.toString() === req.user._id.toString());
    const isCreator = trip.creator._id.toString() === req.user._id.toString();

    if (!isMember && !isCreator && !trip.isPublic) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Attach pending invitations
    const pendingInvites = await Invitation.find({ trip: trip._id, status: 'pending' }).select('email');
    trip.pendingInvites = pendingInvites.map(inv => inv.email);

    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can update this trip' });
    }

    const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('expenses.paidBy', 'name email avatar');

    res.json({ success: true, trip: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can delete this trip' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    await User.updateMany({ trips: req.params.id }, { $pull: { trips: req.params.id } });
    await Invitation.deleteMany({ trip: req.params.id });

    res.json({ success: true, message: 'Trip and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save AI-generated itinerary to trip
// @route   PUT /api/trips/:id/itinerary
const saveItinerary = async (req, res) => {
  try {
    const { itinerary } = req.body;

    if (!Array.isArray(itinerary) || itinerary.length === 0) {
      return res.status(400).json({ success: false, message: 'Itinerary must contain at least one day' });
    }

    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (existingTrip.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can save an itinerary' });
    }

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { itinerary, aiGenerated: true },
      { new: true, runValidators: true }
    ).populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('expenses.paidBy', 'name email avatar');

    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save AI-generated packing list to trip
// @route   PUT /api/trips/:id/packing-list
const savePackingList = async (req, res) => {
  try {
    const { packingList } = req.body;

    if (!packingList || !Array.isArray(packingList.categories) || packingList.categories.length === 0) {
      return res.status(400).json({ success: false, message: 'Packing list must contain at least one category' });
    }

    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = existingTrip.members.some(m => m.user.toString() === req.user._id.toString());
    const isCreator = existingTrip.creator.toString() === req.user._id.toString();

    if (!isMember && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only trip members can save a packing list' });
    }

    const cleanedPackingList = {
      categories: packingList.categories.map(category => ({
        name: category.name,
        icon: category.icon || '',
        items: Array.isArray(category.items) ? category.items.filter(Boolean) : []
      })).filter(category => category.name && category.items.length > 0)
    };

    if (cleanedPackingList.categories.length === 0) {
      return res.status(400).json({ success: false, message: 'Packing list categories must include items' });
    }

    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { packingList: cleanedPackingList },
      { new: true, runValidators: true }
    ).populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('expenses.paidBy', 'name email avatar');

    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member to trip
// @route   POST /api/trips/:id/members
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const alreadyMember = trip.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    trip.members.push({ user: userId, role: 'member' });
    await trip.save();
    await User.findByIdAndUpdate(userId, { $push: { trips: trip._id } });

    const updated = await Trip.findById(trip._id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.json({ success: true, trip: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Add expense to trip
// @route   POST /api/trips/:id/expenses
const addExpense = async (req, res) => {
  try {
    const { description, amount } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    trip.expenses.push({
      description,
      amount,
      paidBy: req.user._id
    });

    console.log(`💸 Expense added by: ${req.user.name} (${req.user._id})`);

    // Auto add to budget breakdown based on a quick heuristic (or just misc)
    let category = 'misc';
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('food') || lowerDesc.includes('meal') || lowerDesc.includes('dinner')) category = 'food';
    else if (lowerDesc.includes('flight') || lowerDesc.includes('taxi') || lowerDesc.includes('bus') || lowerDesc.includes('train')) category = 'transport';
    else if (lowerDesc.includes('hotel') || lowerDesc.includes('stay') || lowerDesc.includes('airbnb')) category = 'accommodation';
    else if (lowerDesc.includes('ticket') || lowerDesc.includes('tour') || lowerDesc.includes('museum')) category = 'activities';

    if (!trip.budget) trip.budget = { breakdown: {} };
    if (!trip.budget.breakdown) trip.budget.breakdown = {};
    if (!trip.budget.breakdown[category]) trip.budget.breakdown[category] = 0;

    trip.budget.breakdown[category] += Number(amount);

    await trip.save();

    const updated = await Trip.findById(trip._id)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('expenses.paidBy', 'name email avatar');

    res.json({ success: true, trip: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTrip, getTrips, getTrip, updateTrip, deleteTrip, saveItinerary, savePackingList, addMember, addExpense };

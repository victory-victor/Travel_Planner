const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const Trip = require('../models/Trip');

// All routes protected
router.use(protect);

// GET /api/chat/:tripId — load message history (paginated)
router.get('/:tripId', async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { before, limit = 50 } = req.query;

    // Verify the user is a member of this trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const isMember = trip.members.some(m =>
      (m.user?.toString() === req.user._id.toString())
    ) || trip.creator.toString() === req.user._id.toString();
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this trip' });

    const query = { tripId, deletedAt: null };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'name avatar email')
      .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } })
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/chat/message/:msgId/react — toggle reaction
router.patch('/message/:msgId/react', async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const msg = await ChatMessage.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    const userId = req.user._id.toString();
    const existing = msg.reactions.find(r => r.emoji === emoji);
    if (existing) {
      const idx = existing.users.map(u => u.toString()).indexOf(userId);
      if (idx > -1) existing.users.splice(idx, 1);
      else existing.users.push(req.user._id);
      if (existing.users.length === 0) {
        msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
      }
    } else {
      msg.reactions.push({ emoji, users: [req.user._id] });
    }
    await msg.save();
    const populated = await msg.populate('sender', 'name avatar email');
    res.json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chat/message/:msgId — soft delete
router.delete('/message/:msgId', async (req, res, next) => {
  try {
    const msg = await ChatMessage.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ success: false, message: 'Not found' });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete another user\'s message' });
    }
    await ChatMessage.deleteOne({ _id: msg._id });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

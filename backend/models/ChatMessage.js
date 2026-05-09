const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Message too long']
  },
  type: {
    type: String,
    enum: ['text', 'emoji', 'system'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  reactions: [reactionSchema],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true
});

// Index for fast retrieval per trip
chatMessageSchema.index({ tripId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

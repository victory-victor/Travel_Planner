require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');
const Trip = require('./models/Trip');

const app = express();
const httpServer = http.createServer(app);

const clientBuildPath = path.join(__dirname, 'dist');
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

// ── Security middlewares ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logger ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WanderMind API is running!', timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/invites', require('./routes/invites'));
app.use('/api/chat', require('./routes/chat'));

// ── 404 / Error handlers ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});
app.use(errorHandler);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Per-trip online tracking: tripId → Set of { socketId, userId, name, avatar }
const tripRooms = new Map(); // tripId → Map<socketId, userInfo>

// Socket auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;

  // ── Join trip room ──────────────────────────────────────────────────────────
  socket.on('join_trip', async (tripId) => {
    try {
      // Verify membership
      const trip = await Trip.findById(tripId);
      if (!trip) return;
      const isMember =
        trip.creator.toString() === user._id.toString() ||
        trip.members.some(m => m.user?.toString() === user._id.toString());
      if (!isMember) return;

      socket.join(tripId);

      // Track online users
      if (!tripRooms.has(tripId)) tripRooms.set(tripId, new Map());
      tripRooms.get(tripId).set(socket.id, {
        userId: user._id.toString(),
        name: user.name,
        avatar: user.avatar,
        socketId: socket.id
      });

      // Broadcast updated online list to room
      const onlineList = getOnlineList(tripId);
      io.to(tripId).emit('online_users', onlineList);

      console.log(`✅ ${user.name} joined trip room ${tripId}`);
    } catch (err) {
      console.error('join_trip error:', err.message);
    }
  });

  // ── Send message ────────────────────────────────────────────────────────────
  socket.on('send_message', async ({ tripId, content, replyTo, type = 'text' }) => {
    try {
      if (!content?.trim()) return;

      const msg = await ChatMessage.create({
        tripId,
        sender: user._id,
        content: content.trim(),
        type,
        replyTo: replyTo || null
      });

      let populated = await ChatMessage.findById(msg._id)
        .populate('sender', 'name avatar email')
        .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } })
        .lean();

      io.to(tripId).emit('new_message', populated);
    } catch (err) {
      console.error('send_message error:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Typing indicator ────────────────────────────────────────────────────────
  socket.on('typing_start', ({ tripId }) => {
    socket.to(tripId).emit('user_typing', {
      userId: user._id.toString(),
      name: user.name
    });
  });

  socket.on('typing_stop', ({ tripId }) => {
    socket.to(tripId).emit('user_stopped_typing', {
      userId: user._id.toString()
    });
  });

  // ── React to message ────────────────────────────────────────────────────────
  socket.on('react_message', async ({ msgId, emoji, tripId }) => {
    try {
      const msg = await ChatMessage.findById(msgId);
      if (!msg) return;

      const userId = user._id.toString();
      const existing = msg.reactions.find(r => r.emoji === emoji);
      if (existing) {
        const idx = existing.users.map(u => u.toString()).indexOf(userId);
        if (idx > -1) existing.users.splice(idx, 1);
        else existing.users.push(user._id);
        if (existing.users.length === 0) {
          msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        msg.reactions.push({ emoji, users: [user._id] });
      }
      await msg.save();

      const populated = await ChatMessage.findById(msgId)
        .populate('sender', 'name avatar email')
        .lean();

      io.to(tripId).emit('message_updated', populated);
    } catch (err) {
      console.error('react_message error:', err.message);
    }
  });

  // ── Delete message ──────────────────────────────────────────────────────────
  socket.on('delete_message', async ({ msgId, tripId }) => {
    try {
      const msg = await ChatMessage.findById(msgId);
      if (!msg) return;
      if (msg.sender.toString() !== user._id.toString()) return;
      if (msg.tripId.toString() !== tripId) return;
      await ChatMessage.deleteOne({ _id: msg._id });
      io.to(tripId).emit('message_deleted', { msgId });
    } catch (err) {
      console.error('delete_message error:', err.message);
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    // Remove from all trip rooms
    for (const [tripId, members] of tripRooms.entries()) {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        const onlineList = getOnlineList(tripId);
        io.to(tripId).emit('online_users', onlineList);
        if (members.size === 0) tripRooms.delete(tripId);
      }
    }
    console.log(`❌ ${user.name} disconnected`);
  });
});

function getOnlineList(tripId) {
  const members = tripRooms.get(tripId);
  if (!members) return [];
  const seen = new Set();
  const list = [];
  for (const info of members.values()) {
    if (!seen.has(info.userId)) {
      seen.add(info.userId);
      list.push({ userId: info.userId, name: info.name, avatar: info.avatar });
    }
  }
  return list;
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 WanderMind Server running on ${process.env.SITE_URL || `http://localhost:${PORT}`}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💬 Socket.IO ready\n`);
  });
};

startServer();

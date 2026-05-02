require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const clientBuildPath = path.join(__dirname, 'dist');
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);

// Security middlewares
app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// app.options("/*", cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WanderMind API is running!', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/invites', require('./routes/invites'));

// Serve the production React build when backend/dist exists.
// if (fs.existsSync(clientBuildPath)) {
//   app.use(express.static(clientBuildPath));
//   app.get(/^(?!\/api).*/, (req, res) => {
//     res.sendFile(path.join(clientBuildPath, 'index.html'));
//   });
// }

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 WanderMind Server running on http://localhost:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer();

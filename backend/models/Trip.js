const mongoose = require('mongoose');

const itineraryDaySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: Date },
  title: { type: String },
  activities: [{
    time: String,
    activity: String,
    location: String,
    description: String,
    estimatedCost: Number,
    category: { type: String, enum: ['food', 'transport', 'accommodation', 'sightseeing', 'entertainment', 'other'] }
  }]
});

const packingListSchema = new mongoose.Schema({
  categories: [{
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    items: [String]
  }]
}, { _id: false });

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  destination: {
    name: { type: String, required: true },
    country: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    placeId: { type: String }
  },
  coverImage: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  budget: {
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    perPerson: { type: Number, default: 0 },
    breakdown: {
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      misc: { type: Number, default: 0 }
    }
  },
  preferences: {
    travelStyle: [String],
    accommodation: { type: String, enum: ['budget', 'mid-range', 'luxury', 'hostel', 'airbnb'], default: 'mid-range' },
    dietaryRestrictions: [String],
    interests: [String]
  },
  expenses: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now }
  }],
  itinerary: [itineraryDaySchema],
  packingList: packingListSchema,
  aiGenerated: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  notes: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
  inviteToken: { type: String, unique: true, sparse: true },
  invitePhones: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

tripSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for duration
tripSchema.virtual('duration').get(function () {
  if (this.startDate && this.endDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

module.exports = mongoose.model('Trip', tripSchema);

// backend/models/Session.js
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: { // This links the session to a specific user
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // References the User model
  },
  topic: {
    type: String,
    required: true,
  },
  startTime: {
    type: Number, // Unix timestamp in milliseconds
    required: true,
  },
  endTime: {
    type: Number, // Unix timestamp in milliseconds, null if session is ongoing
    default: null,
  },
  emotions: [ // Array of emotion records (e.g., for 2-min window calculation in frontend)
    {
      emotion: { type: String, required: true },
      timestamp: { type: Number, required: true },
      duration: { type: Number }, // Optional, if you record duration per emotion event
    },
  ],
  actions: [ // Array of user actions taken during the session
    {
      type: { type: String, required: true },
      emotion: { type: String, required: true }, // Emotion state when action was taken
      timestamp: { type: Number, required: true },
    },
  ],
  effectivenessScore: { // Calculated score for the session
    type: Number,
    default: 0,
  },
  finalEmotionProbabilities: { // NEW: Overall average emotion probabilities for the session
    type: [Number], // Stored as an array of 4 numbers (e.g., [boredom, confusion, fatigue, focus])
    default: [0, 0, 0, 0], // Default values
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
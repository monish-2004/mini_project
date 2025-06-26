// backend/routes/sessions.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // Import the auth middleware
const Session = require('../models/Session'); // Import the Session model

const router = express.Router();

// @desc    Get all sessions for the authenticated user
// @route   GET /api/sessions
// @access  Private (requires JWT token)
router.get('/', protect, async (req, res) => {
  try {
    // Fetch sessions where 'userId' matches the 'req.userId' (from the token)
    // Sort by startTime in descending order (newest sessions first)
    const sessions = await Session.find({ userId: req.userId }).sort({ startTime: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Server Error: Could not fetch sessions.' });
  }
});

// @desc    Create a new session
// @route   POST /api/sessions
// @access  Private (requires JWT token)
router.post('/', protect, async (req, res) => {
  // Destructure session data from the request body
  const { topic, startTime, endTime, emotions, actions, effectivenessScore, finalEmotionProbabilities } = req.body;

  // Basic validation
  if (!topic || !startTime) {
    return res.status(400).json({ message: 'Missing required session fields: topic or startTime.' });
  }

  try {
    // Create a new session document in MongoDB
    const newSession = await Session.create({
      userId: req.userId, // Link session to the authenticated user's ID
      topic,
      startTime,
      endTime,
      emotions,
      actions,
      effectivenessScore,
      finalEmotionProbabilities,
    });
    // Respond with the newly created session document
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ message: 'Server Error: Could not save session.', error: error.message });
  }
});

module.exports = router;
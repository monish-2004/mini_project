require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import your database connection utility (if you had a separate db.js)
// If connectDB is already in app.js, you don't need to import it again, just ensure it's called
// For now, I'll assume you had a separate config/db.js as per the suggested structure
const connectDB = require('./config/db'); // Ensure this path is correct

// Import your routes
const topicInfoRoute = require('./routes/topicInfo');
const emotionActionRoute = require('./routes/emotionAction');
const quizRoute = require('./routes/quiz');
const authRoute = require('./routes/auth');
const sessionRoutes = require('./routes/sessions'); // NEW: Import session routes

const app = express();

// Connect to MongoDB
connectDB(); // Call the connectDB function to establish database connection

// Middleware
app.use(cors()); // Enable CORS for all origins (consider restricting this in production)
app.use(express.json()); // Body parser for JSON data

// API Routes
app.use('/api/topic-info', topicInfoRoute);
app.use('/api/emotion-action', emotionActionRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/auth', authRoute);       // Auth routes for signup/login
app.use('/api/sessions', sessionRoutes); // NEW: Use the session routes, protected by authMiddleware

// Basic route for testing server status
app.get('/', (req, res) => {
  res.send('EduTrack Backend API is running...');
});

const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

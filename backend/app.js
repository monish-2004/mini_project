require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const connectDB = require('./config/db');

const topicInfoRoute = require('./routes/topicInfo');
const emotionActionRoute = require('./routes/emotionAction');
const quizRoute = require('./routes/quiz');
const authRoute = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');

const app = express();

connectDB();

// Middleware
app.use(cors()); 

// Reverted: Back to default express.json() limit (typically 100kb)
app.use(express.json()); 

// API Routes
app.use('/api/topic-info', topicInfoRoute);
app.use('/api/emotion-action', emotionActionRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/auth', authRoute);       
app.use('/api/sessions', sessionRoutes); 

app.get('/', (req, res) => {
  res.send('EduTrack Backend API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

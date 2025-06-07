require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const topicInfoRoute = require('./routes/topicInfo');
const emotionActionRoute = require('./routes/emotionAction');
const quizRoute = require('./routes/quiz');
const authRoute = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB - edutrack');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/topic-info', topicInfoRoute);
app.use('/api/emotion-action', emotionActionRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/auth', authRoute); // login/signup

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const topicInfoRoute = require('./routes/topicInfo');
const emotionActionRoute = require('./routes/emotionAction'); // Add this line
const quizRoute = require('./routes/quiz'); // Add this line


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/topic-info', topicInfoRoute);
app.use('/api/emotion-action', emotionActionRoute); // Register the emotion action route
app.use('/api/quiz', quizRoute); // Register the quiz route

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

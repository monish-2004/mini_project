const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/', async (req, res) => {
  const { emotion, action, topic } = req.body;

  try {
    if (emotion === 'boredom' && action === 'quiz') {
      // Forward to quiz route
      const quizRes = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || "general knowledge" }),
      });
      const quizData = await quizRes.json();
      return res.json({
        action: 'quiz',
        content: quizData
      });
    }

    if (emotion === 'confusion' && action === 'topicinfo') {
      // Forward to topicInfo route
      const topicRes = await fetch('http://localhost:5000/api/topic-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic }),
      });
      const topicData = await topicRes.json();
      return res.json({
        action: 'topicinfo',
        content: topicData.content || "No content available."
      });
    }

    // Fallback suggestion
    return res.json({
      action: 'suggestion',
      content: "Try a mini quiz or a quick game to beat boredom!"
    });

  } catch (err) {
    console.error("Error in emotion-action route:", err);
    return res.status(500).json({ error: "Failed to process request." });
  }
});

module.exports = router;

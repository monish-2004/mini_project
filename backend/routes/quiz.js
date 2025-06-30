const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

router.post('/generate', async (req, res) => {
  // Prompt for 5 general knowledge questions
  console.log("OpenRouter API Key:", OPENROUTER_API_KEY);
  const prompt = `
Generate 5 fun and original multiple-choice quiz questions on any general knowledge subject (not related to academics or the previous topic).
Your response must ONLY be valid JSON in the following format (no explanation or extra text):
[
  {
    "question": "Your question here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct option"
  },
  ...
]
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000, // Increase for multiple questions
        temperature: 1.2
      })
    });

    const data = await response.json();
    console.log("Full API response:", JSON.stringify(data, null, 2));

    if (data.error) {
      console.error("OpenRouter API error:", data.error);
      return res.status(500).json({ error: data.error.message || "OpenRouter API error" });
    }

    const content = data.choices?.[0]?.message?.content?.trim() || '';
    console.log("Model content:", content);

    let quizzes;
    try {
      quizzes = JSON.parse(content);
      // Validate that quizzes is an array of quiz objects
      if (
        !Array.isArray(quizzes) ||
        quizzes.length === 0 ||
        !quizzes.every(q =>
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.answer
        )
      ) {
        throw new Error("Malformed quiz array");
      }
      res.json({ quizzes });
    } catch {
      res.json({ error: "The AI did not return valid quiz questions.", raw: content });
    }
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).json({ error: "Failed to generate quiz questions." });
  }
});

module.exports = router;

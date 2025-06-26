const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/', async (req, res) => {
  const { topic } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  const prompt = `Explain the topic "${topic}" in detail for a school student in 1500-2000 words.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost", // use your domain if deployed
        "X-Title": "TopicExplainer"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      res.json({ content: data.choices[0].message.content });
    } else {
      console.error("OpenRouter error:", data);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: 'Failed to contact OpenRouter API' });
  }
});

module.exports = router;

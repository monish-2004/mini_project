const express = require('express');
const router = express.Router();
const axios = require('axios');

// POST /api/emotion-predict
router.post('/', async (req, res) => {
  try {
    const { features } = req.body; // Expect array of 9 features
    const response = await axios.post('http://localhost:6000/predict', { features });
    res.json(response.data);
  } catch (err) {
    console.error('Prediction error:', err.message);
    res.status(500).json({ error: 'Prediction service unavailable' });
  }
});

module.exports = router;

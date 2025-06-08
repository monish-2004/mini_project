const express = require('express');
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const router = express.Router();

router.post('/', async (req, res) => {
  if (req.body.features) {
    const featureVector = req.body.features;
    console.log('Received features for prediction:', featureVector);

    try {
      const pythonProcess = spawn('python', [
        '../ml_service/predict.py',
        JSON.stringify(featureVector)
      ]);

      let pythonOutput = '';
      let pythonError = '';

      pythonProcess.stdout.on('data', (data) => {
        pythonOutput += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const predictionResult = JSON.parse(pythonOutput);
            // console.log('Raw Python script output:', predictionResult); // Keep for detailed debug if needed

            const pythonProbs = predictionResult.emotionProbs;

            if (!pythonProbs || pythonProbs.length !== 4) {
                console.error('Unexpected length of emotionProbs from Python:', pythonProbs);
                return res.status(500).json({ error: 'ML service returned malformed probabilities.' });
            }

            const reorderedEmotionProbs = [
                pythonProbs[0], // boredom
                pythonProbs[1], // confusion
                pythonProbs[3], // fatigue (from 'tired')
                pythonProbs[2]  // focus (from 'focused')
            ];

            // console.log('Reordered emotion probabilities for frontend:', reorderedEmotionProbs); // Keep for detailed debug if needed

            return res.json({ emotionProbs: reorderedEmotionProbs });
          } catch (parseErr) {
            console.error('Error parsing or reordering Python script output:', parseErr);
            console.error('Python stdout:', pythonOutput);
            console.error('Python stderr:', pythonError);
            return res.status(500).json({ error: 'Failed to process prediction result from ML service.' });
          }
        } else {
          console.error(`Python script exited with code ${code}`);
          console.error('Python stderr:', pythonError);
          return res.status(500).json({ error: 'ML service prediction failed.' });
        }
      });

      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python child process:', err);
        return res.status(500).json({ error: 'Failed to start ML service.' });
      });

    } catch (err) {
      console.error("Error in emotion prediction route:", err);
      return res.status(500).json({ error: "Failed to process emotion prediction request." });
    }
  }
  // If no 'features' are present, proceed with existing adaptive action logic
  else {
    const { emotion, action, topic } = req.body;

    try {
      if (emotion === 'boredom' && action === 'quiz') {
        console.log('Attempting to fetch quiz from /api/quiz/generate...');
        const quizRes = await fetch('http://localhost:5000/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic || "general knowledge" }),
        });

        // NEW: Check if the response from /api/quiz/generate was successful
        if (!quizRes.ok) {
          const errorDetail = await quizRes.text(); // Get raw error text
          console.error(`Error from /api/quiz/generate: Status ${quizRes.status}, Body: ${errorDetail}`);
          return res.status(quizRes.status).json({ // Return the actual status and error from quiz/generate
            action: 'error',
            message: `Failed to generate quiz: ${quizRes.statusText || 'Unknown error'}`,
            details: errorDetail
          });
        }

        const quizData = await quizRes.json();
        console.log('Successfully received quizData from /api/quiz/generate:', quizData);
        
        return res.json({
          action: 'quiz',
          content: quizData // This is what quizApi.ts will receive as data.content
        });
      }

      if (emotion === 'confusion' && action === 'topicinfo') {
        console.log('Attempting to fetch topic info from /api/topic-info...');
        const topicRes = await fetch('http://localhost:5000/api/topic-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic }),
        });

        // NEW: Check if the response from /api/topic-info was successful
        if (!topicRes.ok) {
          const errorDetail = await topicRes.text();
          console.error(`Error from /api/topic-info: Status ${topicRes.status}, Body: ${errorDetail}`);
          return res.status(topicRes.status).json({
            action: 'error',
            message: `Failed to get topic info: ${topicRes.statusText || 'Unknown error'}`,
            details: errorDetail
          });
        }

        const topicData = await topicRes.json();
        console.log('Successfully received topicData from /api/topic-info:', topicData);

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
      console.error("Caught unexpected error in emotion-action route (adaptive action):", err);
      // If the above internal fetches fail before even getting a response.ok,
      // this outer catch will handle it.
      return res.status(500).json({ error: "Failed to process adaptive action request due to an internal error." });
    }
  }
});

module.exports = router;

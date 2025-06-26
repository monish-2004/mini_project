// src/api/quizApi.ts
export interface QuizData {
  question: string;
  options: string[];
  answer: string;
  raw?: string;
}

// No longer need QuizResponse interface for this specific parsing logic,
// as we directly check the structure of data.content.

export async function fetchQuiz(topic: string = "general knowledge"): Promise<QuizData[]> {
  try {
    const response = await fetch('http://localhost:5000/api/emotion-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion: 'boredom', action: 'quiz', topic }),
    });

    if (!response.ok) {
      // Log the full error response from backend if it's not OK
      const errorText = await response.text();
      console.error("Backend response for quiz fetch not OK:", response.status, errorText);
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }

    const data = await response.json(); // This 'data' is the response from /api/emotion-action
    console.log("fetchQuiz: Raw backend response:", data); // Debugging: See the full response from emotion-action

    // The actual quiz data is nested under 'content' from emotionAction.js
    const quizContent = data.content; 

    // Debugging: Log the extracted content
    console.log("fetchQuiz: Extracted quizContent:", quizContent);

    if (Array.isArray(quizContent)) {
      // Case 1: quizContent is already an array of QuizData objects
      console.log("fetchQuiz: quizContent is an array.");
      return quizContent;
    } else if (quizContent && typeof quizContent === 'object' && quizContent.question) {
      // Case 2: quizContent is a single QuizData object
      console.log("fetchQuiz: quizContent is a single quiz object.");
      return [quizContent]; // Return it as an array with one element
    } else if (quizContent && typeof quizContent === 'object' && Array.isArray(quizContent.quizzes)) {
      // Case 3: quizContent is an object that contains a 'quizzes' array (e.g., from LLM directly)
      console.log("fetchQuiz: quizContent contains a 'quizzes' array.");
      return quizContent.quizzes;
    }
    
    // If none of the above structures match
    console.warn("fetchQuiz: Unexpected quiz data structure, returning empty array.", quizContent);
    return []; 

  } catch (error) {
    console.error("Failed to fetch quiz (network error or parsing error):", error);
    return [{
      question: "Failed to load quiz. Please try again later. Check browser console for details.",
      options: [],
      answer: "",
      raw: ""
    }];
  }
}

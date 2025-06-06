// src/api/quizApi.ts
export interface QuizData {
  question: string;
  options: string[];
  answer: string;
  raw?: string;
}

interface QuizResponse {
  quizzes?: QuizData[];
  question?: string;
  options?: string[];
  answer?: string;
  raw?: string;
}

export async function fetchQuiz(topic: string = "general knowledge"): Promise<QuizData[]> {
  try {
    const response = await fetch('http://localhost:5000/api/emotion-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion: 'boredom', action: 'quiz', topic }),
    });
    const data = await response.json();

    if (Array.isArray(data.content?.quizzes)) {
      return data.content.quizzes;
    } else if (data.content?.question) {
      return [data.content];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    return [{
      question: "Failed to load quiz.",
      options: [],
      answer: "",
      raw: ""
    }];
  }
}

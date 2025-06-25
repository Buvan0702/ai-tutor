import type { GenerateMcqOutput } from '@/ai/flows/generate-mcq';

export type QuizQuestion = GenerateMcqOutput[number];

export interface QuizResult {
  userId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: number; // Store as timestamp
  difficulty: string;
}

export interface UserAnswer {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

export interface AIFeedback {
    feedback: string;
    suggestions: string[];
}

import type { GenerateMcqOutput } from '@/ai/flows/generate-mcq';

export type QuizQuestion = GenerateMcqOutput[number];

export interface QuizResult {
  id?: string;
  userId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: number; // Store as timestamp
  difficulty: string;
  timeTaken?: number; // in seconds
  userAnswers?: UserAnswer[];
}

export interface UserAnswer {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
}

export interface AIFeedback {
    feedback: string;
    suggestions: string[];
    youtubeSearchQueries: string[];
}

export interface LearningPathStep {
    topic: string;
    description: string;
}

export type LearningPath = LearningPathStep[];

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

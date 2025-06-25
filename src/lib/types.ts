import type { GenerateMcqOutput } from '@/ai/flows/generate-mcq';

export type QuizQuestion = GenerateMcqOutput[number];

export interface QuizResult {
  userId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  createdAt: number; // Store as timestamp
}

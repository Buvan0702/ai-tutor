'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating multiple-choice questions (MCQs) on a given topic.
 *
 * The flow takes a topic as input and returns a list of MCQs related to that topic.
 * Each MCQ has a question and options, with one correct option.
 *
 * @module src/ai/flows/generate-mcq
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateMcqInputSchema = z.object({
  topic: z.string().describe('The programming topic to generate questions for.'),
  questionCount: z.number().describe('The number of questions to generate.'),
  difficulty: z.string().describe('The difficulty level for the questions (e.g., Easy, Medium, Hard).'),
});
export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;

const GenerateMcqOutputSchema = z.array(z.object({
  question: z.string().describe('The multiple choice question.'),
  options: z.array(z.string()).describe('The options for the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('A brief explanation for the correct answer.'),
  hints: z.array(z.string()).describe('An array of 2-3 hints for the question. The hints should be progressively more revealing, without giving away the answer directly.'),
}));
export type GenerateMcqOutput = z.infer<typeof GenerateMcqOutputSchema>;

export async function generateMcq(input: GenerateMcqInput): Promise<GenerateMcqOutput> {
  return generateMcqFlow(input);
}

const generateMcqPrompt = ai.definePrompt({
  name: 'generateMcqPrompt',
  input: {schema: GenerateMcqInputSchema},
  output: {schema: GenerateMcqOutputSchema},
  prompt: `You are a quiz generator that generates multiple choice questions on a given topic.

  Generate {{questionCount}} multiple choice questions on the following topic: "{{topic}}".
  The difficulty level for the questions should be {{difficulty}}.

  Each question should have 4 options, with one correct answer.
  For each question, also provide a concise explanation for the correct answer, and 2-3 progressively revealing hints that guide the user to the correct answer without giving it away.

  The output should be a JSON array of questions, where each question has the following format:
  {
  "question": "The question text",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correctAnswer": "The correct answer",
  "explanation": "A concise explanation of why the answer is correct.",
  "hints": ["Hint 1", "Hint 2", "Hint 3"]
  }
  `,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateMcqFlow = ai.defineFlow(
  {
    name: 'generateMcqFlow',
    inputSchema: GenerateMcqInputSchema,
    outputSchema: GenerateMcqOutputSchema,
  },
  async input => {
    const {output} = await generateMcqPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate questions. This could be due to the topic being too sensitive or unsupported. Please try a different topic.');
    }
    return output;
  }
);

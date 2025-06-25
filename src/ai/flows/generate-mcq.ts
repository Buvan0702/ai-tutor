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
import {z} from 'genkit';

const GenerateMcqInputSchema = z.object({
  topic: z.string().describe('The programming topic to generate questions for.'),
});
export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;

const GenerateMcqOutputSchema = z.array(z.object({
  question: z.string().describe('The multiple choice question.'),
  options: z.array(z.string()).describe('The options for the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('A brief explanation for the correct answer.'),
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

  Generate 3-5 multiple choice questions on the following topic:
  {{topic}}

  Each question should have 4 options, with one correct answer.
  The output should be a JSON array of questions, where each question has the following format:
  {
  "question": "The question text",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "correctAnswer": "The correct answer",
  "explanation": "A concise explanation of why the answer is correct."
  }
  `,
});

const generateMcqFlow = ai.defineFlow(
  {
    name: 'generateMcqFlow',
    inputSchema: GenerateMcqInputSchema,
    outputSchema: GenerateMcqOutputSchema,
  },
  async input => {
    const {output} = await generateMcqPrompt(input);
    return output!;
  }
);

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

const QuestionSchema = z.object({
  question: z.string().describe('The question text. For code-snippet questions, this should ONLY be the raw code block.'),
  questionType: z.enum(['multiple-choice', 'multiple-answer', 'code-snippet']).describe("The type of question being generated."),
  options: z.array(z.string()).describe('The options for the question.'),
  correctAnswers: z.array(z.string()).describe('An array of correct answers. For multiple-choice and code-snippet questions, this will have only one answer. For multiple-answer, it can have one or more.'),
  explanation: z.string().describe('A brief explanation for the correct answer(s).'),
  hints: z.array(z.string()).describe('An array of 2-3 hints for the question. The hints should be progressively more revealing, without giving away the answer directly.'),
});

const GenerateMcqOutputSchema = z.array(QuestionSchema);
export type GenerateMcqOutput = z.infer<typeof GenerateMcqOutputSchema>;

export async function generateMcq(input: GenerateMcqInput): Promise<GenerateMcqOutput> {
  return generateMcqFlow(input);
}

const generateMcqPrompt = ai.definePrompt({
  name: 'generateMcqPrompt',
  input: {schema: GenerateMcqInputSchema},
  output: {schema: GenerateMcqOutputSchema},
  prompt: `You are a quiz generator that creates questions on programming topics.

  Generate {{questionCount}} questions on the following topic: "{{topic}}".
  The difficulty level for the questions should be {{difficulty}}.

  Please generate a mix of the following question types:
  1. 'multiple-choice': A standard question with only one correct answer.
  2. 'multiple-answer': A question where one or more options are correct. The user must select all correct options.
  3. 'code-snippet': A question based on a block of code. The 'question' field should ONLY contain the raw code. The options should be potential outputs, error descriptions, or explanations. This type must have only one correct answer.

  For each question:
  - It should have 4 options.
  - The 'correctAnswers' field must be an array containing all correct options. For 'multiple-choice' and 'code-snippet' types, this array will contain exactly one string. For 'multiple-answer', it can contain one or more.
  - Provide a concise explanation for the correct answer(s).
  - Provide 2-3 progressively revealing hints.
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

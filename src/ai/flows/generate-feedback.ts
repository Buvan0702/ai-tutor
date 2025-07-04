'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized feedback on a quiz.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { UserAnswer, AIFeedback } from '@/lib/types';

const UserAnswerSchema = z.object({
    question: z.string(),
    selectedAnswers: z.array(z.string()),
    correctAnswers: z.array(z.string()),
    isCorrect: z.boolean(),
    explanation: z.string(),
});

const GenerateFeedbackInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz.'),
  results: z.array(UserAnswerSchema).describe("An array of the user's answers."),
});

const GenerateFeedbackOutputSchema = z.object({
    feedback: z.string().describe('A friendly, personalized paragraph of feedback for the user based on their performance. Analyze their incorrect answers to find patterns. Congratulate them on what they got right.'),
    suggestions: z.array(z.string()).describe('An array of 2-3 related, more advanced, or foundational topics the user could study next.'),
    youtubeSearchQueries: z.array(z.string()).describe('A list of 2-3 specific search queries for YouTube to find helpful videos on the topics the user struggled with.'),
});

export async function generateFeedback(topic: string, results: UserAnswer[]): Promise<AIFeedback> {
  const response = await generateFeedbackFlow({ topic, results });
  return response;
}

const generateFeedbackPrompt = ai.definePrompt({
    name: 'generateFeedbackPrompt',
    input: { schema: GenerateFeedbackInputSchema },
    output: { schema: GenerateFeedbackOutputSchema },
    prompt: `You are a friendly and encouraging AI programming tutor.
    A user has just completed a quiz on the topic: {{topic}}.

    Here are their results:
    {{#each results}}
    - Question: "{{question}}"
      - Their Answer(s): "{{#each selectedAnswers}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}" ({{#if isCorrect}}Correct{{else}}Incorrect{{/if}})
      - Correct Answer(s): "{{#each correctAnswers}}{{.}}{{#unless @last}}, {{/unless}}{{/each}}"
      {{#unless isCorrect}}
      - Explanation for the correct answer: "{{explanation}}"
      {{/unless}}
    {{/each}}

    Please analyze their answers and provide:
    1. A single paragraph of personalized, constructive feedback. Start by acknowledging their effort. Point out concepts they seem to have grasped well based on their correct answers. For the incorrect answers, use the provided explanation to gently clarify the underlying concepts they might be struggling with. Do not just list the wrong answers. Be encouraging and supportive.
    2. A list of 2-3 suggestions for related topics to study next. These could be topics that build on the current one, or foundational topics if they struggled.
    3. A list of 2-3 specific YouTube search queries that would help the user find videos about the concepts they answered incorrectly. For example, if they struggled with React state management, a query could be "React useState hook tutorial".
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

const generateFeedbackFlow = ai.defineFlow(
    {
        name: 'generateFeedbackFlow',
        inputSchema: GenerateFeedbackInputSchema,
        outputSchema: GenerateFeedbackOutputSchema,
    },
    async (input) => {
        const { output } = await generateFeedbackPrompt(input);
        if (!output) {
            throw new Error('The AI failed to generate feedback for this quiz.');
        }
        return output;
    }
);

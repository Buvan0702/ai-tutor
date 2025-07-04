'use server';
/**
 * @fileOverview Defines a Genkit flow for a general AI tutor that suggests quiz topics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ChatMessage } from '@/lib/types';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const SuggestTopicInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});

const SuggestTopicOutputSchema = z.object({
  response: z.string().describe("The AI tutor's conversational response."),
  suggestedTopics: z.array(z.string()).describe("A list of 1-3 specific programming topics that the user could take a quiz on. Only suggest topics when the user seems ready or asks for them."),
});

export type SuggestTopicOutput = z.infer<typeof SuggestTopicOutputSchema>;

export async function suggestTopic(history: ChatMessage[]): Promise<SuggestTopicOutput> {
  const result = await suggestTopicFlow({ history });
  return result;
}

const suggestTopicPrompt = ai.definePrompt({
    name: 'suggestTopicPrompt',
    input: { schema: SuggestTopicInputSchema },
    output: { schema: SuggestTopicOutputSchema },
    prompt: `You are a friendly and helpful AI tutor on a quiz application's landing page. Your goal is to welcome users, understand their learning interests, and guide them towards a relevant programming quiz topic.

    - Be conversational and encouraging.
    - If the user is unsure, ask them what programming languages or concepts they're interested in.
    - Based on the user's input, suggest 1 to 3 specific, concrete topics they can take a quiz on (e.g., "JavaScript Arrays", "Python Dictionaries", "CSS Flexbox").
    - Do NOT suggest broad topics like "JavaScript" or "Python". Be specific.
    - Only include topics in the 'suggestedTopics' array when you are actively recommending them. If you are just chatting, leave it empty.
    - Keep your text response concise.

    Conversation History:
    {{#each history}}
    **{{role}}**: {{content}}
    {{/each}}

    Your turn to respond as the model:
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

const suggestTopicFlow = ai.defineFlow(
    {
        name: 'suggestTopicFlow',
        inputSchema: SuggestTopicInputSchema,
        outputSchema: SuggestTopicOutputSchema,
    },
    async (input) => {
        const { output } = await suggestTopicPrompt(input);
        if (!output) {
            throw new Error('The AI tutor failed to generate a response.');
        }
        return output;
    }
);

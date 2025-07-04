'use server';
/**
 * @fileOverview Defines a Genkit flow for a conversational AI tutor.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ChatMessage } from '@/lib/types';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const ChatTutorInputSchema = z.object({
  topic: z.string().describe('The programming topic for the discussion.'),
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
});

const ChatTutorOutputSchema = z.object({
  response: z.string().describe("The AI tutor's response to the user's message."),
});

export async function chatWithTutor(topic: string, history: ChatMessage[]): Promise<string> {
  const result = await chatTutorFlow({ topic, history });
  return result.response;
}

const chatTutorPrompt = ai.definePrompt({
    name: 'chatTutorPrompt',
    input: { schema: ChatTutorInputSchema },
    output: { schema: ChatTutorOutputSchema },
    prompt: `You are a friendly and expert AI programming tutor. The user wants to chat with you about the topic: "{{topic}}".

    Continue the following conversation. Be helpful, concise, and encouraging. Explain concepts clearly. You can use markdown for formatting if needed.

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

const chatTutorFlow = ai.defineFlow(
    {
        name: 'chatTutorFlow',
        inputSchema: ChatTutorInputSchema,
        outputSchema: ChatTutorOutputSchema,
    },
    async (input) => {
        const { output } = await chatTutorPrompt(input);
        if (!output) {
            throw new Error('The AI tutor failed to generate a response.');
        }
        return output;
    }
);

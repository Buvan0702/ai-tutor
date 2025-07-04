'use server';
/**
 * @fileOverview Defines a Genkit flow for generating a structured learning path for a given topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateLearningPathInputSchema = z.object({
  topic: z.string().describe('The main programming topic to create a learning path for.'),
});
export type GenerateLearningPathInput = z.infer<typeof GenerateLearningPathInputSchema>;

const LearningPathStepSchema = z.object({
    topic: z.string().describe('The specific topic for this step in the learning path.'),
    description: z.string().describe('A brief, one-sentence description of what this step covers.'),
});

const GenerateLearningPathOutputSchema = z.object({
    path: z.array(LearningPathStepSchema).describe('An array of learning path steps, ordered logically from beginner to advanced.'),
});
export type GenerateLearningPathOutput = z.infer<typeof GenerateLearningPathOutputSchema>;

export async function generateLearningPath(input: GenerateLearningPathInput): Promise<GenerateLearningPathOutput> {
  return generateLearningPathFlow(input);
}

const generateLearningPathPrompt = ai.definePrompt({
  name: 'generateLearningPathPrompt',
  input: { schema: GenerateLearningPathInputSchema },
  output: { schema: GenerateLearningPathOutputSchema },
  prompt: `You are a curriculum designer for a programming education platform.
  
  Create a structured, step-by-step learning path for the following topic: "{{topic}}".
  
  The path should consist of 5-7 logical steps, starting from the foundational concepts and progressing to more advanced ones.
  Each step should have a clear topic and a brief, one-sentence description.
  
  For example, for the topic "React.js", a path might be:
  1.  **React Fundamentals:** Learn about JSX, components, and props.
  2.  **State and Lifecycle:** Master component state and lifecycle methods.
  3.  **Handling Events:** Understand how to handle user interactions.
  4.  **Conditional Rendering:** Learn to render components based on conditions.
  5.  **Lists and Keys:** Discover how to display lists of data.
  6.  **React Hooks:** Explore modern React features like useState and useEffect.
  7.  **Project Setup:** Learn how to set up a new React project.
  
  Generate the learning path for "{{topic}}".
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

const generateLearningPathFlow = ai.defineFlow(
  {
    name: 'generateLearningPathFlow',
    inputSchema: GenerateLearningPathInputSchema,
    outputSchema: GenerateLearningPathOutputSchema,
  },
  async (input) => {
    const { output } = await generateLearningPathPrompt(input);
    if (!output) {
      throw new Error('The AI failed to generate a learning path for this topic.');
    }
    return output;
  }
);

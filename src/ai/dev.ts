'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-mcq.ts';
import '@/ai/flows/generate-feedback.ts';
import '@/ai/flows/generate-learning-path.ts';
import '@/ai/flows/chat-tutor.ts';
import '@/ai/flows/suggest-topic-flow.ts';

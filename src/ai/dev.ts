import { config } from 'dotenv';
config();

import '@/ai/flows/generate-mcq.ts';
import '@/ai/flows/generate-feedback.ts';
import '@/ai/flows/generate-learning-path.ts';

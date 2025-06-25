'use server';
import { generateMcq } from '@/ai/flows/generate-mcq';
import { generateFeedback } from '@/ai/flows/generate-feedback';
import { db } from '@/lib/firebase';
import type { QuizResult, UserAnswer } from '@/lib/types';
import { addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function generateQuizAction(params: {topic: string, questionCount: number, difficulty: string}) {
  try {
    const questions = await generateMcq({
        topic: params.topic,
        questionCount: params.questionCount,
        difficulty: params.difficulty,
    });
    return { success: true, questions };
  } catch (error) {
    console.error('Error generating quiz:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.';
    return { success: false, error: errorMessage };
  }
}

export async function saveQuizResultAction(result: Omit<QuizResult, 'id' | 'userId' | 'createdAt'>, userId: string) {
    if (!userId) {
        return { success: false, error: 'User not authenticated.' };
    }

    try {
        const docRef = await addDoc(collection(db, 'quizResults'), {
            ...result,
            userId: userId,
            createdAt: Date.now(),
        });
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error('Error saving quiz result:', error);
        return { success: false, error: 'Failed to save quiz result.' };
    }
}

export async function getPerformanceDataAction(params: { userId: string }) {
    if (!params.userId) {
        return { success: false, error: 'User not authenticated.' };
    }

    try {
        const q = query(
            collection(db, 'quizResults'), 
            where('userId', '==', params.userId),
            orderBy('createdAt', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const results: QuizResult[] = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() } as QuizResult);
        });
        return { success: true, data: results };
    } catch (error) {
        console.error('Error fetching performance data:', error);
        return { success: false, error: 'Failed to fetch performance data.' };
    }
}


export async function generateFeedbackAction(topic: string, results: UserAnswer[]) {
    try {
        const feedback = await generateFeedback(topic, results);
        return { success: true, feedback };
    } catch (error) {
        console.error('Error generating feedback:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate feedback.';
        return { success: false, error: errorMessage };
    }
}

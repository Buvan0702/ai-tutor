'use server';
import { generateMcq } from '@/ai/flows/generate-mcq';
import { generateFeedback } from '@/ai/flows/generate-feedback';
import { auth, db } from '@/lib/firebase';
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
    return { success: false, error: 'Failed to generate quiz. Please try again.' };
  }
}

export async function saveQuizResultAction(result: Omit<QuizResult, 'userId' | 'createdAt'>) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }

    try {
        const docRef = await addDoc(collection(db, 'quizResults'), {
            ...result,
            userId: user.uid,
            createdAt: Date.now(),
        });
        return { success: true, docId: docRef.id };
    } catch (error) {
        console.error('Error saving quiz result:', error);
        return { success: false, error: 'Failed to save quiz result.' };
    }
}

export async function getPerformanceDataAction() {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: 'User not authenticated.' };
    }

    try {
        const q = query(
            collection(db, 'quizResults'), 
            where('userId', '==', user.uid),
            orderBy('createdAt', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const results: QuizResult[] = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data() as QuizResult);
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
        return { success: false, error: 'Failed to generate feedback.' };
    }
}

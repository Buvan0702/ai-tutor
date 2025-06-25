'use server';
import { generateMcq } from '@/ai/flows/generate-mcq';
import { auth, db } from '@/lib/firebase';
import { QuizResult } from '@/lib/types';
import { addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function generateQuizAction(topic: string) {
  try {
    const questions = await generateMcq({ topic });
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

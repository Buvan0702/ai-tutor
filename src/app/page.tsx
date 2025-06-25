'use client';

import { useAuth } from '@/context/auth-context';
import QuizApp from '@/components/quiz-app';
import LandingPage from '@/components/landing-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl space-y-8">
          <Skeleton className="h-16 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }
  
  return user ? <QuizApp /> : <LandingPage />;
}
'use client';

import { useState } from 'react';
import { BrainCircuit, LayoutDashboard, Lightbulb } from 'lucide-react';
import { AuthButton } from './auth-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizCreator from './quiz/quiz-creator';
import PerformanceDashboard from './quiz/performance-dashboard';
import QuizSession from './quiz/quiz-session';
import type { QuizQuestion } from '@/lib/types';
import { generateQuizAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

export default function QuizApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizKey, setQuizKey] = useState(0);
  const { toast } = useToast();

  const handleQuizCreated = (newQuestions: QuizQuestion[], topic: string, difficulty: string) => {
    setQuestions(newQuestions);
    setQuizTopic(topic);
    setQuizDifficulty(difficulty);
    setQuizKey(prev => prev + 1); // Force re-mount of QuizSession
  };

  const handleQuizFinish = () => {
    setQuestions(null);
    setQuizTopic('');
    setActiveTab('dashboard');
  };

  const startNewQuiz = () => {
    setQuestions(null);
    setQuizTopic('');
    setActiveTab('new-quiz');
  };

  const handleRetryQuiz = async (topic: string, difficulty: string, questionCount: number) => {
    const result = await generateQuizAction({
      topic,
      questionCount,
      difficulty,
    });

    if (result.success && result.questions && result.questions.length > 0) {
      handleQuizCreated(result.questions, topic, difficulty);
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Retry Quiz',
        description: result.error || 'Could not generate questions for this topic.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">Quiz AI</h1>
        </div>
        <AuthButton />
      </header>
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {questions ? (
          <QuizSession
            key={quizKey}
            questions={questions}
            topic={quizTopic}
            difficulty={quizDifficulty}
            onFinish={handleQuizFinish}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="new-quiz">
                <Lightbulb className="mr-2" /> New Quiz
              </TabsTrigger>
              <TabsTrigger value="dashboard">
                <LayoutDashboard className="mr-2" /> Dashboard
              </TabsTrigger>
            </TabsList>
            <TabsContent value="new-quiz">
              <QuizCreator onQuizCreated={handleQuizCreated} />
            </TabsContent>
            <TabsContent value="dashboard">
              <PerformanceDashboard onStartNewQuiz={startNewQuiz} onRetryQuiz={handleRetryQuiz} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

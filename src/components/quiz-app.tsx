'use client';

import { useState } from 'react';
import {
  BrainCircuit,
  LayoutDashboard,
  PlusCircle,
} from 'lucide-react';
import { AuthButton } from './auth-button';
import QuizCreator from './quiz/quiz-creator';
import PerformanceDashboard from './quiz/performance-dashboard';
import QuizSession from './quiz/quiz-session';
import type { QuizQuestion } from '@/lib/types';
import { generateQuizAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';

type ActiveView = 'dashboard' | 'new-quiz';

export default function QuizApp() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizKey, setQuizKey] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleQuizCreated = (
    newQuestions: QuizQuestion[],
    topic: string,
    difficulty: string
  ) => {
    setQuestions(newQuestions);
    setQuizTopic(topic);
    setQuizDifficulty(difficulty);
    setQuizKey((prev) => prev + 1);
  };

  const handleQuizFinish = () => {
    setQuestions(null);
    setQuizTopic('');
    setActiveView('dashboard');
  };

  const startNewQuiz = () => {
    setQuestions(null);
    setQuizTopic('');
    setActiveView('new-quiz');
  };

  const handleRetryQuiz = async (
    topic: string,
    difficulty: string,
    questionCount: number
  ) => {
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
        description:
          result.error || 'Could not generate questions for this topic.',
      });
    }
  };

  const PageTitle: Record<ActiveView, string> = {
    dashboard: 'Performance Dashboard',
    'new-quiz': 'Create New Quiz',
  };

  const renderContent = () => {
    if (questions) {
      return (
        <QuizSession
          key={quizKey}
          questions={questions}
          topic={quizTopic}
          difficulty={quizDifficulty}
          onFinish={handleQuizFinish}
        />
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <PerformanceDashboard
            onStartNewQuiz={startNewQuiz}
            onRetryQuiz={handleRetryQuiz}
          />
        );
      case 'new-quiz':
        return <QuizCreator onQuizCreated={handleQuizCreated} />;
      default:
        return null;
    }
  };

  const pageTitle = questions ? `Quiz: ${quizTopic}` : PageTitle[activeView];

  if (!user) return null;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-8 w-8 text-sidebar-primary" />
            <span className="text-xl font-bold font-headline text-sidebar-primary group-data-[collapsible=icon]:hidden">
              Quiz AI
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('dashboard')}
                isActive={activeView === 'dashboard' && !questions}
                tooltip="Dashboard"
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView('new-quiz')}
                isActive={activeView === 'new-quiz' && !questions}
                tooltip="New Quiz"
              >
                <PlusCircle />
                <span>New Quiz</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold font-headline text-foreground">
              {pageTitle}
            </h1>
          </div>
          <AuthButton />
        </header>
        <main className="flex-grow p-4 md:p-6 overflow-auto">
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  BrainCircuit,
  LayoutDashboard,
  PlusCircle,
  BookOpenCheck,
} from 'lucide-react';
import { AuthButton } from './auth-button';
import QuizCreator from './quiz/quiz-creator';
import PerformanceDashboard from './quiz/performance-dashboard';
import QuizSession from './quiz/quiz-session';
import LearningPaths from './learning-paths';
import type { QuizQuestion, QuizResult } from '@/lib/types';
import { generateQuizAction, getPerformanceDataAction } from '@/app/actions';
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
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from './theme-toggle';
import { ScrollArea } from './ui/scroll-area';

type ActiveView = 'dashboard' | 'new-quiz' | 'learning-paths';

export default function QuizApp() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizKey, setQuizKey] = useState(0);
  const [dashboardKey, setDashboardKey] = useState(Date.now());
  const [initialTopicForLearningPath, setInitialTopicForLearningPath] =
    useState<string | undefined>();

  // New states for history
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [resultToReview, setResultToReview] = useState<QuizResult | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setHistoryLoading(true);
      const res = await getPerformanceDataAction({ userId: user.uid });
      if (res.success && res.data) {
        // reverse() mutates the array, so slice it first
        setQuizHistory(res.data.slice().reverse());
      }
      setHistoryLoading(false);
    };
    fetchHistory();
  }, [user, dashboardKey]);

  const handleQuizCreated = (
    newQuestions: QuizQuestion[],
    topic: string,
    difficulty: string
  ) => {
    setQuestions(newQuestions);
    setQuizTopic(topic);
    setQuizDifficulty(difficulty);
    setQuizKey((prev) => prev + 1);
    setResultToReview(null); // Clear any reviewed result when starting new quiz
  };

  const handleStartQuizFromPath = async (topic: string) => {
    toast({ title: 'Generating your quiz...', description: `Topic: ${topic}` });
    const result = await generateQuizAction({
      topic,
      questionCount: 5, // Default for learning paths
      difficulty: 'Medium', // Default for learning paths
    });

    if (result.success && result.questions && result.questions.length > 0) {
      handleQuizCreated(result.questions, topic, 'Medium');
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Start Quiz',
        description:
          result.error || 'Could not generate questions for this topic.',
      });
    }
  };

  const handleQuizFinish = () => {
    setQuestions(null);
    setQuizTopic('');
    setActiveView('dashboard');
    setDashboardKey(Date.now()); // This will force the dashboard and history to refetch data
  };

  const startNewQuiz = () => {
    setQuestions(null);
    setQuizTopic('');
    setActiveView('new-quiz');
    setResultToReview(null);
  };

  const handleRetryQuiz = async (
    topic: string,
    difficulty: string,
    questionCount: number
  ) => {
    toast({ title: 'Generating your quiz...', description: `Retrying: ${topic}` });
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

  const handleGenerateLearningPath = (topic: string) => {
    setInitialTopicForLearningPath(topic);
    setActiveView('learning-paths');
    setResultToReview(null);
  };

  const handleHistoryClick = (result: QuizResult) => {
    setActiveView('dashboard');
    setResultToReview(result);
  };

  const changeView = (view: ActiveView) => {
    setInitialTopicForLearningPath(undefined);
    setActiveView(view);
    setResultToReview(null);
  };

  const PageTitle: Record<ActiveView, string> = {
    dashboard: 'Performance Dashboard',
    'new-quiz': 'Create New Quiz',
    'learning-paths': 'Learning Paths',
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
            key={dashboardKey}
            onStartNewQuiz={startNewQuiz}
            onRetryQuiz={handleRetryQuiz}
            onGenerateLearningPath={handleGenerateLearningPath}
            initialResultToReview={resultToReview}
          />
        );
      case 'new-quiz':
        return <QuizCreator onQuizCreated={handleQuizCreated} />;
      case 'learning-paths':
        return (
          <LearningPaths
            onStartQuiz={handleStartQuizFromPath}
            initialTopic={initialTopicForLearningPath}
          />
        );
      default:
        return null;
    }
  };

  const pageTitle = questions ? `Quiz: ${quizTopic}` : PageTitle[activeView];

  if (!user) return null;

  return (
    <SidebarProvider>
      <Sidebar className="no-print">
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
                onClick={() => changeView('dashboard')}
                isActive={activeView === 'dashboard' && !questions}
                tooltip="Dashboard"
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => changeView('new-quiz')}
                isActive={activeView === 'new-quiz' && !questions}
                tooltip="New Quiz"
              >
                <PlusCircle />
                <span>New Quiz</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => changeView('learning-paths')}
                isActive={activeView === 'learning-paths' && !questions}
                tooltip="Learning Paths"
              >
                <BookOpenCheck />
                <span>Learning Paths</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
          <SidebarGroup className="p-2 flex-1 flex flex-col">
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <ScrollArea className="flex-1 -mx-2">
              <SidebarMenu className="p-2">
                {historyLoading && (
                  <>
                    <SidebarMenuSkeleton showIcon={false} />
                    <SidebarMenuSkeleton showIcon={false} />
                    <SidebarMenuSkeleton showIcon={false} />
                    <SidebarMenuSkeleton showIcon={false} />
                  </>
                )}
                {!historyLoading && quizHistory.length === 0 && (
                  <p className="px-2 text-xs text-sidebar-foreground/70">
                    Your quiz history will appear here.
                  </p>
                )}
                {!historyLoading &&
                  quizHistory.map((result) => (
                    <SidebarMenuItem key={result.id}>
                      <SidebarMenuButton
                        onClick={() => handleHistoryClick(result)}
                        isActive={
                          activeView === 'dashboard' &&
                          resultToReview?.id === result.id
                        }
                        tooltip={result.topic}
                        variant="ghost"
                        className="h-auto py-1.5 justify-start font-normal"
                      >
                        <span className="truncate">{result.topic}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 no-print">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold font-headline text-foreground">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthButton />
          </div>
        </header>
        <main
          className="flex-grow p-4 md:p-6 overflow-auto"
          id="printable-area"
        >
          <div className="print-only hidden">
            <h1 className="text-2xl font-bold">Quiz AI Performance Report</h1>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
          {renderContent()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

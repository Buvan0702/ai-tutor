'use client';

import { useEffect, useState, useMemo } from 'react';
import { getPerformanceDataAction } from '@/app/actions';
import type { QuizResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Rocket, RefreshCw, Loader2, FileText, Printer, Clock, CheckCircle2, XCircle, Trophy, TrendingDown, Dumbbell, BookOpenCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '../ui/alert';


interface PerformanceDashboardProps {
    onStartNewQuiz: () => void;
    onRetryQuiz: (topic: string, difficulty: string, questionCount: number) => Promise<void>;
    onGenerateLearningPath: (topic: string) => void;
}

export default function PerformanceDashboard({ onStartNewQuiz, onRetryQuiz, onGenerateLearningPath }: PerformanceDashboardProps) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingQuizId, setRetryingQuizId] = useState<string | null>(null);
  const [reviewingResult, setReviewingResult] = useState<QuizResult | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getPerformanceDataAction({ userId: user.uid });
      if (res.success && res.data) {
        setResults(res.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleRetryClick = async (result: QuizResult) => {
    if (!result.id) return;
    setRetryingQuizId(result.id);
    await onRetryQuiz(result.topic, result.difficulty, result.totalQuestions);
    setRetryingQuizId(null);
  };

  const handlePracticeWeakestTopic = async () => {
    if (!weakestTopic) return;
    setRetryingQuizId('practice-weakest');
    await onRetryQuiz(weakestTopic.topic, 'Easy', 5);
    setRetryingQuizId(null);
  };

  const performanceOverTime = useMemo(() => {
    return results.map(r => ({
      date: new Date(r.createdAt).toLocaleDateString(),
      accuracy: (r.score / r.totalQuestions) * 100,
      topic: r.topic,
    }));
  }, [results]);

  const topicPerformance = useMemo(() => {
    const topics: { [key: string]: { totalScore: number; totalAttempts: number, totalQuestions: number } } = {};
    results.forEach(r => {
      if (!topics[r.topic]) {
        topics[r.topic] = { totalScore: 0, totalAttempts: 0, totalQuestions: 0 };
      }
      topics[r.topic].totalScore += r.score;
      topics[r.topic].totalAttempts += 1;
      topics[r.topic].totalQuestions += r.totalQuestions;
    });

    return Object.entries(topics).map(([topic, data]) => ({
      topic,
      accuracy: (data.totalScore / data.totalQuestions) * 100,
    })).sort((a,b) => b.accuracy - a.accuracy);
  }, [results]);
  
  const overallAccuracy = useMemo(() => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
    return totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
  }, [results]);
  
  const sortedResults = useMemo(() => results.slice().reverse(), [results]);

  const weakestTopic = useMemo(() => {
    if (topicPerformance.length < 1) return null;
    const sortedByAccuracy = [...topicPerformance].sort((a, b) => a.accuracy - b.accuracy);
    if (sortedByAccuracy[0].accuracy < 100) {
      return sortedByAccuracy[0];
    }
    return null;
  }, [topicPerformance]);

  const avgTimePerQuestion = useMemo(() => {
      const resultsWithTime = results.filter(r => typeof r.timeTaken === 'number');
      if (resultsWithTime.length === 0) return 0;
      const totalTime = resultsWithTime.reduce((sum, r) => sum + r.timeTaken!, 0);
      const totalQuestions = resultsWithTime.reduce((sum, r) => sum + r.totalQuestions, 0);
      if (totalQuestions === 0) return 0;
      const avg = totalTime / totalQuestions;
      return avg;
  }, [results]);

  if (loading) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-80 md:col-span-2" />
            <Skeleton className="h-80 md:col-span-2" />
            <Skeleton className="h-60 w-full md:col-span-3" />
        </div>
    )
  }

  if (results.length === 0) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-headline mb-2">No quiz history yet!</h2>
            <p className="text-muted-foreground mb-4">Take your first quiz to see your performance stats here.</p>
            <Button onClick={onStartNewQuiz} className="no-print"><Rocket className="mr-2"/> Start a Quiz</Button>
        </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
       <div className="flex justify-between items-center no-print">
            <h2 className="text-2xl font-headline">Dashboard Overview</h2>
            <Button onClick={() => window.print()}>
                <Printer className="mr-2" /> Download Report
            </Button>
        </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 card-print">
          <Card>
            <CardHeader className='flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Overall Accuracy</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{overallAccuracy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Across all {results.length} quizzes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Best Topic</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold truncate">{topicPerformance[0]?.topic ?? 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                {topicPerformance[0] ? `${topicPerformance[0].accuracy.toFixed(1)}% accuracy` : ` `}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Weakest Topic</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xl font-bold truncate">{weakestTopic?.topic ?? 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                            {weakestTopic ? `${weakestTopic.accuracy.toFixed(1)}% accuracy` : `Great work!`}
                        </p>
                    </div>
                    {weakestTopic && (
                         <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePracticeWeakestTopic}
                            disabled={retryingQuizId === 'practice-weakest'}
                        >
                            {retryingQuizId === 'practice-weakest' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Dumbbell className="mr-2 h-4 w-4" />
                            )}
                            Practice
                        </Button>
                    )}
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>Avg. Time / Q</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold truncate">{avgTimePerQuestion > 0 ? `${avgTimePerQuestion.toFixed(1)}s` : 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                {avgTimePerQuestion > 0 ? 'Average time per question' : 'No time data yet'}
              </p>
            </CardContent>
          </Card>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className='card-print'>
            <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Your quiz accuracy over your last attempts.</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                <LineChart data={performanceOverTime}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis unit="%" domain={[0,100]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
        
        <Card className='card-print'>
            <CardHeader>
            <CardTitle>Topic Performance</CardTitle>
            <CardDescription>Your average accuracy for each topic.</CardDescription>
            </CardHeader>
            <CardContent>
            <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                <BarChart data={topicPerformance} layout="vertical" margin={{left: 20}}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" unit="%" domain={[0,100]}/>
                    <YAxis type="category" dataKey="topic" width={100} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="accuracy" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
            </CardContent>
        </Card>
      </div>

       {weakestTopic && (
        <Card className="card-print animate-in fade-in-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenCheck /> Recommendation
            </CardTitle>
            <CardDescription>
              You're finding "{weakestTopic.topic}" challenging. Generate a step-by-step learning path to master it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onGenerateLearningPath(weakestTopic!.topic)}>
              Create Learning Path for "{weakestTopic.topic}"
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className='card-print'>
        <CardHeader>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>A log of your most recent quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right no-print">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedResults.map((result) => (
                        <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.topic}</TableCell>
                            <TableCell>{result.difficulty}</TableCell>
                            <TableCell>{result.score} / {result.totalQuestions}</TableCell>
                            <TableCell>{result.timeTaken ? `${result.timeTaken}s` : 'N/A'}</TableCell>
                            <TableCell>{format(new Date(result.createdAt), "PP")}</TableCell>
                            <TableCell className="text-right no-print">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReviewingResult(result)}
                                    disabled={!result.userAnswers}
                                >
                                    <FileText className="h-4 w-4 mr-2" /> View
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRetryClick(result)}
                                    disabled={retryingQuizId === result.id}
                                    aria-label="Retry quiz"
                                    className='ml-2'
                                >
                                    {retryingQuizId === result.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      {reviewingResult && (
        <Dialog open={!!reviewingResult} onOpenChange={(isOpen) => !isOpen && setReviewingResult(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Reviewing Quiz: "{reviewingResult.topic}"</DialogTitle>
                    <CardDescription>
                        Taken on {format(new Date(reviewingResult.createdAt), "PPP")} - Score: {reviewingResult.score}/{reviewingResult.totalQuestions}
                        {reviewingResult.timeTaken && ` - Time: ${Math.floor(reviewingResult.timeTaken / 60)}m ${reviewingResult.timeTaken % 60}s`}
                    </CardDescription>
                </DialogHeader>
                <ScrollArea className='h-[60vh]'>
                    <div className='p-6 space-y-6'>
                    {reviewingResult.userAnswers?.map((answer, index) => (
                        <div key={index}>
                            <p className='font-semibold'>{index + 1}. {answer.question}</p>
                            <div className='mt-2 space-y-2'>
                                <div className={cn('p-2 rounded-md border text-sm', answer.isCorrect ? 'border-success/50 bg-success/10 text-success' : 'border-destructive/50 bg-destructive/10 text-destructive')}>
                                    Your answer: {answer.selectedAnswer}
                                </div>
                                {!answer.isCorrect && (
                                    <Alert variant={answer.isCorrect ? 'default' : 'destructive'}>
                                        {answer.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        <AlertDescription>
                                            <span className='font-semibold'>Correct answer:</span> {answer.correctAnswer}
                                            <Separator className='my-2' />
                                            {answer.explanation}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    

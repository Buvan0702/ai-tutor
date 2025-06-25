'use client';

import { useEffect, useState, useMemo } from 'react';
import { getPerformanceDataAction } from '@/app/actions';
import type { QuizResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Rocket, RefreshCw, Loader2 } from 'lucide-react';
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


interface PerformanceDashboardProps {
    onStartNewQuiz: () => void;
    onRetryQuiz: (topic: string, difficulty: string, questionCount: number) => Promise<void>;
}

export default function PerformanceDashboard({ onStartNewQuiz, onRetryQuiz }: PerformanceDashboardProps) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingQuizId, setRetryingQuizId] = useState<string | null>(null);
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
    return (totalScore / totalQuestions) * 100;
  }, [results]);
  
  const sortedResults = useMemo(() => results.slice().reverse(), [results]);

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
            <Button onClick={onStartNewQuiz}><Rocket className="mr-2"/> Start a Quiz</Button>
        </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
       <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Overall Accuracy</CardTitle>
              <CardDescription>Across all quizzes taken.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{overallAccuracy.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quizzes Taken</CardTitle>
              <CardDescription>Total number of quizzes completed.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{results.length}</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Best Topic</CardTitle>
              <CardDescription>Your highest performing category.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold truncate">{topicPerformance[0]?.topic ?? 'N/A'}</p>
            </CardContent>
          </Card>
       </div>

      <Card>
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
                <YAxis unit="%" />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Topic Performance</CardTitle>
          <CardDescription>Your average accuracy for each topic.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={topicPerformance} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="topic" width={120} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="accuracy" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
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
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedResults.map((result) => (
                        <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.topic}</TableCell>
                            <TableCell>{result.difficulty}</TableCell>
                            <TableCell>{result.score} / {result.totalQuestions}</TableCell>
                            <TableCell>{format(new Date(result.createdAt), "PP")}</TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleRetryClick(result)}
                                    disabled={retryingQuizId === result.id}
                                    aria-label="Retry quiz"
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
    </div>
  );
}

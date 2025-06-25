'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateLearningPathAction } from '@/app/actions';
import { BookText, Loader2, Wand2, PlayCircle } from 'lucide-react';
import type { LearningPath } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

const formSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters long.'),
});

type FormValues = z.infer<typeof formSchema>;

interface LearningPathsProps {
  onStartQuiz: (topic: string) => void;
}

export default function LearningPaths({ onStartQuiz }: LearningPathsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setLearningPath(null);
    const result = await generateLearningPathAction({ topic: data.topic });
    setIsLoading(false);

    if (result.success && result.path) {
      if (result.path.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Path Generated',
          description: 'The AI could not generate a learning path for this topic. Please try a different one.',
        });
        return;
      }
      toast({
        title: 'Learning Path Ready!',
        description: `Your learning path for "${data.topic}" has been generated.`,
      });
      setLearningPath(result.path);
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Generate a Learning Path</CardTitle>
          <CardDescription className="text-center">
            Enter a broad programming topic to create a structured, step-by-step learning plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'JavaScript', 'Data Structures', 'Machine Learning'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                {isLoading ? 'Generating...' : 'Generate Path'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <div className="w-full max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
      )}

      {learningPath && (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-headline text-center">Your Path to Mastering "{form.getValues('topic')}"</h2>
            {learningPath.map((step, index) => (
                <Card key={index} className="overflow-hidden animate-in fade-in-50">
                    <div className="p-6 flex justify-between items-center gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary p-3 rounded-full flex-shrink-0">
                                <span className="font-bold text-lg">{index + 1}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{step.topic}</h3>
                                <p className="text-muted-foreground text-sm">{step.description}</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => onStartQuiz(step.topic)}>
                            <PlayCircle className="mr-2" />
                            Start Quiz
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}

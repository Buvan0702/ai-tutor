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
import { generateQuizAction } from '@/app/actions';
import { Sparkles, Loader2 } from 'lucide-react';
import type { QuizQuestion } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters long.'),
  questionCount: z.string(),
  difficulty: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface QuizCreatorProps {
  onQuizCreated: (questions: QuizQuestion[], topic: string, difficulty: string) => void;
}

export default function QuizCreator({ onQuizCreated }: QuizCreatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      questionCount: '5',
      difficulty: 'Medium'
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    const result = await generateQuizAction({
        topic: data.topic,
        questionCount: parseInt(data.questionCount, 10),
        difficulty: data.difficulty,
    });
    setIsLoading(false);

    if (result.success && result.questions) {
      if(result.questions.length === 0){
        toast({
          variant: 'destructive',
          title: 'No Questions Generated',
          description: 'The AI could not generate questions for this topic. Please try a different one.',
        });
        return;
      }
      toast({
        title: 'Quiz Ready!',
        description: `Your quiz on "${data.topic}" has been generated.`,
      });
      onQuizCreated(result.questions, data.topic, data.difficulty);
    } else {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }
  };

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Create a New Quiz</CardTitle>
          <CardDescription className="text-center">
            Enter any programming topic and our AI will generate a quiz for you.
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
                      <Input placeholder="e.g., 'React Hooks', 'Python decorators', 'CSS Flexbox'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Questions</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Number of questions" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="3">3 Questions</SelectItem>
                            <SelectItem value="5">5 Questions</SelectItem>
                            <SelectItem value="10">10 Questions</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Sparkles className="mr-2" />
                )}
                {isLoading ? 'Generating...' : 'Generate Quiz'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

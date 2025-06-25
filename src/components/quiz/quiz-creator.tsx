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

const formSchema = z.object({
  topic: z.string().min(2, 'Topic must be at least 2 characters long.'),
});

type FormValues = z.infer<typeof formSchema>;

interface QuizCreatorProps {
  onQuizCreated: (questions: QuizQuestion[], topic: string) => void;
}

export default function QuizCreator({ onQuizCreated }: QuizCreatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    const result = await generateQuizAction(data.topic);
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
      onQuizCreated(result.questions, data.topic);
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

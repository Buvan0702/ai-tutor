'use client';

import { useState } from 'react';
import type { QuizQuestion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Award, RotateCw, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveQuizResultAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QuizSessionProps {
  questions: QuizQuestion[];
  topic: string;
  onFinish: () => void;
}

export default function QuizSession({ questions, topic, onFinish }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100;

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer) return;

    const correct = option === currentQuestion.correctAnswer;
    setSelectedAnswer(option);
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setIsFinished(true);
      await saveQuizResultAction({ topic, score, totalQuestions: questions.length });
      toast({
        title: 'Quiz Complete!',
        description: `You scored ${score} out of ${questions.length}. Your result is saved.`,
      });
    }
  };

  if (isFinished) {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center shadow-lg animate-in fade-in-50">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Award className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Quiz Complete!</CardTitle>
          <CardDescription>You finished the quiz on "{topic}"</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            {score} / {questions.length}
          </p>
          <p className="text-muted-foreground mt-2">That's {((score / questions.length) * 100).toFixed(0)}% correct!</p>
        </CardContent>
        <CardFooter>
          <Button onClick={onFinish} className="w-full">
            <RotateCw className="mr-2" />
            Take Another Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Progress value={progress} className="mb-4" />
      <Card key={currentQuestionIndex} className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{currentQuestion.question}</CardTitle>
          <CardDescription>Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = currentQuestion.correctAnswer === option;
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="lg"
                  className={cn(
                    "justify-start h-auto py-3 text-left whitespace-normal",
                    selectedAnswer && isCorrectAnswer && 'bg-green-100 border-green-500 text-green-900 hover:bg-green-100',
                    selectedAnswer && isSelected && !isCorrect && 'bg-red-100 border-red-500 text-red-900 hover:bg-red-100',
                    !selectedAnswer && 'hover:bg-primary/5 hover:border-primary'
                  )}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!selectedAnswer}
                >
                  <div className="flex-grow">{option}</div>
                  {selectedAnswer && isSelected && isCorrect && <CheckCircle2 className="text-green-500" />}
                  {selectedAnswer && isSelected && !isCorrect && <XCircle className="text-red-500" />}
                  {selectedAnswer && !isSelected && isCorrect && <CheckCircle2 className="text-green-500" />}
                </Button>
              )
            })}
          </div>
          {selectedAnswer && !isCorrect && currentQuestion.explanation && (
            <Alert className="mt-4 animate-in fade-in-50">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Explanation</AlertTitle>
              <AlertDescription>
                {currentQuestion.explanation}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {selectedAnswer && (
            <Button onClick={handleNext} className="w-full animate-in fade-in-50">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

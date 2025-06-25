'use client';

import { useState } from 'react';
import type { QuizQuestion, UserAnswer, AIFeedback } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Award, RotateCw, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveQuizResultAction, generateFeedbackAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

interface QuizSessionProps {
  questions: QuizQuestion[];
  topic: string;
  difficulty: string;
  onFinish: () => void;
}

export default function QuizSession({ questions, topic, difficulty, onFinish }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
    const answer: UserAnswer = {
        question: currentQuestion.question,
        selectedAnswer: option,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: correct,
    };
    setUserAnswers(prev => [...prev, answer]);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setIsFinished(true);
      
      if (user) {
        const result = await saveQuizResultAction({ topic, score, totalQuestions: questions.length, difficulty }, user.uid);
        if(result.success) {
            toast({
                title: 'Quiz Complete!',
                description: `You scored ${score} out of ${questions.length}. Your result is saved.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error saving result',
                description: result.error,
            });
        }
      } else {
        toast({
            title: 'Quiz Complete!',
            description: `You scored ${score} out of ${questions.length}. Sign in to save your results.`,
        });
      }

      setIsFeedbackLoading(true);
      const feedbackResult = await generateFeedbackAction(topic, userAnswers);
      if (feedbackResult.success && feedbackResult.feedback) {
        setFeedback(feedbackResult.feedback);
      }
      setIsFeedbackLoading(false);
    }
  };

  if (isFinished) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg animate-in fade-in-50">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Award className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4 text-center">Quiz Complete!</CardTitle>
          <CardDescription className="text-center">You finished the quiz on "{topic}" ({difficulty})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="text-center">
            <p className="text-4xl font-bold">
              {score} / {questions.length}
            </p>
            <p className="text-muted-foreground mt-2">That's {((score / questions.length) * 100).toFixed(0)}% correct!</p>
          </div>
          <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-xl"><Lightbulb/> AI Feedback</CardTitle>
            </CardHeader>
            <CardContent>
                {isFeedbackLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin"/> Generating your personalized feedback...</div>
                ) : feedback ? (
                    <div className="space-y-4">
                        <p className="text-sm">{feedback.feedback}</p>
                        <div>
                            <h4 className="font-semibold mb-2 text-sm">Next Steps:</h4>
                            <div className="flex flex-wrap gap-2">
                                {feedback.suggestions.map((suggestion, i) => (
                                    <Button key={i} variant="secondary" size="sm" className="bg-secondary/70">{suggestion}</Button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">Could not load feedback.</p>
                )}
            </CardContent>
          </Card>
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
          {selectedAnswer && (isCorrect === false) && currentQuestion.explanation && (
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

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { QuizQuestion, UserAnswer, AIFeedback } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Award, RotateCw, Lightbulb, Loader2, Youtube, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveQuizResultAction, generateFeedbackAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChatTutor } from '../chat-tutor';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface QuizSessionProps {
  questions: QuizQuestion[];
  topic: string;
  difficulty: string;
  onFinish: () => void;
}

function arraysEqual(a1: string[], a2: string[]) {
    if (a1.length !== a2.length) return false;
    const sortedA1 = [...a1].sort();
    const sortedA2 = [...a2].sort();
    for (let i = 0; i < sortedA1.length; i++) {
        if (sortedA1[i] !== sortedA2[i]) return false;
    }
    return true;
}


export default function QuizSession({ questions, topic, difficulty, onFinish }: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = useMemo(() => {
    return ((currentQuestionIndex + (answerChecked ? 1 : 0)) / questions.length) * 100;
  }, [currentQuestionIndex, answerChecked, questions.length]);

  const handleSelectionChange = (option: string, checked: boolean) => {
    if (answerChecked) return;

    if (currentQuestion.questionType !== 'multiple-answer') {
        setSelectedAnswers([option]);
    } else {
        setSelectedAnswers(prev => 
            checked ? [...prev, option] : prev.filter(o => o !== option)
        );
    }
  };

  const handleCheckAnswer = () => {
    if (answerChecked || selectedAnswers.length === 0) return;

    const correct = arraysEqual(selectedAnswers, currentQuestion.correctAnswers);
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
    }
    const answer: UserAnswer = {
        question: currentQuestion.question,
        selectedAnswers: selectedAnswers,
        correctAnswers: currentQuestion.correctAnswers,
        isCorrect: correct,
        explanation: currentQuestion.explanation,
    };
    setUserAnswers(prev => [...prev, answer]);
    setAnswerChecked(true);
  };


  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setIsCorrect(null);
      setRevealedHints([]);
      setAnswerChecked(false);
    } else {
      setIsFinished(true);
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      
      if (user) {
        const result = await saveQuizResultAction({ 
            topic, 
            score, 
            totalQuestions: questions.length, 
            difficulty,
            timeTaken,
            userAnswers 
        }, user.uid);
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

  const handleRevealHint = () => {
    if (currentQuestion.hints && revealedHints.length < currentQuestion.hints.length) {
      setRevealedHints(prev => [...prev, currentQuestion.hints[prev.length]]);
    }
  };

  if (isFinished) {
    return (
      <>
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
                          {feedback.youtubeSearchQueries?.length > 0 && (
                              <div>
                                  <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><Youtube /> Helpful Videos:</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {feedback.youtubeSearchQueries.map((query, i) => (
                                          <Button asChild key={i} variant="secondary" size="sm" className="bg-secondary/70">
                                              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">
                                                  {query}
                                              </a>
                                          </Button>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <p className="text-muted-foreground text-sm">Could not load feedback.</p>
                  )}
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button onClick={() => setIsChatOpen(true)} variant="outline">
                <MessageSquare className="mr-2" />
                Ask AI Tutor
            </Button>
            <Button onClick={onFinish}>
                <RotateCw className="mr-2" />
                Take Another Quiz
            </Button>
          </CardFooter>
        </Card>
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DialogContent className="max-w-3xl h-[80vh] p-0 gap-0">
                <ChatTutor topic={topic} />
            </DialogContent>
        </Dialog>
      </>
    );
  }

  const renderOptions = () => {
    const isMultiSelect = currentQuestion.questionType === 'multiple-answer';

    const optionsContent = currentQuestion.options.map((option, index) => {
      const isSelected = selectedAnswers.includes(option);
      const isCorrect = currentQuestion.correctAnswers.includes(option);
      const optionId = `option-${index}`;
      
      return (
        <div
          key={index}
          className={cn(
            'flex items-center space-x-3 rounded-md border p-3 transition-colors text-left',
            answerChecked && isCorrect && 'border-success/80 bg-success/10 text-success-foreground',
            answerChecked && isSelected && !isCorrect && 'border-destructive/80 bg-destructive/10 text-destructive-foreground',
            !answerChecked && 'cursor-pointer hover:bg-accent/50',
            !answerChecked && isSelected && 'border-primary bg-primary/10'
          )}
          onClick={() => handleSelectionChange(option, !isSelected)}
        >
          {isMultiSelect ? (
            <Checkbox id={optionId} checked={isSelected} disabled={answerChecked} />
          ) : (
            <RadioGroupItem value={option} id={optionId} checked={isSelected} disabled={answerChecked} />
          )}
          <label htmlFor={optionId} className={cn('flex-1', !answerChecked && 'cursor-pointer')}>{option}</label>
          {answerChecked && isCorrect && <CheckCircle2 className="text-success" />}
          {answerChecked && isSelected && !isCorrect && <XCircle className="text-destructive" />}
        </div>
      );
    });

    if (isMultiSelect) {
        return <div className="grid grid-cols-1 gap-3">{optionsContent}</div>;
    }

    return (
        <RadioGroup
            value={selectedAnswers[0] || ''}
            onValueChange={(value) => handleSelectionChange(value, true)}
            disabled={answerChecked}
            className="grid grid-cols-1 gap-3"
        >
            {optionsContent}
        </RadioGroup>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Progress value={progress} className="mb-4" />
      <Card key={currentQuestionIndex} className="shadow-lg animate-in fade-in-50 slide-in-from-bottom-5">
        <CardHeader>
          {currentQuestion.questionType === 'code-snippet' ? (
              <>
                <div className="bg-muted p-4 rounded-md font-code text-sm overflow-x-auto">
                    <pre><code>{currentQuestion.question}</code></pre>
                </div>
                <CardTitle className="font-headline text-xl pt-4">Based on the code above, select the correct option:</CardTitle>
              </>
          ) : (
             <CardTitle className="font-headline text-2xl">{currentQuestion.question}</CardTitle>
          )}
          <CardDescription>Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderOptions()}
          
          {(answerChecked && !isCorrect && currentQuestion.explanation) && (
            <Alert className="mt-4 animate-in fade-in-50" variant="destructive">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Explanation</AlertTitle>
              <AlertDescription>
                {currentQuestion.explanation}
              </AlertDescription>
            </Alert>
          )}

          {!answerChecked && currentQuestion.hints?.length > 0 && (
             <Alert className="mt-4 animate-in fade-in-50" variant="default">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Hints</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    {revealedHints.map((hint, index) => (
                      <p key={index} className="text-sm animate-in fade-in-20">{index+1}. {hint}</p>
                    ))}
                    {revealedHints.length < currentQuestion.hints.length && (
                      <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleRevealHint}>
                        Reveal next hint...
                      </Button>
                    )}
                  </div>
                </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          {answerChecked ? (
            <Button onClick={handleNext} className="w-full animate-in fade-in-50">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          ) : (
            <Button onClick={handleCheckAnswer} disabled={selectedAnswers.length === 0} className="w-full">
                Check Answer
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

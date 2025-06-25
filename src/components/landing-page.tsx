'use client';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/auth-button';
import AnimatedBackground from '@/components/animated-background';
import { BrainCircuit, Zap } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const LandingPage = () => {
  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center backdrop-blur-sm bg-background/30">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">Quiz AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-1 container mx-auto text-center px-4">
          <h2 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter mb-4">
            The Smartest Way to Learn
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Instantly generate quizzes on any programming topic. Challenge yourself, track your progress, and master new skills with the power of AI.
          </p>
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;

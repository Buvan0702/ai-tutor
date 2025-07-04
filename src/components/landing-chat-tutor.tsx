'use client';

import { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { suggestTopicAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

type SuggestionMessage = ChatMessage & {
    suggestedTopics?: string[];
};

interface LandingChatTutorProps {
    onTopicSelect?: (topic: string) => void;
}

export default function LandingChatTutor({ onTopicSelect }: LandingChatTutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SuggestionMessage[]>([
    {
      role: 'model',
      content: "Hello! I'm here to help. What programming topic are you interested in learning today?",
      suggestedTopics: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleTopicClick = (topic: string) => {
    setIsOpen(false);
    if (user && onTopicSelect) {
        onTopicSelect(topic);
    } else {
        sessionStorage.setItem('pendingQuizTopic', topic);
        toast({
            title: 'Quiz Topic Selected!',
            description: `Please sign in or sign up to start your quiz on "${topic}".`,
        });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const result = await suggestTopicAction({ history: newMessages });
    setIsLoading(false);

    if (result.success && result.response) {
        const newModelMessage: SuggestionMessage = { 
            role: 'model', 
            content: result.response.response,
            suggestedTopics: result.response.suggestedTopics
        };
        setMessages(prev => [...prev, newModelMessage]);
    } else {
        toast({
            variant: 'destructive',
            title: 'Tutor Error',
            description: result.error,
        });
        setMessages(prev => prev.slice(0, -1));
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg z-20 animate-in fade-in-50"
        >
          <Bot className="w-8 h-8" />
          <span className="sr-only">Open AI Tutor</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-[90vw] max-w-md h-[70vh] max-h-[500px] p-0 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                <Bot className="text-primary"/> AI Quiz Finder
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
            </Button>
        </div>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                <div className={cn('flex items-start gap-3', { 'justify-end': message.role === 'user' })}>
                  {message.role === 'model' && (
                     <div className="p-2 bg-primary rounded-full text-primary-foreground"><Bot className="h-4 w-4"/></div>
                  )}
                  <div
                    className={cn(
                      'max-w-xs rounded-lg p-3 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
                {message.suggestedTopics && message.suggestedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-12">
                        {message.suggestedTopics.map((topic, i) => (
                            <Button key={i} size="sm" variant="secondary" onClick={() => handleTopicClick(topic)}>
                                Take quiz on "{topic}"
                            </Button>
                        ))}
                    </div>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary rounded-full text-primary-foreground"><Bot className="h-4 w-4"/></div>
                <div className="bg-muted rounded-lg p-3 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a topic..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

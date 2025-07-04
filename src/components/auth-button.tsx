'use client';

import { useState } from 'react';
import { signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User as UserIcon, LogIn, Mail, Lock } from 'lucide-react';

const AuthForm = ({ isSignUp, onForgotPassword }: { isSignUp?: boolean, onForgotPassword?: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleAuthError = (error: any) => {
    console.error("Authentication Error:", error);

    // Log project details for debugging domain authorization issues
    if (error.code === 'auth/unauthorized-domain') {
        console.log('%cVerifying Firebase project connection for auth:', 'font-weight: bold; color: orange;');
        console.log('Project ID in use by app:', auth.app.options.projectId);
        console.log('Auth Domain in use by app:', auth.app.options.authDomain);
        console.log('%cPlease ensure this domain is added to your Firebase authorized domains list.', 'color: orange;');
    }

    let description = 'An unexpected error occurred. Please try again.';
    if (error.code === 'auth/operation-not-allowed') {
      description = 'This sign-in method is not enabled. Please enable it in your Firebase console under Authentication > Sign-in method.';
    } else if (error.code === 'auth/unauthorized-domain') {
      description = 'This domain is not authorized for sign-in. Check your Firebase console and the browser console for more details.';
    } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      description = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/email-already-in-use') {
      description = 'An account with this email address already exists.';
    }
    toast({ variant: 'destructive', title: isSignUp ? 'Sign-up failed' : 'Sign-in failed', description });
  };
  
  const checkFirebaseConfig = () => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Firebase credentials are not configured. Please add them to your .env file to enable authentication.',
      });
      return false;
    }
    return true;
  }

  const handleGoogleSignIn = async () => {
    if (!checkFirebaseConfig()) return;
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkFirebaseConfig()) return;

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10"/>
        </div>
        {!isSignUp && onForgotPassword && (
          <div className="flex items-center justify-end -mt-2">
            <Button variant="link" size="sm" type="button" className="p-0 h-auto font-normal" onClick={onForgotPassword}>
              Forgot Password?
            </Button>
          </div>
        )}
        <Button type="submit" className="w-full">{isSignUp ? 'Sign Up' : 'Sign In'}</Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.5l-62.7 62.7C337 97 294.6 80 248 80c-82.8 0-150 67.2-150 150s67.2 150 150 150c94.9 0 131.3-64.4 136.8-98.2H248v-69.8h235.5c1.3 12.8 2.5 25.8 2.5 39.8z"></path></svg>
        Google
      </Button>
    </div>
  );
};

const ResetPasswordForm = ({ onBack }: { onBack: () => void }) => {
    const [email, setEmail] = useState('');
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: 'Password Reset Email Sent',
                description: 'Please check your inbox for a link to reset your password.',
            });
            onBack();
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            let description = 'An unknown error occurred.';
            if (error.code === 'auth/user-not-found') {
                description = 'No user found with this email address.';
            }
            toast({
                variant: 'destructive',
                title: 'Request Failed',
                description: description,
            });
        }
    };
    
    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="reset-email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10"
                    />
                </div>
                <Button type="submit" className="w-full">
                    Send Reset Link
                </Button>
            </form>
            <Button variant="outline" className="w-full" onClick={onBack}>
                Back to Sign In
            </Button>
        </div>
    );
};


export const AuthButton = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  type AuthView = 'signin' | 'signup' | 'reset';
  const [view, setView] = useState<AuthView>('signin');
  
  const handleSignOut = () => {
    signOut(auth);
  };
  
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
        // Reset to sign-in view after the close animation completes
        setTimeout(() => setView('signin'), 300);
    }
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
            {view === 'reset' ? (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-headline">Reset Password</DialogTitle>
                        <DialogDescription className="text-center">
                            Enter your email to receive a reset link.
                        </DialogDescription>
                    </DialogHeader>
                    <ResetPasswordForm onBack={() => setView('signin')} />
                </>
            ) : (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-headline">Welcome to Quiz AI</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue={view} value={view} onValueChange={(v) => setView(v as AuthView)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>
                        <TabsContent value="signin">
                            <AuthForm onForgotPassword={() => setView('reset')} />
                        </TabsContent>
                        <TabsContent value="signup">
                            <AuthForm isSignUp />
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
};

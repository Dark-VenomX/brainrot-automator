'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Video, Zap, Calendar, Youtube, Instagram } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { signIn, signUp, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const { error } = await signUp(email, password);
    if (error) setError(error.message);
    else setError('Check your email to confirm your account');
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user) {
    window.location.href = '/workspace';
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity w-fit cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 shadow-md flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">brainrot.ai</span>
          </Link>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Automate Your Short-Form Video Creation
          </h1>
          <p className="text-lg text-blue-100">
            AI-powered script writing, voice synthesis, and multi-platform scheduling.
            Create viral content at scale with zero production costs.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="font-semibold text-white">AI Script Generation</h3>
                <p className="text-sm text-blue-100">Free Gemini-powered script writing</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur">
              <Calendar className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="font-semibold text-white">Smart Scheduling</h3>
                <p className="text-sm text-blue-100">Auto-post at optimal times</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur">
              <div className="flex -space-x-2">
                <Youtube className="w-8 h-8 text-red-500" />
                <Instagram className="w-8 h-8 text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Multi-Account Matrix</h3>
                <p className="text-sm text-blue-100">Post to all your channels</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-blue-200">
          Powered by Google Gemini, Edge TTS, and FFmpeg
        </p>
      </div>

      {/* Right Side - Auth */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Video className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold">Brainrot Studio</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card className="border-0 shadow-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to access your video workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-0 shadow-xl">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Create an account</CardTitle>
                  <CardDescription>
                    Start creating viral content today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {error && (
                      <Alert>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

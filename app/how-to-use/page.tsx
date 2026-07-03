'use client';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import {
  Video,
  Link as LinkIcon,
  MessageSquare,
  Youtube,
  Instagram,
  Calendar,
  Settings,
  Zap,
  Upload,
  Sparkles,
  Volume2,
  FileVideo,
  Send,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function HowToUsePage() {
  return (
    <div className="min-h-screen text-white pb-24">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#06040A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/workspace" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-md">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">brainrot.ai</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-0" variant="secondary">Getting Started</Badge>
          <h1 className="text-4xl font-bold mb-4 text-white">How to Use brainrot.ai</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A complete guide to automating your short-form video creation and multi-platform posting
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Start (5 Steps)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Sign up for an account', desc: 'Create your free Brainrot Studio account' },
                { step: 2, title: 'Link your social media accounts', desc: 'Connect YouTube channels and Instagram accounts' },
                { step: 3, title: 'Add a video source URL', desc: 'Paste any YouTube video link' },
                { step: 4, title: 'Enter your topic or script', desc: 'Let AI generate a script or write your own' },
                { step: 5, title: 'Select target accounts and create', desc: 'Choose where to post and hit create' },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                    <span className="font-bold text-blue-600">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  {idx < 4 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Detailed Guide */}
        <div className="space-y-8">
          {/* Step 1: Account Setup */}
        <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Step 1: Setting Up Your Accounts</CardTitle>
                  <CardDescription>Connect your YouTube and Instagram accounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Youtube className="w-6 h-6 text-red-500" />
                    <h4 className="font-semibold">YouTube Channel</h4>
                  </div>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Click Settings icon in the header</li>
                    <li>Click "Link YouTube Channel"</li>
                    <li>Sign in to your Google account</li>
                    <li>Grant necessary permissions</li>
                    <li>You will be redirected back automatically</li>
                  </ol>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <Instagram className="w-6 h-6 text-pink-500" />
                    <h4 className="font-semibold">Instagram Account</h4>
                  </div>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Click Settings icon in the header</li>
                    <li>Click "Link Instagram Account"</li>
                    <li>Authorize with Instagram</li>
                    <li>Grant content publishing permissions</li>
                    <li>Your account will appear in the matrix</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>Multi-Account Matrix:</strong> You can link multiple channels of the same type.
                  This allows you to post the same video to different channels simultaneously.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Creating Videos */}
        <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <FileVideo className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Step 2: Creating a Video</CardTitle>
                  <CardDescription>Configure your video source and content</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold">Video Source URL</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter any YouTube video URL from which you want to source footage.
                    The system will download and process the specified segment.
                  </p>
                  <div className="bg-muted p-3 rounded font-mono text-sm">
                    https://www.youtube.com/watch?v=EXAMPLE_VIDEO_ID
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Timestamp Selection</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose the segment of the video to use. Most short-form content works best at 45 seconds or less.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-3 rounded">
                      <span className="text-xs text-muted-foreground">Start Time</span>
                      <div className="font-mono font-semibold">00:00</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <span className="text-xs text-muted-foreground">End Time</span>
                      <div className="font-mono font-semibold">00:45</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold">AI Script Generation</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter a topic and let Gemini AI write a high-retention script for you.
                    The script is optimized for engagement and designed for 45-second videos.
                  </p>
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded">
                      <span className="text-xs text-muted-foreground">Topic Example</span>
                      <div className="font-semibold">"Mind-blowing space facts"</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <span className="text-xs text-muted-foreground">Generated Script (Preview)</span>
                      <p className="text-sm italic">
                        "Space is absolutely insane. Did you know that there's a planet where it rains glass sideways?..."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <Volume2 className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-semibold">Voice Selection</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose from multiple AI voices powered by Microsoft Edge TTS (completely free).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Aria (US Female)</Badge>
                    <Badge variant="secondary">Guy (US Male)</Badge>
                    <Badge variant="secondary">Sonia (UK Female)</Badge>
                    <Badge variant="secondary">Natasha (AU Female)</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Target Accounts */}
        <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Step 3: Selecting Target Accounts</CardTitle>
                  <CardDescription>Choose where to publish your video</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                In the "Target Accounts" panel, select which of your linked accounts should receive the video.
                You can select multiple accounts to post to several channels simultaneously.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Selected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Videos will be scheduled for this channel after approval.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-muted-foreground">Not Selected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click to toggle selection for this account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Processing Pipeline */}
        <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Step 4: The Processing Pipeline</CardTitle>
                  <CardDescription>What happens after you create a video</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />
                  <div className="space-y-4">
                    {[
                      {
                        icon: <LinkIcon className="w-4 h-4" />,
                        title: 'Download',
                        desc: 'yt-dlp downloads your source video segment',
                        color: 'bg-blue-500',
                      },
                      {
                        icon: <Sparkles className="w-4 h-4" />,
                        title: 'AI Script',
                        desc: 'Gemini generates or refines your script',
                        color: 'bg-purple-500',
                      },
                      {
                        icon: <Volume2 className="w-4 h-4" />,
                        title: 'TTS Generation',
                        desc: 'Edge TTS creates the voiceover audio',
                        color: 'bg-indigo-500',
                      },
                      {
                        icon: <MessageSquare className="w-4 h-4" />,
                        title: 'Subtitle Creation',
                        desc: 'Whisper extracts word timestamps, creates ASS subtitles',
                        color: 'bg-cyan-500',
                      },
                      {
                        icon: <Video className="w-4 h-4" />,
                        title: 'Video Rendering',
                        desc: 'FFmpeg mixes audio, burns subtitles, applies smart crop',
                        color: 'bg-orange-500',
                      },
                      {
                        icon: <CheckCircle className="w-4 h-4" />,
                        title: 'Ready',
                        desc: 'Video is ready for review and scheduling',
                        color: 'bg-green-500',
                      },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-4 ml-8">
                        <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-white -ml-12`}>
                          {step.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Scheduling */}
        <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <CardTitle>Step 5: Scheduling & Posting</CardTitle>
                  <CardDescription>Automated posting at optimal times</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Once your video is ready, you can approve it for posting. The system schedules videos for
                two optimal times each day (12:30 PM and 7:30 PM IST by default).
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Morning Slot</h4>
                  <p className="text-2xl font-bold text-blue-600">12:30 PM IST</p>
                  <p className="text-sm text-muted-foreground">Perfect for lunch-break viewers</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Evening Slot</h4>
                  <p className="text-2xl font-bold text-orange-600">7:30 PM IST</p>
                  <p className="text-sm text-muted-foreground">Peak engagement time</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm">
                  <strong>Auto-Schedule:</strong> Enable the auto-schedule toggle when creating a video to
                  automatically schedule it for the next available slot once processing completes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Features Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Feature Overview</CardTitle>
            <CardDescription>Zero-cost AI tools powering the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-semibold">Gemini 2.5 Flash</h4>
                <p className="text-xs text-muted-foreground">Free tier: 15 RPM</p>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <Volume2 className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                <h4 className="font-semibold">Edge TTS</h4>
                <p className="text-xs text-muted-foreground">Microsoft Free TTS</p>
              </div>
              <div className="p-4 rounded-lg border text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-cyan-600" />
                <h4 className="font-semibold">Whisper.cpp</h4>
                <p className="text-xs text-muted-foreground">Local STT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to workspace */}
        <div className="text-center mt-12">
          <Link href="/workspace">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
              Start Creating Now
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

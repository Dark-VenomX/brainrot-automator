'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { apiClient, type VideoQueueItem, type SocialAccount } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Video,
  Link as LinkIcon,
  Clock,
  MessageSquare,
  Youtube,
  Instagram,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Send,
  Plus,
  Settings,
  Calendar,
  Sparkles,
  ChevronRight,
  Zap,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { SelfSufficiencyTracker } from '../../components/self-sufficiency-tracker';
import { SchedulePlanner } from '../../components/schedule-planner';
import { SandboxPanel } from '../../components/sandbox-panel';

type VideoStatus =
  | 'pending'
  | 'downloading'
  | 'processing'
  | 'generating_script'
  | 'creating_tts'
  | 'rendering'
  | 'ready'
  | 'scheduled'
  | 'posted'
  | 'failed';

const statusConfig: Record<VideoStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-gray-500', icon: <Clock className="w-3 h-3" /> },
  downloading: { label: 'Downloading', color: 'bg-blue-500', icon: <div className="w-3 h-3 flex items-center justify-center"><div className="loader scale-[0.15]"></div></div> },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: <div className="w-3 h-3 flex items-center justify-center"><div className="loader scale-[0.15]"></div></div> },
  generating_script: { label: 'Writing Script', color: 'bg-purple-500', icon: <Sparkles className="w-3 h-3" /> },
  creating_tts: { label: 'Creating Voice', color: 'bg-indigo-500', icon: <div className="w-3 h-3 flex items-center justify-center"><div className="loader scale-[0.15]"></div></div> },
  rendering: { label: 'Rendering', color: 'bg-orange-500', icon: <Video className="w-3 h-3" /> },
  ready: { label: 'Ready', color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
  scheduled: { label: 'Scheduled', color: 'bg-cyan-500', icon: <Calendar className="w-3 h-3" /> },
  posted: { label: 'Posted', color: 'bg-emerald-500', icon: <Send className="w-3 h-3" /> },
  failed: { label: 'Failed', color: 'bg-red-500', icon: <XCircle className="w-3 h-3" /> },
};

export default function WorkspacePage() {
  const { user, signOut, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [videos, setVideos] = useState<VideoQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [trackerRefreshKey, setTrackerRefreshKey] = useState(0);

  // Form state
  const [sourceUrl, setSourceUrl] = useState('');
  const [startTimestamp, setStartTimestamp] = useState('00:00');
  const [endTimestamp, setEndTimestamp] = useState('00:45');
  const [topicInput, setTopicInput] = useState('');
  const [scriptInput, setScriptInput] = useState('');
  const [voiceName, setVoiceName] = useState('en-US-AriaNeural');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [autoSchedule, setAutoSchedule] = useState(false);
  
  // New features state
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [niche, setNiche] = useState('Reddit AITA Stories');
  const [customNiche, setCustomNiche] = useState('');
  const [bgMusic, setBgMusic] = useState('none');
  const [fontStyle, setFontStyle] = useState('classic');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, videosRes] = await Promise.all([
        apiClient.getAccounts(),
        apiClient.getVideos(),
      ]);
      setAccounts(accountsRes.accounts);
      setVideos(videosRes.videos);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (session?.access_token) {
        apiClient.setAccessToken(session.access_token);
        loadData();
      } else {
        router.push('/login');
      }
    }
  }, [session, authLoading, router, loadData]);

  // Poll for updates on processing videos
  useEffect(() => {
    const processingVideos = videos.filter(v =>
      ['pending', 'downloading', 'processing', 'generating_script', 'creating_tts', 'rendering'].includes(v.status)
    );

    if (processingVideos.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.getVideos();
        setVideos(res.videos);
        setTrackerRefreshKey(k => k + 1);
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [videos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      const res = await apiClient.uploadVideoFile(formData);
      setSourceUrl(res.url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one target account');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createVideo({
        source_url: sourceUrl,
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        topic_input: topicInput || undefined,
        generated_script: scriptInput || undefined,
        voice_name: voiceName,
        target_account_ids: selectedAccounts,
        auto_schedule: autoSchedule,
        aspect_ratio: aspectRatio,
        niche: niche === 'Custom' ? customNiche : niche,
        bg_music: bgMusic,
        font_style: fontStyle,
      });

      toast.success('Video queued for processing');
      setSourceUrl('');
      setTopicInput('');
      setScriptInput('');
      setTrackerRefreshKey(k => k + 1);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (videoId: string) => {
    try {
      await apiClient.approveVideo(videoId);
      toast.success('Video approved and scheduled');
      setTrackerRefreshKey(k => k + 1);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve video');
    }
  };

  const handleReprocess = async (videoId: string) => {
    try {
      await apiClient.reprocessVideo(videoId);
      toast.success('Video queued for reprocessing');
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reprocess');
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      await apiClient.deleteVideo(videoId);
      toast.success('Video deleted');
      setTrackerRefreshKey(k => k + 1);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    }
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const getStatusBadge = (status: VideoStatus) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: 'youtube' | 'instagram') => {
    return platform === 'youtube' ? (
      <Youtube className="w-4 h-4 text-red-500" />
    ) : (
      <Instagram className="w-4 h-4 text-pink-500" />
    );
  };

  const isFormValid = sourceUrl.trim() !== '' && selectedAccounts.length > 0;
  const getDisabledReason = () => {
    if (!sourceUrl.trim()) return "Missing Video URL";
    if (selectedAccounts.length === 0) return "Select at least 1 Account";
    return "";
  }

  if (loading && accounts.length === 0 && videos.length === 0) {
    // Only show loading if we haven't loaded initial data yet, but don't block the whole page.
    // We will render the shell and put the loader inside.
  }

  return (
    <div className="min-h-screen text-white pb-24">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#06040A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 shadow-md flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">brainrot.ai</span>
          </Link>
          <div className="flex items-center gap-2">
            <SchedulePlanner onSaved={() => setTrackerRefreshKey(k => k + 1)} />
            <SandboxPanel />
            <Link href="/how-to-use">
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <BookOpen className="w-4 h-4 mr-2" />
                Docs
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Account Settings</DialogTitle>
                  <DialogDescription>
                    Manage your linked social accounts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Button
                    onClick={async () => {
                      const res = await apiClient.getYouTubeAuthUrl();
                      window.open(res.authUrl, '_blank');
                    }}
                    variant="outline"
                    className="w-full justify-start hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 transition-all"
                  >
                    <Youtube className="w-5 h-5 mr-3 text-red-500" />
                    Link YouTube Channel
                  </Button>
                  <Button
                    onClick={async () => {
                      const res = await apiClient.getInstagramAuthUrl();
                      window.open(res.authUrl, '_blank');
                    }}
                    variant="outline"
                    className="w-full justify-start hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 dark:hover:bg-pink-950/30 transition-all"
                  >
                    <Instagram className="w-5 h-5 mr-3 text-pink-500" />
                    Link Instagram Account
                  </Button>
                  <Separator />
                  <Button
                    onClick={signOut}
                    variant="destructive"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && accounts.length === 0 && videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 flex items-center justify-center mb-2"><div className="loader scale-[0.5]"></div></div>
            <p className="text-gray-400 font-medium animate-pulse">Loading Workspace...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <SelfSufficiencyTracker refreshKey={trackerRefreshKey} />
            </div>

        <Tabs defaultValue="create" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-[400px] mx-auto p-1 bg-white/5 rounded-xl border border-white/10">
            <TabsTrigger value="create" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">Create</TabsTrigger>
            <TabsTrigger value="queue" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">Queue</TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">Accounts</TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="space-y-8 pb-12">
              
              {/* Step 1: Source Material */}
              <div className="relative pl-8">
                <div className="absolute left-0 top-6 bottom-[-2rem] w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                <div className="absolute left-[-11px] top-5 w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold text-xs z-10">1</div>
                
                <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <LinkIcon className="w-5 h-5 text-purple-500" />
                      Source Material
                    </CardTitle>
                    <CardDescription>
                      Where should we get the background gameplay from?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-300">Aspect Ratio</Label>
                      <div className="flex gap-4">
                        <label className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all flex-1 ${aspectRatio === '9:16' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                          <input type="radio" name="aspectRatio" value="9:16" className="hidden" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} />
                          <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
                          <span className="font-medium">Vertical (9:16)</span>
                        </label>
                        <label className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-xl cursor-pointer transition-all flex-1 ${aspectRatio === '16:9' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>
                          <input type="radio" name="aspectRatio" value="16:9" className="hidden" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} />
                          <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
                          <span className="font-medium">Horizontal (16:9)</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source-url" className="font-semibold text-gray-300">Video Source (YouTube URL or Local Upload) <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="source-url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          className="bg-black/40 border-white/10 focus-visible:ring-purple-500 text-white flex-1"
                          disabled={isUploadingFile}
                        />
                        <span className="text-sm text-gray-400">or</span>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="video/mp4" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileUpload}
                            disabled={isUploadingFile}
                          />
                          <Button type="button" variant="secondary" className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 whitespace-nowrap" disabled={isUploadingFile}>
                            {isUploadingFile ? 'Uploading...' : 'Upload .mp4'}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="start-time" className="font-semibold text-gray-300">Start Time</Label>
                        <Input
                          id="start-time"
                          placeholder="00:00"
                          value={startTimestamp}
                          onChange={(e) => setStartTimestamp(e.target.value)}
                          className="bg-black/40 border-white/10 font-mono text-white focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time" className="font-semibold text-gray-300">End Time</Label>
                        <Input
                          id="end-time"
                          placeholder="00:45"
                          value={endTimestamp}
                          onChange={(e) => setEndTimestamp(e.target.value)}
                          className="bg-black/40 border-white/10 font-mono text-white focus-visible:ring-purple-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step 2: AI Brain */}
              <div className="relative pl-8">
                <div className="absolute left-0 top-6 bottom-[-2rem] w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                <div className="absolute left-[-11px] top-5 w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold text-xs z-10">2</div>
                
                <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      AI Brain & Script
                    </CardTitle>
                    <CardDescription>
                      Tell the AI what to talk about, or write your own script.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="topic" className="font-semibold text-gray-300">Topic Idea <span className="text-xs font-normal text-gray-500 ml-2">(Optional - AI will generate a script)</span></Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Amazing space facts, The history of Rome..."
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        className="bg-black/40 border-white/10 text-white focus-visible:ring-purple-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0F0A19] px-2 text-gray-500 font-medium">Or</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="script" className="font-semibold text-gray-300">Custom Script <span className="text-xs font-normal text-gray-500 ml-2">(Overrides topic)</span></Label>
                      <Textarea
                        id="script"
                        placeholder="Write your exact script here..."
                        rows={4}
                        value={scriptInput}
                        onChange={(e) => setScriptInput(e.target.value)}
                        className="bg-black/40 border-white/10 resize-none text-white focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label htmlFor="voice" className="font-semibold text-gray-300">AI Voice Model</Label>
                      <select
                        id="voice"
                        className="w-full px-3 py-2.5 border rounded-lg bg-black/40 border-white/10 text-white focus-visible:ring-purple-500 focus-visible:outline-none text-sm"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                      >
                        <option value="en-US-AriaNeural">Aria (US Female - Cheerful)</option>
                        <option value="en-US-GuyNeural">Guy (US Male - Professional)</option>
                        <option value="en-GB-SoniaNeural">Sonia (UK Female - Clear)</option>
                        <option value="en-AU-NatashaNeural">Natasha (AU Female - Energetic)</option>
                      </select>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-white/10 mt-4">
                      <Label htmlFor="niche" className="font-semibold text-gray-300">Content Niche</Label>
                      <select
                        id="niche"
                        className="w-full px-3 py-2.5 border rounded-lg bg-black/40 border-white/10 text-white focus-visible:ring-purple-500 focus-visible:outline-none text-sm"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                      >
                        <option value="Reddit AITA Stories">Reddit AITA Stories</option>
                        <option value="Shower Thoughts">Shower Thoughts</option>
                        <option value="Dark Psychology">Dark Psychology</option>
                        <option value="Motivation">Motivation & Success</option>
                        <option value="Sigma Grindset">Sigma Grindset</option>
                        <option value="Historical Mysteries">Historical Mysteries</option>
                        <option value="Conspiracy Theories">Conspiracy Theories</option>
                        <option value="True Crime">True Crime</option>
                        <option value="Creepypasta">Creepypasta</option>
                        <option value="Tech Trivia">Tech Trivia</option>
                        <option value="Fun Facts">Fun Facts</option>
                        <option value="Custom">Custom Niche...</option>
                      </select>
                      {niche === 'Custom' && (
                        <Input 
                          placeholder="Type your custom niche..." 
                          value={customNiche} 
                          onChange={(e) => setCustomNiche(e.target.value)}
                          className="mt-2 bg-black/40 border-white/10 text-white"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bg-music" className="font-semibold text-gray-300">Background Music</Label>
                        <select
                          id="bg-music"
                          className="w-full px-3 py-2.5 border rounded-lg bg-black/40 border-white/10 text-white focus-visible:ring-purple-500 focus-visible:outline-none text-sm"
                          value={bgMusic}
                          onChange={(e) => setBgMusic(e.target.value)}
                        >
                          <option value="none">None</option>
                          <option value="lofi">Chill Lo-Fi</option>
                          <option value="phonk">Aggressive Phonk</option>
                          <option value="trap">Trap Beat</option>
                          <option value="creepy">Creepy/Suspense</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="font-style" className="font-semibold text-gray-300">Subtitle Font</Label>
                        <select
                          id="font-style"
                          className="w-full px-3 py-2.5 border rounded-lg bg-black/40 border-white/10 text-white focus-visible:ring-purple-500 focus-visible:outline-none text-sm"
                          value={fontStyle}
                          onChange={(e) => setFontStyle(e.target.value)}
                        >
                          <option value="classic">Classic (Yellow/Black)</option>
                          <option value="mrbeast">MrBeast (Bold/Colorful)</option>
                          <option value="minimal">Minimal (White/No Background)</option>
                        </select>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>

              {/* Step 3: Destinations */}
              <div className="relative pl-8">
                <div className="absolute left-[-11px] top-5 w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center text-purple-400 font-bold text-xs z-10">3</div>
                
                <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="bg-black/20 border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <Send className="w-5 h-5 text-emerald-500" />
                      Destinations <span className="text-red-500">*</span>
                    </CardTitle>
                    <CardDescription>
                      Select the accounts to publish this video to.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {accounts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                          <LinkIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-4">You haven't linked any accounts yet.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const res = await apiClient.getYouTubeAuthUrl();
                              window.open(res.authUrl, '_blank');
                            }}
                            className="w-full sm:w-auto"
                          >
                            <Youtube className="w-4 h-4 mr-2 text-red-500" />
                            Link YouTube
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const res = await apiClient.getInstagramAuthUrl();
                              window.open(res.authUrl, '_blank');
                            }}
                            className="w-full sm:w-auto"
                          >
                            <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                            Link Instagram
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {accounts.map((account) => (
                            <div
                              key={account.id}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedAccounts.includes(account.id)
                                  ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                                  : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
                              }`}
                              onClick={() => toggleAccount(account.id)}
                            >
                              <div className="bg-black/40 p-2 rounded-full shadow-sm">
                              {getPlatformIcon(account.platform)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{account.platform_username || 'Channel'}</p>
                              <p className="text-xs text-muted-foreground capitalize">{account.platform}</p>
                            </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                selectedAccounts.includes(account.id)
                                  ? 'bg-purple-500 border-purple-500 text-white'
                                  : 'border-white/20'
                              }`}>
                              {selectedAccounts.includes(account.id) && <CheckCircle className="w-4 h-4" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-schedule" className="text-base font-semibold text-white">Auto-Schedule</Label>
                        <p className="text-sm text-gray-400 mt-1 max-w-md">
                          Automatically assign this video to the next available slot based on your Schedule Planner.
                        </p>
                      </div>
                      <Switch
                        id="auto-schedule"
                        checked={autoSchedule}
                        onCheckedChange={setAutoSchedule}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue">
            <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-sm">
              <CardHeader className="border-b border-white/5 bg-black/20">
                <CardTitle className="text-white">Video Queue</CardTitle>
                <CardDescription>
                  Track all your videos in the processing pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="p-4">
                    {videos.length === 0 ? (
                      <div className="text-center py-20 text-gray-500">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/40 mb-4">
                          <Video className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="font-medium text-lg text-gray-300">Queue is empty</p>
                        <p className="text-sm mt-1">Create your first automated video to see it here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {videos.map((video) => (
                          <div
                            key={video.id}
                            className="p-5 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  {getStatusBadge(video.status as VideoStatus)}
                                  <span className="font-medium text-white truncate">
                                    {video.auto_generated_title || 'Generating Title...'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <LinkIcon className="w-3 h-3" />
                                  <span className="truncate max-w-[300px]">{video.source_url}</span>
                                  <span>•</span>
                                  <span>{video.start_timestamp} - {video.end_timestamp}</span>
                                </div>
                                
                                {video.scheduled_for && (
                                  <div className="flex items-center gap-2 mt-3 text-sm text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-md w-fit border border-cyan-500/20">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">Scheduled for {new Date(video.scheduled_for).toLocaleString()}</span>
                                  </div>
                                )}
                                
                                {['pending', 'downloading', 'processing', 'generating_script', 'creating_tts', 'rendering'].includes(video.status) && (
                                  <div className="mt-4">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                      <span>Progress</span>
                                      <span>{video.processing_progress}%</span>
                                    </div>
                                    <Progress value={video.processing_progress} className="h-2 bg-white/10" />
                                  </div>
                                )}
                                
                                {video.status === 'failed' && video.error_message && (
                                  <div className="mt-3 p-3 bg-red-500/10 text-red-400 rounded-md text-sm border border-red-500/20">
                                    <strong>Error:</strong> {video.error_message}
                                  </div>
                                )}
                                
                                {video.status === 'posted' && (
                                  <div className="mt-3 text-sm text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    Posted on {new Date(video.posted_at!).toLocaleDateString()}
                                    {(video as any).metadata?.sandbox_mode && (
                                      <Badge variant="secondary" className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">SANDBOX</Badge>
                                    )}
                                  </div>
                                )}

                                {video.status === 'ready' && (video as any).metadata?.viral_strategy && (
                                  <div className="mt-4 p-4 bg-[#0F0A19] border border-white/10 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Sparkles className="w-4 h-4 text-purple-400" />
                                      <span className="font-semibold text-sm text-purple-100">AI Viral Strategy</span>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                      <div>
                                        <span className="text-gray-400">Caption: </span>
                                        <span className="text-gray-200">{(video as any).metadata.viral_strategy.captions?.[0]}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Hashtags: </span>
                                        <span className="text-blue-400">{(video as any).metadata.viral_strategy.hashtags?.join(' ')}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-gray-400">Best time to post: </span>
                                        <span className="text-emerald-400 font-medium">{(video as any).metadata.viral_strategy.optimal_timing}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                {video.status === 'ready' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(video.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                  >
                                    <Calendar className="w-4 h-4 mr-1.5" />
                                    Schedule
                                  </Button>
                                )}
                                {video.status === 'failed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReprocess(video.id)}
                                    className="w-full sm:w-auto hover:bg-slate-100"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-1.5" />
                                    Retry
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(video.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="bg-black/20 border-b border-white/5">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Youtube className="w-5 h-5 text-red-500" />
                    YouTube Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {accounts.filter(a => a.platform === 'youtube').length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">No YouTube channels linked.</p>
                  )}
                  {accounts.filter(a => a.platform === 'youtube').map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/40 shadow-sm hover:border-red-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-full">
                          <Youtube className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="font-semibold text-white">{account.platform_username}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={async () => {
                          await apiClient.unlinkAccount(account.id);
                          loadData();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-4 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all border-dashed"
                    onClick={async () => {
                      const res = await apiClient.getYouTubeAuthUrl();
                      window.open(res.authUrl, '_blank');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2 text-red-500" />
                    Connect YouTube Channel
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-[#0F0A19]/60 backdrop-blur-sm shadow-sm">
                <CardHeader className="bg-black/20 border-b border-white/5">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    Instagram Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {accounts.filter(a => a.platform === 'instagram').length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">No Instagram accounts linked.</p>
                  )}
                  {accounts.filter(a => a.platform === 'instagram').map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/40 shadow-sm hover:border-pink-500/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-full">
                          <Instagram className="w-5 h-5 text-pink-500" />
                        </div>
                        <span className="font-semibold text-white">{account.platform_username}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-pink-400 hover:bg-pink-500/10"
                        onClick={async () => {
                          await apiClient.unlinkAccount(account.id);
                          loadData();
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full mt-4 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-all border-dashed"
                    onClick={async () => {
                      const res = await apiClient.getInstagramAuthUrl();
                      window.open(res.authUrl, '_blank');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2 text-pink-500" />
                    Connect Instagram Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </main>

      {/* Floating Action Bar for Create Tab */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-40 transform transition-transform">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Ready to automate?</span>
            {isFormValid ? (
              <span className="text-sm text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> All steps completed
              </span>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Please complete all steps above
              </span>
            )}
          </div>
          
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
            className={`w-full sm:w-auto px-8 transition-all ${
              isFormValid 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
                : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 mr-2 flex items-center justify-center"><div className="loader scale-[0.25]"></div></div>
                Processing Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Automated Video
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

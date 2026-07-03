'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient, type VideoQueueItem, type SocialAccount } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
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
  Loader2,
  Send,
  Plus,
  Settings,
  Calendar,
  Sparkles,
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
  downloading: { label: 'Downloading', color: 'bg-blue-500', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  generating_script: { label: 'Writing Script', color: 'bg-purple-500', icon: <Sparkles className="w-3 h-3" /> },
  creating_tts: { label: 'Creating Voice', color: 'bg-indigo-500', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  rendering: { label: 'Rendering', color: 'bg-orange-500', icon: <Video className="w-3 h-3" /> },
  ready: { label: 'Ready', color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
  scheduled: { label: 'Scheduled', color: 'bg-cyan-500', icon: <Calendar className="w-3 h-3" /> },
  posted: { label: 'Posted', color: 'bg-emerald-500', icon: <Send className="w-3 h-3" /> },
  failed: { label: 'Failed', color: 'bg-red-500', icon: <XCircle className="w-3 h-3" /> },
};

export default function WorkspacePage() {
  const { user, signOut, session } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [videos, setVideos] = useState<VideoQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (session?.access_token) {
      apiClient.setAccessToken(session.access_token);
      loadData();
    }
  }, [session]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Brainrot Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <SchedulePlanner onSaved={() => setTrackerRefreshKey(k => k + 1)} />
            <SandboxPanel />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
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
                    className="w-full justify-start"
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
                    className="w-full justify-start"
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Self-Sufficiency Tracker — top of dashboard */}
        <div className="mb-6">
          <SelfSufficiencyTracker refreshKey={trackerRefreshKey} />
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Video Input Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                      Video Source
                    </CardTitle>
                    <CardDescription>
                      Enter a YouTube video URL and select the segment to use
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="source-url">Video URL</Label>
                      <Input
                        id="source-url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          placeholder="00:00"
                          value={startTimestamp}
                          onChange={(e) => setStartTimestamp(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          placeholder="00:45"
                          value={endTimestamp}
                          onChange={(e) => setEndTimestamp(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      Script Settings
                    </CardTitle>
                    <CardDescription>
                      AI will generate a script based on your topic, or provide your own
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic (optional)</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Amazing space facts, Mind-blowing history..."
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="script">Custom Script (optional)</Label>
                      <Textarea
                        id="script"
                        placeholder="Or write your own script here..."
                        rows={4}
                        value={scriptInput}
                        onChange={(e) => setScriptInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voice">Voice</Label>
                      <select
                        id="voice"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                      >
                        <option value="en-US-AriaNeural">Aria (US Female)</option>
                        <option value="en-US-GuyNeural">Guy (US Male)</option>
                        <option value="en-GB-SoniaNeural">Sonia (UK Female)</option>
                        <option value="en-AU-NatashaNeural">Natasha (AU Female)</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Account Matrix */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-green-600" />
                      Target Accounts
                    </CardTitle>
                    <CardDescription>
                      Select which channels to post to
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {accounts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="mb-4">No accounts linked yet</p>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const res = await apiClient.getYouTubeAuthUrl();
                              window.open(res.authUrl, '_blank');
                            }}
                          >
                            <Youtube className="w-4 h-4 mr-2" />
                            Link YouTube
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const res = await apiClient.getInstagramAuthUrl();
                              window.open(res.authUrl, '_blank');
                            }}
                          >
                            <Instagram className="w-4 h-4 mr-2" />
                            Link Instagram
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {accounts.map((account) => (
                          <div
                            key={account.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedAccounts.includes(account.id)
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => toggleAccount(account.id)}
                          >
                            {getPlatformIcon(account.platform)}
                            <span className="flex-1">{account.platform_username || 'Channel'}</span>
                            {selectedAccounts.includes(account.id) && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-schedule">Auto-Schedule</Label>
                      <Switch
                        id="auto-schedule"
                        checked={autoSchedule}
                        onCheckedChange={setAutoSchedule}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When enabled, the video will be automatically assigned to the next available slot from your Schedule Planner settings.
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || selectedAccounts.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Video
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Video Queue</CardTitle>
                <CardDescription>
                  Track all your videos in the processing pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {videos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No videos yet. Create your first one!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(video.status as VideoStatus)}
                                <span className="text-sm text-muted-foreground">
                                  {video.auto_generated_title || 'Processing...'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {video.source_url}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{video.start_timestamp} - {video.end_timestamp}</span>
                                {video.scheduled_for && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(video.scheduled_for).toLocaleString()}
                                  </span>
                                )}
                                {video.status === 'posted' && video.posted_at && (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <Send className="w-3 h-3" />
                                    Posted {new Date(video.posted_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {['pending', 'downloading', 'processing', 'generating_script', 'creating_tts', 'rendering'].includes(video.status) && (
                                <Progress value={video.processing_progress} className="mt-2 h-1" />
                              )}
                              {video.status === 'failed' && video.error_message && (
                                <p className="text-xs text-red-500 mt-2">{video.error_message}</p>
                              )}
                              {video.status === 'posted' && (
                                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Local files purged — metadata retained
                                  {(video as any).metadata?.sandbox_mode && (
                                    <Badge variant="secondary" className="ml-1 text-[10px]">SANDBOX</Badge>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {video.status === 'ready' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(video.id)}
                                >
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Approve & Schedule
                                </Button>
                              )}
                              {video.status === 'failed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReprocess(video.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-1" />
                                  Retry
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(video.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    YouTube Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accounts.filter(a => a.platform === 'youtube').map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Youtube className="w-5 h-5 text-red-500" />
                        <span>{account.platform_username}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
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
                    className="w-full"
                    onClick={async () => {
                      const res = await apiClient.getYouTubeAuthUrl();
                      window.open(res.authUrl, '_blank');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add YouTube Channel
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    Instagram Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accounts.filter(a => a.platform === 'instagram').map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Instagram className="w-5 h-5 text-pink-500" />
                        <span>{account.platform_username}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
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
                    className="w-full"
                    onClick={async () => {
                      const res = await apiClient.getInstagramAuthUrl();
                      window.open(res.authUrl, '_blank');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Instagram Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient, type DiagnosticResult } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  FlaskConical,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileVideo,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

export function SandboxPanel() {
  const [open, setOpen] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [loadingSandbox, setLoadingSandbox] = useState(true);
  const [savingSandbox, setSavingSandbox] = useState(false);

  // Diagnostic form
  const [url, setUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [start, setStart] = useState('00:30');
  const [end, setEnd] = useState('01:15');
  const [topic, setTopic] = useState('Insane speedrun tricks that broke the game');

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const loadSandbox = useCallback(async () => {
    setLoadingSandbox(true);
    try {
      const res = await apiClient.getSandboxMode();
      setSandboxMode(res.sandbox_mode);
    } catch (err) {
      console.error('Failed to load sandbox mode', err);
    } finally {
      setLoadingSandbox(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSandbox();
    }
  }, [open, loadSandbox]);

  const toggleSandbox = async (checked: boolean) => {
    setSandboxMode(checked);
    setSavingSandbox(true);
    try {
      const res = await apiClient.setSandboxMode(checked);
      setSandboxMode(res.sandbox_mode);
      toast.success(checked ? 'Sandbox test mode enabled' : 'Sandbox test mode disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle sandbox mode');
      // Revert on failure
      setSandboxMode(!checked);
    } finally {
      setSavingSandbox(false);
    }
  };

  const runDiagnostic = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await apiClient.runTestRender({ url, start, end, topic });
      setResult(res);
      if (res.ok) {
        toast.success('Diagnostic render complete — output saved to disk');
      } else {
        toast.error(res.error || 'Diagnostic render failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Diagnostic request failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConical className="w-4 h-4 mr-2" />
          Sandbox
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            Sandbox & Diagnostics
          </DialogTitle>
          <DialogDescription>
            Test the full rendering pipeline without publishing to live social accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Sandbox Test Mode Toggle */}
          <Card className={`border-2 transition-colors ${sandboxMode ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-800' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Sandbox Test Mode
              </CardTitle>
              <CardDescription>
                When enabled, scheduled posts simulate a successful publish instead of calling the live YouTube/Instagram APIs. Disk cleanup still runs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSandbox ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 flex items-center justify-center"><div className="loader scale-[0.2]"></div></div>
                  Loading...
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={sandboxMode}
                      onCheckedChange={toggleSandbox}
                      disabled={savingSandbox}
                    />
                    <Badge variant={sandboxMode ? 'default' : 'secondary'}>
                      {sandboxMode ? 'ON — posts are simulated' : 'OFF — live posting'}
                    </Badge>
                  </div>
                  {savingSandbox && <div className="w-4 h-4 flex items-center justify-center text-muted-foreground"><div className="loader scale-[0.2]"></div></div>}
                </div>
              )}
              {sandboxMode && (
                <div className="mt-3 flex items-start gap-2 text-sm text-purple-700 dark:text-purple-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Any video that reaches its scheduled time will be marked as posted with a dummy URL.
                    No real social media API will be contacted.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Diagnostic Test Render */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                Pipeline Diagnostic
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Runs the full $0 stack (Gemini script, edge-tts, Whisper, FFmpeg) on a test clip and saves the final render to disk for visual inspection. Does not touch the database or post anywhere.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="diag-url">Source URL</Label>
                <Input
                  id="diag-url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="diag-start">Start</Label>
                  <Input id="diag-start" value={start} onChange={e => setStart(e.target.value)} placeholder="00:30" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="diag-end">End</Label>
                  <Input id="diag-end" value={end} onChange={e => setEnd(e.target.value)} placeholder="01:15" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diag-topic">Topic</Label>
                <Input
                  id="diag-topic"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Insane speedrun tricks..."
                />
              </div>
            </div>

            <Button onClick={runDiagnostic} disabled={running} className="w-full">
              {running ? (
                <>
                  <div className="w-4 h-4 mr-2 flex items-center justify-center"><div className="loader scale-[0.2]"></div></div>
                  Running pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Diagnostic Render
                </>
              )}
            </Button>

            {/* Diagnostic Result */}
            {result && (
              <div className="space-y-3 pt-2">
                <div className={`p-3 rounded-lg border ${result.ok ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800' : 'border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800'}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    {result.ok ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    {result.ok ? 'Pipeline completed successfully' : 'Pipeline failed'}
                  </div>
                  {result.ok && result.output_path && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.output_path}</code>
                    </div>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  )}
                </div>

                {/* Step breakdown */}
                <div className="space-y-1.5">
                  {result.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {s.ok ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="font-mono text-xs uppercase tracking-wide w-20 shrink-0">{s.step}</span>
                      <span className="text-muted-foreground truncate">{s.detail || (s.ok ? 'ok' : 'failed')}</span>
                    </div>
                  ))}
                </div>

                {/* Rendered video info */}
                {result.ok && result.video_info.width > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded border bg-card">
                      <span className="text-muted-foreground">Resolution: </span>
                      <span className="font-mono">{result.video_info.width}x{result.video_info.height}</span>
                    </div>
                    <div className="p-2 rounded border bg-card">
                      <span className="text-muted-foreground">Smart crop: </span>
                      <span className="font-mono">{result.video_info.smart_cropped ? 'applied' : 'not needed'}</span>
                    </div>
                    <div className="p-2 rounded border bg-card">
                      <span className="text-muted-foreground">Duration: </span>
                      <span className="font-mono">{result.video_info.duration.toFixed(1)}s</span>
                    </div>
                    <div className="p-2 rounded border bg-card">
                      <span className="text-muted-foreground">Word timestamps: </span>
                      <span className="font-mono">{result.word_count}</span>
                    </div>
                  </div>
                )}

                {/* Generated script preview */}
                {result.script && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Generated script</div>
                    <p className="text-sm italic">{result.script}</p>
                    {result.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.hashtags.map(h => (
                          <Badge key={h} variant="secondary" className="text-xs">#{h}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

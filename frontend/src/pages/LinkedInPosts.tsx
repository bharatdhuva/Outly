import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  Calendar,
  ExternalLink,
  RefreshCw,
  Clock,
  Clipboard,
  Shield,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api, API_BASE } from "@/lib/api";

interface LinkedInPost {
  id: number;
  content: string;
  news_sources: string | null;
  status: string;
  posted_at: string | null;
  linkedin_post_url: string | null;
  created_at: string;
}

const newsSources = [
  { name: "Hacker News", tag: "HN", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", items: 20 },
  { name: "Dev.to Trending", tag: "DEV", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", items: 12 },
  { name: "GitHub Trending", tag: "GH", color: "text-green-400 bg-green-400/10 border-green-400/20", items: 5 },
  { name: "TechCrunch RSS", tag: "TC", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", items: 10 },
];

const MAX_CHARS = 3000;

function CountdownTimer() {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const getNextMonday = () => {
      const now = new Date();
      const day = now.getDay();
      const daysUntilMonday = day === 0 ? 1 : 8 - day;
      const next = new Date(now);
      next.setDate(now.getDate() + daysUntilMonday);
      next.setHours(9, 0, 0, 0);
      return next;
    };

    const update = () => {
      const diff = getNextMonday().getTime() - Date.now();
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-xs text-foreground">{countdown}</span>;
}

export default function LinkedInPostsPage() {
  const { toast } = useToast();
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [profileName, setProfileName] = useState("Outly User");
  const [profileHeadline, setProfileHeadline] = useState("Career Autopilot");
  const [postContent, setPostContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [markingPosted, setMarkingPosted] = useState<number | null>(null);

  const charCount = postContent.length;
  const charPct = Math.min((charCount / MAX_CHARS) * 100, 100);
  const hashtagCount = (postContent.match(/#\w+/g) || []).length;

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/linkedin/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const settings = await api.settings.get();
        if (!cancelled) {
          setWeeklyEnabled(settings.weekly_post_enabled !== "false");
          setProfileName(settings.full_name || "Outly User");
          setProfileHeadline(settings.linkedin_headline || "Career Autopilot");
        }
      } catch (err) {
        console.error("Failed to load LinkedIn settings:", err);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleWeeklyToggle = async (enabled: boolean) => {
    setWeeklyEnabled(enabled);
    try {
      await api.linkedin.setWeeklyPost(enabled);
      toast({
        title: enabled ? "Weekly roundup enabled" : "Weekly roundup paused",
        description: enabled
          ? "Monday LinkedIn roundup will run automatically."
          : "Automatic Monday roundup is now off.",
      });
    } catch (err) {
      setWeeklyEnabled(!enabled);
      toast({
        variant: "destructive",
        title: "Failed to update setting",
        description: String(err),
      });
    }
  };

  // ─── Generate Daily LinkedIn Draft ───
  const handleGenerateDraft = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/linkedin/generate-draft`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPostContent(data.content);
        setDraftId(data.id);
        toast({
          title: "✨ LinkedIn Draft Ready!",
          description: `${data.charCount} characters · Copy and paste on LinkedIn!`,
        });
        fetchPosts();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to generate draft" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Generate Weekly Tech Roundup ───
  const handleGenerateWeekly = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/linkedin/generate-weekly-post`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setPostContent(data.content);
        setDraftId(data.id);
        toast({
          title: "📰 Weekly Roundup Ready!",
          description: `${data.charCount} characters · Copy and paste on LinkedIn!`,
        });
        fetchPosts();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to generate" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Copy to Clipboard ───
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postContent);
      setCopied(true);
      toast({ title: "📋 Copied!", description: "Post copied to clipboard. Paste it on LinkedIn!" });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({ variant: "destructive", title: "Copy Failed", description: "Please select and copy manually" });
    }
  };

  // ─── Mark as Posted (Manual) ───
  const handleMarkAsPosted = async (postId: number) => {
    setMarkingPosted(postId);
    try {
      const res = await fetch(`${API_BASE}/linkedin/mark-posted/${postId}`, { method: "POST" });
      if (res.ok) {
        toast({ title: "🎉 Marked as Posted!", description: "Great job! Keep building in public!" });
        if (draftId === postId) {
          setDraftId(null);
          setPostContent("");
        }
        fetchPosts();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
    } finally {
      setMarkingPosted(null);
    }
  };

  // Count posts this week
  const postsThisWeek = posts.filter(p => {
    if (p.status !== 'posted' || !p.posted_at) return false;
    const posted = new Date(p.posted_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return posted >= weekAgo;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            LinkedIn Posts
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered drafts · Manual posting for safety
          </p>
        </div>
        <div className="flex w-full items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 sm:w-auto">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Safe Mode</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{postsThisWeek}</p>
          <p className="text-xs text-muted-foreground">Posts this week</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{posts.filter(p => p.status === 'posted').length}</p>
          <p className="text-xs text-muted-foreground">Total posted</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{posts.filter(p => p.status === 'draft').length}</p>
          <p className="text-xs text-muted-foreground">Drafts</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{charCount}</p>
          <p className="text-xs text-muted-foreground">Current draft chars</p>
        </div>
      </div>

      {/* Schedule Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Weekly roundup</span>
          </div>
          <Switch checked={weeklyEnabled} onCheckedChange={handleWeeklyToggle} />
        </div>
          <div className="flex flex-wrap items-center gap-3">
          {weeklyEnabled && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Next in:</span>
              <CountdownTimer />
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleGenerateWeekly}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            Weekly Roundup
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleGenerateDraft}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isGenerating ? "Generating..." : "Generate Daily Draft"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Post Editor + LinkedIn Preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Editor */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Draft Editor
              </h2>
              <div className="flex items-center gap-2">
                {hashtagCount > 0 && (
                  <span className="text-xs text-muted-foreground rounded-full border border-border px-2 py-0.5">
                    #️⃣ {hashtagCount} hashtags
                  </span>
                )}
                <StatusBadge status="draft" />
              </div>
            </div>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Generate a draft or type your LinkedIn post here..."
              className="w-full min-h-[260px] resize-none rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {/* Character limit bar */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                </span>
                <span
                  className={`font-mono text-xs ${
                    charPct > 90 ? "text-destructive" : charPct > 75 ? "text-warning" : "text-muted-foreground"
                  }`}
                >
                  {Math.round(charPct)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    charPct > 90 ? "bg-destructive" : charPct > 75 ? "bg-warning" : "bg-blue-500"
                  }`}
                  style={{ width: `${charPct}%` }}
                />
              </div>
            </div>

            {/* Action Buttons — v2.3: Copy + Mark as Posted (NO direct Post) */}
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={!postContent}
                className="gap-2"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Clipboard className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
              {draftId && (
                <Button
                  size="sm"
                  onClick={() => handleMarkAsPosted(draftId)}
                  disabled={markingPosted === draftId}
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {markingPosted === draftId ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {markingPosted === draftId ? "Marking..." : "Mark as Posted"}
                </Button>
              )}
            </div>
          </div>

          {/* LinkedIn-style Preview Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                LinkedIn Preview
              </h2>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              {/* Profile header */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-sm font-bold text-blue-400">
                  BD
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{profileName}</p>
                  <p className="text-xs text-muted-foreground">{profileHeadline}</p>
                  <p className="text-[10px] text-muted-foreground/60">Just now · 🌍</p>
                </div>
              </div>
              {/* Content */}
              <div className="whitespace-pre-wrap rounded-lg bg-background/50 p-3 text-xs leading-relaxed text-secondary-foreground border border-border/50 max-h-[300px] overflow-y-auto">
                {postContent || <span className="text-muted-foreground italic">Generate a draft to see preview...</span>}
              </div>
              {/* Actions mock */}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border/50 pt-3">
                {["👍 Like", "💬 Comment", "↗ Share"].map((action) => (
                  <button key={action} className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Manual Posting Guide */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
            <h2 className="mb-3 text-sm font-semibold text-blue-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              How to Post (v2.3 Safe Flow)
            </h2>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                Generate a draft using the button above
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                Edit if needed in the editor
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                Click "Copy to Clipboard"
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                Open LinkedIn → Create post → Paste
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold">5.</span>
                Come back and click "Mark as Posted" ✅
              </li>
            </ol>
            <p className="mt-3 text-[10px] text-muted-foreground/60 italic">
              🔒 LinkedIn posts are never auto-published for account safety
            </p>
          </div>

          {/* Past Posts */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Past Posts
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {isLoadingPosts ? (
                <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
              ) : posts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No posts yet. Generate your first draft!</p>
              ) : (
                posts.slice(0, 10).map((post) => (
                  <div key={post.id} className="rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-accent/30">
                    <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={post.status} />
                        {post.status === 'draft' || post.status === 'approved' ? (
                          <div className="flex gap-1">
                            <button 
                              onClick={async () => {
                                await navigator.clipboard.writeText(post.content);
                                toast({ title: "📋 Copied!", description: "Paste it on LinkedIn!" });
                              }}
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => handleMarkAsPosted(post.id)}
                              className="text-muted-foreground hover:text-emerald-400 p-0.5"
                              title="Mark as posted"
                              disabled={markingPosted === post.id}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </button>
                          </div>
                        ) : post.linkedin_post_url ? (
                          <a href={post.linkedin_post_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-secondary-foreground line-clamp-2">
                      {post.content.substring(0, 120)}{post.content.length > 120 ? '...' : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* News Sources */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              News Sources
            </h2>
            <div className="space-y-2">
              {newsSources.map((source) => (
                <div key={source.name} className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground/60">{source.items} articles</span>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${source.color}`}>
                      {source.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Trash2,
  Edit2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, API_BASE } from "@/lib/api";
import DotLottieLoader from "@/components/DotLottieLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

  // Tabs: create | calendar
  const [activeTab, setActiveTab] = useState<"create" | "calendar">("create");

  // Voice style preferences
  const [voiceProfile, setVoiceProfile] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  // Calendar click state
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editPostContent, setEditPostContent] = useState("");
  const [isEditingInDialog, setIsEditingInDialog] = useState(false);

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
          setVoiceProfile(settings.linkedin_voice_profile || "");
          setVoiceEnabled(settings.linkedin_voice_enabled === "true");
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

  const handleVoiceToggle = async (enabled: boolean) => {
    setVoiceEnabled(enabled);
    try {
      await api.settings.set("linkedin_voice_enabled", String(enabled));
      toast({
        title: enabled ? "Voice style learning enabled" : "Voice style learning disabled",
        description: "Your LinkedIn post style settings have been updated.",
      });
    } catch (err) {
      setVoiceEnabled(!enabled);
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    }
  };

  const handleSaveVoiceProfile = async () => {
    setIsSavingVoice(true);
    try {
      await api.settings.set("linkedin_voice_profile", voiceProfile);
      toast({
        title: "Voice style saved",
        description: "AI will now generate posts matching this format when style toggle is active.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error saving style",
        description: String(err),
      });
    } finally {
      setIsSavingVoice(false);
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
        setIsDetailOpen(false);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
    } finally {
      setMarkingPosted(null);
    }
  };

  // ─── Delete Post ───
  const handleDeletePost = async (postId: number) => {
    try {
      await api.linkedin.deletePost(postId);
      toast({ title: "Post Deleted", description: "Draft removed successfully." });
      if (draftId === postId) {
        setDraftId(null);
        setPostContent("");
      }
      fetchPosts();
      setIsDetailOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
    }
  };

  // ─── Save Edited Post ───
  const handleSavePostEdit = async () => {
    if (!selectedPost) return;
    try {
      await api.linkedin.updatePost(selectedPost.id, { content: editPostContent });
      toast({ title: "Post Saved", description: "Content updated successfully." });
      if (draftId === selectedPost.id) {
        setPostContent(editPostContent);
      }
      fetchPosts();
      setIsEditingInDialog(false);
      setSelectedPost({ ...selectedPost, content: editPostContent });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
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

  // Calendar dates computation
  const getWeekDays = () => {
    const days = [];
    const now = new Date();
    const currentDay = now.getDay();
    // Start week on Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getPostsForDay = (date: Date) => {
    const formattedDate = date.toDateString();
    return posts.filter(p => {
      const pDate = new Date(p.created_at || p.posted_at || Date.now());
      return pDate.toDateString() === formattedDate;
    });
  };

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
        <div className="flex w-full items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 sm:w-auto justify-center">
          <Shield className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Safe Mode</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "create"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Create & Edit
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Content Calendar
        </button>
      </div>

      {activeTab === "create" ? (
        <>
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
                  className="w-full min-h-[220px] resize-none rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
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

              {/* Write in my style */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Write In My Style
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Learn style</span>
                    <Switch checked={voiceEnabled} onCheckedChange={handleVoiceToggle} />
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-4">
                  Paste examples of your previous posts (ideally 3 posts). The generator will scan your style, punctuation, and structural layout to replicate them.
                </p>
                <Textarea
                  className="min-h-[120px] bg-muted/20 border-border text-[12px] leading-5"
                  placeholder="Paste your past posts here..."
                  value={voiceProfile}
                  onChange={(e) => setVoiceProfile(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveVoiceProfile}
                    disabled={isSavingVoice}
                    className="gap-2"
                  >
                    {isSavingVoice && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Save Voice Profile
                  </Button>
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
                      {profileName.slice(0, 2).toUpperCase()}
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
                      <span key={action} className="text-xs text-muted-foreground/60">
                        {action}
                      </span>
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
                    <DotLottieLoader size={120} minHeight="min-h-[150px]" />
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
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="text-muted-foreground hover:text-destructive p-0.5"
                                  title="Delete post"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : post.linkedin_post_url ? (
                              <a href={post.linkedin_post_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-muted-foreground hover:text-destructive p-0.5"
                                title="Delete post"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
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
        </>
      ) : (
        /* Calendar View Tab */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Content Calendar (This Week)
            </h2>
            <div className="grid gap-4 md:grid-cols-7">
              {weekDays.map((day) => {
                const dayPosts = getPostsForDay(day);
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={day.toDateString()}
                    className={`rounded-xl border p-3 min-h-[160px] flex flex-col space-y-2 transition-all ${
                      isToday
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                        : "border-border bg-muted/10 hover:bg-muted/20"
                    }`}
                  >
                    <div className="border-b border-border/50 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-[13px] font-semibold text-foreground">
                        {day.getDate()}{" "}
                        {day.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px]">
                      {dayPosts.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground/50 block italic pt-2">No posts</span>
                      ) : (
                        dayPosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => {
                              setSelectedPost(post);
                              setEditPostContent(post.content);
                              setIsDetailOpen(true);
                            }}
                            className="p-2 rounded bg-secondary/80 border border-border hover:border-primary/40 cursor-pointer transition-colors text-left space-y-1"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono text-muted-foreground"># {post.id}</span>
                              <StatusBadge status={post.status} />
                            </div>
                            <p className="text-[10px] text-secondary-foreground line-clamp-2">
                              {post.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Content Schedule Tips</h3>
            <div className="grid gap-4 sm:grid-cols-3 text-xs text-muted-foreground">
              <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
                <p className="font-semibold text-foreground">Best Posting Days</p>
                <p>Tuesday, Wednesday, and Thursday see the highest professional engagement rates on LinkedIn.</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
                <p className="font-semibold text-foreground">Peak Timings</p>
                <p>Post between 8:00 AM - 10:00 AM or 12:00 PM - 2:00 PM local time for maximum visibility.</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
                <p className="font-semibold text-foreground">Roundup Frequency</p>
                <p>Running weekly updates on Mondays creates a reliable rhythm for your professional network.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Post Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] border-border bg-card">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-[16px] font-bold text-foreground">
                Post Details (ID: #{selectedPost?.id})
              </DialogTitle>
              {selectedPost && <StatusBadge status={selectedPost.status} />}
            </div>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4 py-3">
              {isEditingInDialog ? (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">Edit Content</span>
                  <Textarea
                    className="min-h-[240px] text-[13px] leading-relaxed"
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingInDialog(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSavePostEdit}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">Post Content</span>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border text-[13px] whitespace-pre-wrap leading-relaxed">
                    {selectedPost.content}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 text-[11px] text-muted-foreground border-t border-border pt-3">
                <p>Created on: {new Date(selectedPost.created_at).toLocaleString()}</p>
                {selectedPost.posted_at && (
                  <p>Marked posted on: {new Date(selectedPost.posted_at).toLocaleString()}</p>
                )}
              </div>

              {!isEditingInDialog && (
                <DialogFooter className="flex flex-wrap gap-2 justify-between sm:justify-end border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeletePost(selectedPost.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingInDialog(true)}
                    >
                      <Edit2 className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedPost.content);
                        toast({ title: "📋 Copied!", description: "Paste it on LinkedIn!" });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy Content
                    </Button>

                    {selectedPost.status !== "posted" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleMarkAsPosted(selectedPost.id)}
                        disabled={markingPosted === selectedPost.id}
                      >
                        {markingPosted === selectedPost.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        )}
                        Mark as Posted
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

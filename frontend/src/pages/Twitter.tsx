import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Calendar,
  ExternalLink,
  RefreshCw,
  Clock,
  Trash2,
  ArrowUp,
  ArrowDown,
  Volume2,
  Shield,
  Eye,
  Layers,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, API_BASE } from "@/lib/api";
import OutlyPageLoader from "@/components/OutlyPageLoader";

interface TwitterPost {
  id: number;
  content: string;
  type: "single" | "thread";
  status: string;
  posted_at: string | null;
  twitter_post_id: string | null;
  impressions: number;
  likes: number;
  replies: number;
  error_message: string | null;
  created_at: string;
}

const MAX_CHARS = 280;

function CountdownTimer() {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const getNextTime = () => {
      const now = new Date();
      // Daily 8AM
      const next = new Date(now);
      if (now.getHours() >= 8) {
        next.setDate(now.getDate() + 1);
      }
      next.setHours(8, 0, 0, 0);
      return next;
    };

    const update = () => {
      const diff = getNextTime().getTime() - Date.now();
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-xs text-foreground">{countdown}</span>;
}

export default function TwitterPage() {
  const { toast } = useToast();
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [posts, setPosts] = useState<TwitterPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Thread controls
  const [createAsThread, setCreateAsThread] = useState(false);
  const [threadTweets, setThreadTweets] = useState<string[]>([]);
  const [singleTweet, setSingleTweet] = useState("");

  // Voice style settings
  const [voiceProfile, setVoiceProfile] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  // Drag-and-drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE}/twitter/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Failed to fetch twitter posts:", err);
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
          setVoiceProfile(settings.twitter_voice_profile || "");
          setVoiceEnabled(settings.twitter_voice_enabled === "true");
        }
      } catch (err) {
        console.error("Failed to load Twitter settings:", err);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVoiceToggle = async (enabled: boolean) => {
    setVoiceEnabled(enabled);
    try {
      await api.settings.set("twitter_voice_enabled", String(enabled));
      toast({
        title: enabled ? "Voice style learning enabled" : "Voice style learning disabled",
        description: "Your Twitter/X style settings have been updated.",
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
      await api.settings.set("twitter_voice_profile", voiceProfile);
      toast({
        title: "Voice style saved",
        description: "AI will now generate tweets matching this format when style toggle is active.",
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/twitter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: createAsThread ? "thread" : "single" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setDraftId(data.dbId);
      if (createAsThread) {
        try {
          const parsed = JSON.parse(data.content);
          setThreadTweets(Array.isArray(parsed) ? parsed : [data.content]);
        } catch {
          setThreadTweets([data.content]);
        }
      } else {
        setSingleTweet(data.content);
      }

      toast({
        title: createAsThread ? "Thread Generated" : "Tweet Generated",
        description: `Your AI curated ${createAsThread ? 'thread' : 'tweet'} is ready.`,
      });
      fetchPosts();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostNow = async () => {
    if (!draftId) {
      toast({
        variant: "destructive",
        title: "Wait",
        description: "Generate a post first!",
      });
      return;
    }
    setIsPosting(true);
    try {
      const content = createAsThread ? JSON.stringify(threadTweets) : singleTweet;

      const res = await fetch(`${API_BASE}/twitter/posts/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      toast({
        title: "Published!",
        description: "Post approved and queued for Twitter/X.",
      });
      setDraftId(null);
      setSingleTweet("");
      setThreadTweets([]);
      fetchPosts();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await api.twitter.delete(id);
      toast({ title: "Deleted", description: "Tweet removed from history." });
      if (draftId === id) {
        setDraftId(null);
        setSingleTweet("");
        setThreadTweets([]);
      }
      fetchPosts();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: String(err) });
    }
  };

  // Reordering controls for threads
  const moveTweet = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= threadTweets.length) return;

    const copy = [...threadTweets];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setThreadTweets(copy);
  };

  // Drag and drop HTML5 handlers
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const copy = [...threadTweets];
    const item = copy[draggedIdx];
    copy.splice(draggedIdx, 1);
    copy.splice(idx, 0, item);
    setDraggedIdx(idx);
    setThreadTweets(copy);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Check limits
  const isThreadValid = threadTweets.every(t => t.length <= MAX_CHARS) && threadTweets.length > 0;
  const isSingleValid = singleTweet.length <= MAX_CHARS && singleTweet.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Twitter / X
          </h1>
          <p className="text-sm text-muted-foreground">
            Daily build-in-public updates
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Daily auto-post</span>
            </div>
            <Switch
              checked={automationEnabled}
              onCheckedChange={setAutomationEnabled}
            />
          </div>
          <div className="flex items-center gap-4 border-l border-border/60 pl-6">
            <span className="text-sm text-foreground">Generate as thread</span>
            <Switch
              checked={createAsThread}
              onCheckedChange={setCreateAsThread}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {automationEnabled && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Next post in:</span>
              <CountdownTimer />
            </div>
          )}
          <Button
            size="sm"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isGenerating ? "Generating..." : `Generate Today's ${createAsThread ? 'Thread' : 'Tweet'}`}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {/* Draft area */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Draft Editor
              </h2>
              <StatusBadge status="draft" />
            </div>

            {!createAsThread ? (
              /* Single Tweet Editor */
              <div className="space-y-3">
                <textarea
                  value={singleTweet}
                  onChange={(e) => setSingleTweet(e.target.value)}
                  placeholder="Generate a draft or write your tweet here..."
                  className="w-full min-h-[140px] resize-none rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {singleTweet.length} / {MAX_CHARS} chars
                  </span>
                  <span
                    className={`font-mono text-xs ${
                      singleTweet.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {Math.round((singleTweet.length / MAX_CHARS) * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              /* Thread Editor */
              <div className="space-y-4">
                {threadTweets.map((tweet, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="p-3 bg-secondary/30 rounded-lg border border-border/80 space-y-2 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-border/30 pb-1">
                      <span className="font-bold uppercase tracking-wider text-primary">Tweet {idx + 1} of {threadTweets.length}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveTweet(idx, "up")}
                          disabled={idx === 0}
                          className="hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTweet(idx, "down")}
                          disabled={idx === threadTweets.length - 1}
                          className="hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Textarea
                      className="min-h-[80px] text-xs leading-relaxed font-mono resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                      value={tweet}
                      onChange={(e) => {
                        const copy = [...threadTweets];
                        copy[idx] = e.target.value;
                        setThreadTweets(copy);
                      }}
                    />
                    <div className="flex justify-between items-center text-[10px]">
                      <span className={`${tweet.length > MAX_CHARS ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        {tweet.length} / {MAX_CHARS} chars
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const copy = [...threadTweets];
                          copy.splice(idx, 1);
                          setThreadTweets(copy);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setThreadTweets([...threadTweets, ""])}
                >
                  + Add Tweet
                </Button>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handlePostNow}
                disabled={isPosting || (createAsThread ? !isThreadValid : !isSingleValid)}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPosting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isPosting ? "Posting..." : "Post Now"}
              </Button>
            </div>
          </div>

          {/* Voice profile style learning */}
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
              Paste examples of your previous tweets (ideally 3 posts). The generator will match your punctuation style and tone format.
            </p>
            <Textarea
              className="min-h-[100px] bg-muted/20 border-border text-[12px] leading-5"
              placeholder="Paste your past tweets here..."
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

          {/* Tweet Preview Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                X / Twitter Preview
              </h2>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
              {!createAsThread ? (
                /* Single Preview Card */
                <div>
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      BD
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Bharat Dhuva</p>
                      <p className="text-[10px] text-muted-foreground">@bharat_dhuva</p>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-background/50 p-3 text-xs leading-relaxed text-secondary-foreground border border-border/50">
                    {singleTweet || "What is happening?!"}
                  </div>
                </div>
              ) : (
                /* Thread Preview Card with connecting line */
                <div className="space-y-4 relative pl-3">
                  <div className="absolute left-7 top-4 bottom-8 w-[2px] bg-border/80 z-0" />
                  {threadTweets.map((tweet, idx) => (
                    <div key={idx} className="relative z-10 flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary border border-background">
                        BD
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">Bharat Dhuva</span>
                          <span className="text-[10px] text-muted-foreground">@bharat_dhuva · {idx + 1}</span>
                        </div>
                        <div className="whitespace-pre-wrap rounded-lg bg-background/50 p-3 text-xs leading-relaxed text-secondary-foreground border border-border/50">
                          {tweet || <span className="italic text-muted-foreground">Tweet content empty...</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-6 border-t border-border/50 pt-3">
                {["💬 Reply", "🔁 Retweet", "❤️ Like"].map((action) => (
                  <span key={action} className="text-xs text-muted-foreground/60">
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Past Tweets / Threads
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {isLoadingPosts ? (
                <OutlyPageLoader message="Loading Twitter & Thread History..." minHeight="min-h-[150px]" />
              ) : posts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No posts yet. Generate your first draft!</p>
              ) : (
                posts.map((post) => {
                  let isThread = post.type === "thread";
                  let displayContent = post.content;
                  if (isThread) {
                    try {
                      const arr = JSON.parse(post.content);
                      displayContent = Array.isArray(arr) ? arr.join(" \n\n[Next Tweet]\n ") : post.content;
                    } catch {
                      // ignore
                    }
                  }
                  return (
                    <div
                      key={post.id}
                      className="rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-accent/30 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span className="rounded-full bg-secondary/80 px-1.5 py-0.5 text-[8px] font-bold">
                            {post.type.toUpperCase()}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={post.status} />
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-muted-foreground hover:text-destructive p-0.5"
                            title="Delete draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-secondary-foreground whitespace-pre-wrap line-clamp-3">
                        {displayContent}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

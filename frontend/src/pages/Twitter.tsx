import { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Calendar,
  ExternalLink,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const mockPosts = [
  {
    id: 1,
    date: "Feb 17, 2026",
    preview: "🚀 Just shipped a new feature...",
    status: "posted",
    url: "#",
  },
  {
    id: 2,
    date: "Feb 10, 2026",
    preview: "TIL: React Server Components...",
    status: "posted",
    url: "#",
  },
];

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
  const [postContent, setPostContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);

  const charCount = postContent.length;
  const charPct = Math.min((charCount / MAX_CHARS) * 100, 100);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/twitter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "single" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setPostContent(data.content);
      setDraftId(data.dbId);
      toast({
        title: "Draft Generated",
        description: "Your AI curated tweet is ready.",
      });
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
      // Actually approve the draft in the backend so it posts
      const res = await fetch(`/api/twitter/posts/${draftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", content: postContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      toast({
        title: "Published!",
        description: "Post approved and queued for Twitter/X.",
      });
      setDraftId(null);
      setPostContent("");
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
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Daily auto-post</span>
          </div>
          <Switch
            checked={automationEnabled}
            onCheckedChange={setAutomationEnabled}
          />
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
            onClick={handleRegenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isGenerating ? "Generating..." : "Generate Today's Tweet"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Draft
              </h2>
              <StatusBadge status="draft" />
            </div>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full min-h-[160px] resize-none rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}{" "}
                  chars
                </span>
                <span
                  className={`font-mono text-xs ${
                    charPct >= 100
                      ? "text-destructive"
                      : charPct > 80
                        ? "text-warning"
                        : "text-muted-foreground"
                  }`}
                >
                  {Math.round(charPct)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    charPct >= 100
                      ? "bg-destructive"
                      : charPct > 80
                        ? "bg-warning"
                        : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(charPct, 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handlePostNow}
                disabled={isPosting || !postContent || charPct > 100}
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

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Preview
            </h2>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  BD
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Bharat Dhuva
                  </p>
                  <p className="text-xs text-muted-foreground">@bharat_dhuva</p>
                </div>
              </div>
              <div className="whitespace-pre-wrap rounded-lg bg-background/50 p-3 text-sm leading-relaxed text-secondary-foreground line-clamp-6 border border-border/50">
                {postContent || "What is happening?!"}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-6 border-t border-border/50 pt-3">
                {["💬 Reply", "🔁 Retweet", "❤️ Like"].map((action) => (
                  <button
                    key={action}
                    className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Past Tweets
            </h2>
            <div className="space-y-3">
              {mockPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-accent/30"
                >
                  <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {post.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={post.status} />
                    </div>
                  </div>
                  <p className="text-sm text-secondary-foreground line-clamp-2">
                    {post.preview}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

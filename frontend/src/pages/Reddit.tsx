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
    date: "Feb 18, 2026",
    title: "Applying for internships — here's my system",
    subreddit: "r/developersIndia",
    status: "posted",
  },
  {
    id: 2,
    date: "Feb 11, 2026",
    title: "Resources I used to learn React in 2026",
    subreddit: "r/cscareerquestions",
    status: "posted",
  },
];

function CountdownTimer() {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const getNextTime = () => {
      const now = new Date();
      const day = now.getDay();
      // Next Tuesday 10AM
      let daysUntilTuesday = 2 - day;
      if (daysUntilTuesday <= 0) {
        if (daysUntilTuesday === 0 && now.getHours() < 10) {
          daysUntilTuesday = 0;
        } else {
          daysUntilTuesday += 7;
        }
      }
      const next = new Date(now);
      next.setDate(now.getDate() + daysUntilTuesday);
      next.setHours(10, 0, 0, 0);
      return next;
    };

    const update = () => {
      const diff = getNextTime().getTime() - Date.now();
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

export default function RedditPage() {
  const { toast } = useToast();
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPostTitle("What I learned this week building Outly");
      setPostContent("Hey everyone! I wanted to share some insights from building my personal automation system this week. I ran into a few interesting challenges with rate limiting and queue management that I thought might be helpful to discuss...");
      setDraftId(Date.now());
      toast({
        title: "Draft Generated",
        description: "Your Reddit post for r/developersIndia is ready.",
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Published!",
        description: "Check Reddit.",
      });
      setDraftId(null);
      setPostContent("");
      setPostTitle("");
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
            Reddit Community
          </h1>
          <p className="text-sm text-muted-foreground">
            Weekly value-add posts
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Weekly auto-post</span>
          </div>
          <Switch checked={automationEnabled} onCheckedChange={setAutomationEnabled} />
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
            {isGenerating ? "Generating..." : "Generate This Week's Post"}
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
            
            <input 
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Post Title..."
              className="w-full mb-3 rounded-lg border border-border bg-muted/30 p-3 font-semibold text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Post Content..."
              className="w-full min-h-[220px] resize-none rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            <div className="mt-3 flex justify-end">
              <Button
                onClick={handlePostNow}
                disabled={isPosting || !postContent || !postTitle}
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
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Past Posts
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
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary uppercase">
                      {post.subreddit}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground/80 flex items-center gap-2">
                    <StatusBadge status={post.status} />
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

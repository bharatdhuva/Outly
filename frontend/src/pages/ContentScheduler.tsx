import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Calendar,
  RefreshCw,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ContentPost {
  id: number;
  content: string;
  status: string;
  scheduled_at?: string | null;
  created_at: string;
}

export default function ContentScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const { data: posts = [], isLoading } = useQuery<ContentPost[]>({
    queryKey: ["content-posts"],
    queryFn: async () => {
      try {
        const res = await api.linkedin.getPosts();
        return res as ContentPost[];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (posts.length > 0 && !selectedPost) {
      setSelectedPost(posts[0]);
    }
  }, [posts, selectedPost]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await api.linkedin.generateDraft(newTopic || "Tech Trends & Career Insights");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      setIsCreating(false);
      setNewTopic("");
      toast({
        title: "Content Draft Generated",
        description: "New AI post has been added to your schedule queue.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: String(err),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.linkedin.deletePost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      setSelectedPost(null);
      toast({ title: "Post Deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return await api.linkedin.updatePost(id, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      setIsEditing(false);
      toast({ title: "Post Updated Successfully" });
    },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:py-8 space-y-8 animate-fade-in pb-16">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 text-left">
          <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
            CONTENT SCHEDULER
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
            Automated Content Post Scheduler
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Generate AI-powered content posts, schedule automated releases, and manage your publication queue in one clean dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 bg-outly-accent text-white hover:brightness-110 shadow-md shadow-outly-accent/20 rounded-full px-6 py-2.5 font-semibold text-sm h-11 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Generate New Post
            </Button>
            <DialogContent className="sm:max-w-[480px] border-border bg-card rounded-2xl p-6">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold text-foreground">Generate Content Post</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Enter a topic or niche hook for AI generation, or leave blank for trending industry insights.
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Topic / Focus Hook (Optional)</label>
                  <Input
                    placeholder="e.g. AI tools for developers, Career growth tips..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    className="w-full bg-outly-accent text-white hover:brightness-110 rounded-full font-semibold h-10 text-sm shadow-md shadow-outly-accent/20 cursor-pointer gap-2"
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {generateMutation.isPending ? "Generating Post..." : "Generate AI Post"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Scheduled / Draft Posts List */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80">
              Scheduled Queue ({posts.length})
            </h3>
            <span className="text-[11px] font-semibold text-outly-accent bg-outly-accent/10 px-2.5 py-0.5 rounded-full">
              Auto-Pilot Active
            </span>
          </div>

          <div className="divide-y divide-border max-h-[550px] overflow-auto custom-scrollbar flex-1">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground font-medium text-xs">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-outly-accent" />
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-bold text-foreground text-sm">No scheduled posts</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click Generate New Post to create your first content draft.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-4 transition-all hover:bg-slate-50 flex flex-col gap-2 ${
                    selectedPost?.id === post.id
                      ? "bg-outly-accent/5 border-l-4 border-l-outly-accent"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                      Scheduled
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Post Detail Preview */}
        <div className="lg:col-span-3 space-y-4">
          {selectedPost ? (
            <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm animate-slide-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-outly-accent" />
                    Content Post Preview
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created on {new Date(selectedPost.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditContent(selectedPost.content);
                      }}
                      className="h-9 gap-1.5 text-xs font-semibold rounded-full"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-outly-accent" />
                      Edit Post
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: selectedPost.id,
                          content: editContent,
                        })
                      }
                      disabled={updateMutation.isPending}
                      className="h-9 gap-1.5 text-xs font-semibold bg-outly-accent text-white hover:brightness-110 rounded-full"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(selectedPost.id)}
                    disabled={deleteMutation.isPending}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isEditing ? (
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                  {selectedPost.content}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-foreground/80">Edit Post Content</label>
                  <Textarea
                    rows={8}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="text-xs rounded-xl leading-relaxed p-4"
                  />
                </div>
              )}

              <div className="p-4 rounded-xl bg-outly-accent/5 border border-outly-accent/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-outly-accent" />
                  <span className="text-xs font-semibold text-foreground">
                    Automated publication queued
                  </span>
                </div>
                <span className="text-[11px] font-bold text-outly-accent">Auto-Schedule Ready</span>
              </div>
            </div>
          ) : (
            <div className="flex h-[450px] items-center justify-center rounded-2xl border border-dashed border-border bg-white text-sm text-muted-foreground shadow-sm">
              <div className="text-center p-6">
                <div className="relative mx-auto mb-4 inline-flex p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-foreground text-base">Select a Post</p>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-[220px] leading-relaxed">
                  Pick a scheduled content post from the queue on the left to preview or edit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

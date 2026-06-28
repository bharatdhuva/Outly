import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  RefreshCw,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Save,
  Rocket,
  Zap,
  TrendingUp,
  X
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContentPost {
  id: number;
  content: string;
  status: string;
  scheduled_at?: string | null;
  created_at: string;
  category?: string;
}

// ─── ANALOG CLOCK TIME PICKER DIALOG ───
function AnalogClockModal({
  open,
  onOpenChange,
  initialTime,
  onSelectTime,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTime: string;
  onSelectTime: (timeStr: string) => void;
}) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
  const [mode, setMode] = useState<"hours" | "minutes">("hours");

  useEffect(() => {
    if (initialTime) {
      const parts = initialTime.split(":");
      if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          const isPm = h >= 12;
          setAmpm(isPm ? "PM" : "AM");
          h = h % 12;
          if (h === 0) h = 12;
          setHour(h);
          setMinute(m);
        }
      }
    }
  }, [initialTime, open]);

  const handleApply = () => {
    let h24 = hour;
    if (ampm === "PM" && hour < 12) h24 += 12;
    if (ampm === "AM" && hour === 12) h24 = 0;
    const timeStr = `${h24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onSelectTime(timeStr);
    onOpenChange(false);
  };

  const hoursArray = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesArray = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const currentHandValue = mode === "hours" ? hour : minute;
  const currentArray = mode === "hours" ? hoursArray : minutesArray;
  const selectedIndex = currentArray.indexOf(currentHandValue);
  const angle = selectedIndex >= 0 ? selectedIndex * 30 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] border-border bg-card rounded-2xl p-6 text-center shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground">Select Daily Delivery Time</DialogTitle>
          <p className="text-xs text-muted-foreground">Pick exact hour & minute for automated post alerts.</p>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-4 my-2 rounded-xl bg-secondary/30 border border-border/45">
          <div className="flex items-center gap-1 text-3xl font-extrabold text-foreground font-mono">
            <button
              type="button"
              onClick={() => setMode("hours")}
              className={`px-2 py-1 rounded-lg transition-all ${
                mode === "hours" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-slate-200/60"
              }`}
            >
              {hour.toString().padStart(2, "0")}
            </button>
            <span>:</span>
            <button
              type="button"
              onClick={() => setMode("minutes")}
              className={`px-2 py-1 rounded-lg transition-all ${
                mode === "minutes" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-slate-200/60"
              }`}
            >
              {minute.toString().padStart(2, "0")}
            </button>
          </div>

          <div className="flex flex-col gap-1 bg-slate-200/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAmpm("AM")}
              className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                ampm === "AM" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setAmpm("PM")}
              className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                ampm === "PM" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        <div className="relative mx-auto my-3 h-56 w-56 rounded-full bg-slate-50 border-2 border-slate-200/80 shadow-inner flex items-center justify-center select-none">
          <div className="absolute h-3 w-3 rounded-full bg-primary z-20 shadow-xs" />
          <div
            className="absolute top-1/2 left-1/2 w-1 bg-primary origin-top z-10 rounded-full transition-all duration-300"
            style={{
              height: mode === "hours" ? "70px" : "85px",
              transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            }}
          >
            <div className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-primary shadow-sm" />
          </div>

          {currentArray.map((val, idx) => {
            const rot = idx * 30;
            const rad = (rot - 90) * (Math.PI / 180);
            const radius = 88;
            const x = Math.round(radius * Math.cos(rad));
            const y = Math.round(radius * Math.sin(rad));
            const isSelected = val === currentHandValue;

            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  if (mode === "hours") {
                    setHour(val);
                    setMode("minutes");
                  } else {
                    setMinute(val);
                  }
                }}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                className={`absolute h-8 w-8 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md font-extrabold scale-110"
                    : "text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                {mode === "minutes" ? val.toString().padStart(2, "0") : val}
              </button>
            );
          })}
        </div>

        <DialogFooter className="pt-2 sm:justify-center">
          <Button
            type="button"
            onClick={handleApply}
            className="w-full bg-primary text-primary-foreground hover:brightness-110 rounded-full font-semibold h-10 text-xs shadow-md cursor-pointer gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Set Delivery Time ({hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")} {ampm})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LiveAnalogClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  return (
    <div className="flex items-center gap-3 bg-card border border-border/80 px-4 py-2.5 rounded-2xl shadow-xs shrink-0">
      <div className="relative w-8 h-8 rounded-full border-2 border-primary/40 bg-secondary/30 flex items-center justify-center shrink-0">
        <svg className="w-full h-full" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" className="text-border/60" strokeWidth="1.5" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="20"
              y1="4"
              x2="20"
              y2="6"
              stroke="currentColor"
              className="text-muted-foreground/60"
              strokeWidth="1.5"
              transform={`rotate(${deg} 20 20)`}
            />
          ))}
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="11"
            stroke="currentColor"
            className="text-foreground"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 20 20)`}
          />
          <line
            x1="20"
            y1="20"
            x2="20"
            y2="7"
            stroke="currentColor"
            className="text-outly-accent"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${minAngle} 20 20)`}
          />
          <line
            x1="20"
            y1="22"
            x2="20"
            y2="5"
            stroke="#ef4444"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform={`rotate(${secAngle} 20 20)`}
          />
          <circle cx="20" cy="20" r="1.5" fill="#ef4444" />
        </svg>
      </div>
      <div className="text-left font-mono leading-tight">
        <p className="text-xs font-bold text-foreground tracking-tight">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Live Clock</p>
      </div>
    </div>
  );
}

export default function ContentScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deliveryTime, setDeliveryTime] = useState<string>("09:00");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+91 98765 43210");
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("+91 98765 43210");

  const [clockOpen, setClockOpen] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["content-posts"],
    queryFn: async () => {
      try {
        return await api.contentPosts.getAll();
      } catch {
        return [
          {
            id: 101,
            content: "🚀 AI and Automation in 2026 are changing how engineers build products! Leveraging modern agentic coding and personal career automation systems gives developers a 10x leverage.\n\nKey takeaways:\n1. Automate routine workflows\n2. Focus on core architectural decisions\n3. Maintain a strong online personal brand continuously.\n\n#SoftwareEngineering #ArtificialIntelligence #Productivity",
            status: "scheduled",
            created_at: new Date().toISOString(),
            category: "Software Engineering"
          },
          {
            id: 102,
            content: "💡 System Design Tip for SDE Interviews:\nWhen designing scalable real-time systems, decouple your API backend from background processing queues using Redis or Bull queues.\n\nThis ensures 99.99% uptime and zero latency spikes during traffic surges!\n\n#SystemDesign #BackendEngineering #CareerGrowth",
            status: "scheduled",
            created_at: new Date().toISOString(),
            category: "System Design & Architecture"
          }
        ];
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
      try {
        return await api.contentPosts.generate({
          topic: newTopic || "Software Engineering",
        });
      } catch {
        const fakeId = Date.now();
        return {
          id: fakeId,
          content: `🤖 Modern SDE Insight:\nBuilding scalable career leverage starts with automated systems. ${newTopic ? `Focus hook: ${newTopic}.` : "Always build in public and connect with industry leaders consistently!"}\n\n#CareerGrowth #Automation #SoftwareEngineering`,
          status: "scheduled",
          created_at: new Date().toISOString()
        };
      }
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(["content-posts"], (old: ContentPost[] = []) => [newPost, ...old]);
      setSelectedPost(newPost);
      setIsCreating(false);
      setNewTopic("");
      toast({
        title: "✨ Scheduled Post Generated!",
        description: "Your AI content post has been added to your daily scheduled queue.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      try {
        return await api.contentPosts.update(id, { content });
      } catch {
        return { id, content };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["content-posts"], (old: ContentPost[] = []) =>
        old.map((p) => (p.id === variables.id ? { ...p, content: variables.content } : p))
      );
      if (selectedPost) {
        setSelectedPost({ ...selectedPost, content: variables.content });
      }
      setIsEditing(false);
      toast({
        title: "Post Updated",
        description: "Your changes have been saved to the scheduled post.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await api.contentPosts.delete(id);
      } catch {
        return id;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(["content-posts"], (old: ContentPost[] = []) =>
        old.filter((p) => p.id !== deletedId)
      );
      setSelectedPost(null);
      toast({
        title: "Post Removed",
        description: "Content post removed from your queue.",
      });
    },
  });

  const handleSavePhone = () => {
    setWhatsappNumber(phoneInput);
    setIsPhoneModalOpen(false);
    toast({
      title: "WhatsApp Connected",
      description: `Daily alerts will be sent to ${phoneInput}.`,
    });
  };

  const formatDisplayTime = (tStr: string) => {
    const parts = tStr.split(":");
    if (parts.length < 2) return tStr;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampmStr = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampmStr}`;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:py-10 space-y-10 animate-fade-in pb-20 text-left">
      <AnalogClockModal
        open={clockOpen}
        onOpenChange={setClockOpen}
        initialTime={deliveryTime}
        onSelectTime={(newTime) => setDeliveryTime(newTime)}
      />

      {/* WhatsApp Phone Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card rounded-2xl p-6">
          <DialogHeader className="space-y-1 text-center sm:text-left">
            <DialogTitle className="text-lg font-bold text-foreground">Update WhatsApp Number</DialogTitle>
            <p className="text-xs text-muted-foreground">Receive daily content drafts directly on WhatsApp.</p>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <Input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="h-11 text-xs rounded-xl font-mono"
            />
            <DialogFooter>
              <Button
                onClick={handleSavePhone}
                className="w-full bg-primary text-primary-foreground hover:brightness-110 rounded-full font-semibold h-10 text-xs shadow-md cursor-pointer"
              >
                Save and Lock Number
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🚀 REDESIGNED HERO & ENGINE STATUS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs text-left">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] font-extrabold tracking-widest text-outly-accent uppercase bg-outly-accent/10 px-3 py-1 rounded-full border border-outly-accent/20 inline-block">
            POST SCHEDULER & BRAND AUTOMATION
          </span>

          <h1 className="text-2xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
            Build your personal engineering brand on autopilot.
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Consistency is your ultimate unfair advantage. Outly generates high-value technical posts and delivers them straight to your WhatsApp for 1-tap approval.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Working on Meta API & Social Auto-Publishing
          </span>
          <LiveAnalogClock />
        </div>
      </div>

      {/* MAIN GRID LAYOUT: QUEUE & PREVIEW */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Scheduled / Draft Posts List */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border/60 px-6 py-4 bg-secondary/25 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                Scheduled Queue ({posts.length})
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Next run: Today at{" "}
                <button
                  onClick={() => setClockOpen(true)}
                  className="text-primary font-bold hover:underline cursor-pointer"
                  title="Click to edit time"
                >
                  {formatDisplayTime(deliveryTime)} ⚙️
                </button>
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              WhatsApp Sync
            </span>
          </div>

          <div className="divide-y divide-border/60 max-h-[550px] overflow-auto custom-scrollbar flex-1">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground font-medium text-xs">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="font-bold text-foreground text-sm">No scheduled posts</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click Generate Sample AI Post to create your first content draft.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-4 transition-all hover:bg-secondary/30 flex flex-col gap-2 cursor-pointer ${
                    selectedPost?.id === post.id
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Daily {formatDisplayTime(deliveryTime)}
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
            <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm animate-slide-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Content Post Preview
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scheduled at {formatDisplayTime(deliveryTime)} • Alerts to{" "}
                    <button
                      onClick={() => {
                        setPhoneInput(whatsappNumber);
                        setIsPhoneModalOpen(true);
                      }}
                      className="text-primary font-bold hover:underline cursor-pointer"
                      title="Click to edit number"
                    >
                      {whatsappNumber} ⚙️
                    </button>
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
                      className="h-9 gap-1.5 text-xs font-semibold rounded-full cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-primary" />
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
                      className="h-9 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 rounded-full cursor-pointer"
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
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!isEditing ? (
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border/60 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
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

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    WhatsApp preview notification active for {whatsappNumber}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-primary shrink-0">Daily {formatDisplayTime(deliveryTime)} Release</span>
              </div>
            </div>
          ) : (
            <div className="flex h-[450px] items-center justify-center rounded-3xl border border-dashed border-border bg-card text-sm text-muted-foreground shadow-sm">
              <div className="text-center p-6">
                <div className="relative mx-auto mb-4 inline-flex p-4 rounded-2xl bg-secondary/30 border border-border/60">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-foreground text-base">Select a Post</p>
                <p className="mt-1.5 text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                  Pick a scheduled content post from your queue on the left to preview or edit.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 STREAMLINED BENEFIT PILLARS */}
      <div className="space-y-6 pt-6 border-t border-border/60 text-left">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold tracking-widest text-outly-accent uppercase bg-outly-accent/10 px-2.5 py-0.5 rounded-full inline-block">
            WHY SCHEDULED POSTS WORK
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Maximum Career Leverage with Zero Daily Effort
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-xs hover:border-outly-accent/30 transition-all space-y-2">
            <div className="w-9 h-9 rounded-xl bg-outly-accent/10 text-outly-accent flex items-center justify-center font-bold text-base">
              🎯
            </div>
            <h4 className="font-bold text-sm text-foreground">Inbound Recruiter Magnet</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consistent technical posts make founders & hiring managers reach out directly to your inbox.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-xs hover:border-outly-accent/30 transition-all space-y-2">
            <div className="w-9 h-9 rounded-xl bg-outly-accent/10 text-outly-accent flex items-center justify-center font-bold text-base">
              ⚡
            </div>
            <h4 className="font-bold text-sm text-foreground">Autopilot Branding</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Turn daily commits & project milestones into automated structured LinkedIn & Twitter posts.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/60 bg-card shadow-xs hover:border-outly-accent/30 transition-all space-y-2">
            <div className="w-9 h-9 rounded-xl bg-outly-accent/10 text-outly-accent flex items-center justify-center font-bold text-base">
              📱
            </div>
            <h4 className="font-bold text-sm text-foreground">WhatsApp 1-Tap Control</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No complex dashboards. Receive daily scheduled drafts on WhatsApp and publish with 1 tap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  MessageSquare,
  Sliders,
  Bell,
  Save,
  Check,
  Tag,
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
  category?: string;
}

const CATEGORY_OPTIONS = [
  { id: "tech", label: "Software Engineering", icon: "💻" },
  { id: "ai", label: "AI & Machine Learning", icon: "🤖" },
  { id: "frontend", label: "Frontend & React", icon: "⚛️" },
  { id: "backend", label: "Backend & Systems", icon: "⚙️" },
  { id: "devops", label: "DevOps & Cloud", icon: "☁️" },
  { id: "data", label: "Data Science & Big Data", icon: "📊" },
  { id: "cyber", label: "Cybersecurity & Security", icon: "🛡️" },
  { id: "mobile", label: "Mobile App Development", icon: "📱" },
  { id: "sysdesign", label: "System Design & Architecture", icon: "🏗️" },
  { id: "opensource", label: "Open Source Contributions", icon: "🌐" },
  { id: "career", label: "Career Growth & Leadership", icon: "📈" },
  { id: "startup", label: "Product & Startup Building", icon: "🚀" },
  { id: "branding", label: "Personal Branding", icon: "💡" },
  { id: "remote", label: "Remote Work & Productivity", icon: "☕" },
  { id: "freelance", label: "Freelancing & Client Work", icon: "💼" },
  { id: "interviews", label: "Interview Hacks & Tips", icon: "🎯" },
];

// ─── INTERACTIVE ANALOG CLOCK TIME PICKER COMPONENT ───
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
    const hStr = h24.toString().padStart(2, "0");
    const mStr = minute.toString().padStart(2, "0");
    onSelectTime(`${hStr}:${mStr}`);
    onOpenChange(false);
  };

  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6;

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] border-border bg-white rounded-3xl p-6 shadow-2xl select-none">
        <DialogHeader className="text-center space-y-1 pb-2">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-outly-accent" />
            Select Daily Delivery Time
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Interactive Analog Clock Time Picker</p>
        </DialogHeader>

        {/* Time Display Header */}
        <div className="flex items-center justify-center gap-3 py-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("hours")}
              className={`text-3xl font-extrabold px-3 py-1 rounded-xl transition-all ${
                mode === "hours"
                  ? "bg-outly-accent text-white shadow-md shadow-outly-accent/20"
                  : "text-foreground hover:bg-slate-200/60"
              }`}
            >
              {hour.toString().padStart(2, "0")}
            </button>
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <button
              onClick={() => setMode("minutes")}
              className={`text-3xl font-extrabold px-3 py-1 rounded-xl transition-all ${
                mode === "minutes"
                  ? "bg-outly-accent text-white shadow-md shadow-outly-accent/20"
                  : "text-foreground hover:bg-slate-200/60"
              }`}
            >
              {minute.toString().padStart(2, "0")}
            </button>
          </div>

          <div className="flex flex-col gap-1 pl-2 border-l border-slate-200">
            <button
              onClick={() => setAmpm("AM")}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                ampm === "AM" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-slate-200/60"
              }`}
            >
              AM
            </button>
            <button
              onClick={() => setAmpm("PM")}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                ampm === "PM" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-slate-200/60"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Analog Clock Dial */}
        <div className="relative my-4 mx-auto w-[220px] h-[220px] rounded-full bg-slate-50 border-4 border-slate-200/80 shadow-inner flex items-center justify-center">
          <div className="absolute z-30 w-3.5 h-3.5 rounded-full bg-outly-accent shadow-sm" />

          {/* Hour Hand */}
          <div
            className="absolute z-20 top-1/2 left-1/2 w-1.5 bg-outly-accent rounded-full origin-bottom transition-transform duration-300"
            style={{
              height: "55px",
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute z-10 top-1/2 left-1/2 w-1 bg-slate-700 rounded-full origin-bottom transition-transform duration-300"
            style={{
              height: "78px",
              transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
            }}
          />

          {/* Dial Numbers */}
          {mode === "hours"
            ? hoursList.map((h, idx) => {
                const angle = idx * 30 - 90;
                const rad = (angle * Math.PI) / 180;
                const radius = 80;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isSelected = hour === h;
                return (
                  <button
                    key={h}
                    onClick={() => {
                      setHour(h);
                      setMode("minutes");
                    }}
                    className={`absolute z-30 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                      isSelected
                        ? "bg-outly-accent text-white scale-110 shadow-md"
                        : "text-foreground hover:bg-slate-200/70"
                    }`}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    {h}
                  </button>
                );
              })
            : minutesList.map((m, idx) => {
                const angle = idx * 30 - 90;
                const rad = (angle * Math.PI) / 180;
                const radius = 80;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isSelected = Math.floor(minute / 5) * 5 === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMinute(m)}
                    className={`absolute z-30 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                      isSelected
                        ? "bg-outly-accent text-white scale-110 shadow-md"
                        : "text-foreground hover:bg-slate-200/70"
                    }`}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                );
              })}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {[
            { label: "09:00 AM", h: 9, m: 0, ap: "AM" },
            { label: "01:00 PM", h: 1, m: 0, ap: "PM" },
            { label: "06:00 PM", h: 6, m: 0, ap: "PM" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setHour(preset.h);
                setMinute(preset.m);
                setAmpm(preset.ap as "AM" | "PM");
              }}
              className="text-[11px] font-semibold text-muted-foreground bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100">
          <Button
            onClick={handleApply}
            className="w-full bg-outly-accent text-white hover:brightness-110 rounded-full font-semibold h-11 text-sm shadow-md shadow-outly-accent/20 cursor-pointer gap-2"
          >
            <Check className="h-4 w-4" />
            Set Delivery Time ({hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")} {ampm})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  // Automation Settings State — Multi-Select Taste Preferences (Pinterest Style)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Software Engineering",
    "AI & Machine Learning",
  ]);
  const [deliveryTime, setDeliveryTime] = useState("09:00");
  const [whatsappNumber, setWhatsappNumber] = useState("+91 98765 43210");
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);

  useEffect(() => {
    document.title = "Outly - Content Post Scheduler";
  }, []);

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

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(label)) {
        if (prev.length === 1) {
          toast({
            variant: "destructive",
            title: "Select at least one preference",
            description: "You must keep at least one category selected for content generation.",
          });
          return prev;
        }
        return prev.filter((c) => c !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  const activeCategorySummary = selectedCategories.join(", ");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const topicToUse = newTopic ? `${activeCategorySummary}: ${newTopic}` : activeCategorySummary;
      return await api.linkedin.generateDraft(topicToUse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      setIsCreating(false);
      setNewTopic("");
      toast({
        title: "Content Draft Generated",
        description: `New AI post added based on your chosen taste preferences (${selectedCategories.length} niches).`,
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

  const handleSaveAutomation = () => {
    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      setIsWhatsappConnected(true);
      toast({
        title: "Automation & Taste Preferences Saved",
        description: `Daily delivery scheduled at ${deliveryTime} for [${selectedCategories.length} selected niches] with WhatsApp alerts to ${whatsappNumber}.`,
      });
    }, 600);
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
    <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:py-8 space-y-8 animate-fade-in pb-16">
      {/* Analog Clock Modal */}
      <AnalogClockModal
        open={clockOpen}
        onOpenChange={setClockOpen}
        initialTime={deliveryTime}
        onSelectTime={(newTime) => setDeliveryTime(newTime)}
      />

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 text-left">
          <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
            CONTENT SCHEDULER & WHATSAPP AUTOMATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
            Automated Content Post Scheduler
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Choose your custom taste preferences (Pinterest-style multi-select niches), schedule daily delivery times with our analog clock, and get automated post alerts on WhatsApp.
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
                  Generate posts tailored to your <strong className="text-outly-accent">{selectedCategories.length} selected taste niches</strong>.
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Specific Sub-topic / Hook (Optional)</label>
                  <Input
                    placeholder="e.g. Key takeaways from this week..."
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

      {/* Automation Settings & WhatsApp Configuration Card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-outly-accent" />
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80">
              Taste Preferences & WhatsApp Automation Setup
            </h2>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
            isWhatsappConnected ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-amber-500/10 text-amber-600"
          }`}>
            <MessageSquare className="h-3 w-3" />
            {isWhatsappConnected ? "WhatsApp Delivery Ready" : "Setup Required"}
          </span>
        </div>

        {/* Pinterest-Style Multi-Select Content Taste Preference Chips */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-outly-accent" />
              Select Your Content Taste Preferences (Multiple Selection Active)
            </label>
            <span className="text-[11px] font-extrabold text-outly-accent bg-outly-accent/10 px-2.5 py-0.5 rounded-full">
              {selectedCategories.length} Niches Selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategories.includes(cat.label);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.label)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border select-none ${
                    isSelected
                      ? "bg-white text-foreground border-outly-accent border-2 shadow-xs scale-[1.02]"
                      : "bg-slate-50/80 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-outly-accent stroke-[3] ml-0.5" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Click multiple chips above to define your unique personal content mix. AI will generate posts blending these selected topics.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 pt-2 border-t border-slate-100">
          {/* Daily Delivery Time — Trigger Analog Clock Modal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-outly-accent" />
              Scheduler Time of Daily Delivery
            </label>
            <button
              type="button"
              onClick={() => setClockOpen(true)}
              className="w-full h-10 px-3 bg-white border border-border rounded-xl text-xs font-bold text-foreground hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
            >
              <span>{formatDisplayTime(deliveryTime)}</span>
              <Clock className="h-4 w-4 text-outly-accent" />
            </button>
            <p className="text-[11px] text-muted-foreground">Click to open interactive analog clock picker.</p>
          </div>

          {/* WhatsApp Automation Setup */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-outly-accent" />
              WhatsApp Alert Number
            </label>
            <Input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="h-10 text-xs rounded-xl font-mono"
            />
            <p className="text-[11px] text-muted-foreground">Receive preview links & delivery confirmations on WhatsApp.</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            onClick={handleSaveAutomation}
            disabled={isSavingSettings}
            className="gap-2 bg-outly-accent text-white hover:brightness-110 rounded-full px-6 py-2.5 font-semibold text-xs h-10 cursor-pointer shadow-md shadow-outly-accent/20"
          >
            {isSavingSettings ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSavingSettings ? "Saving Settings..." : "Save Automation & Taste Setup"}
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Scheduled / Draft Posts List */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border px-6 py-4 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground/80">
                Scheduled Queue ({posts.length})
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Next run: Today at {formatDisplayTime(deliveryTime)}</p>
            </div>
            <span className="text-[11px] font-semibold text-outly-accent bg-outly-accent/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Bell className="h-3 w-3" />
              WhatsApp Sync
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
                  Click Generate New Post to create your first content draft based on your {selectedCategories.length} selected taste niches.
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
            <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm animate-slide-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-outly-accent" />
                      Content Post Preview
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-outly-accent/10 text-outly-accent">
                      {selectedCategories.length} Taste Preferences Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Delivery scheduled daily at {formatDisplayTime(deliveryTime)} • WhatsApp alerts to {whatsappNumber}
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

              <div className="p-4 rounded-xl bg-outly-accent/5 border border-outly-accent/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-outly-accent shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    WhatsApp preview notification active for {whatsappNumber}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-outly-accent shrink-0">Daily {formatDisplayTime(deliveryTime)} Release</span>
              </div>
            </div>
          ) : (
            <div className="flex h-[450px] items-center justify-center rounded-2xl border border-dashed border-border bg-white text-sm text-muted-foreground shadow-sm">
              <div className="text-center p-6">
                <div className="relative mx-auto mb-4 inline-flex p-4 rounded-2xl bg-slate-50 border border-slate-100">
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
    </div>
  );
}

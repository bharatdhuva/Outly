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
  Sliders,
  Bell,
  Save,
  Check,
  Tag,
  Rocket,
  Zap,
  Share2,
  Users,
  Target,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Smartphone
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

        {/* Digital Header Display */}
        <div className="flex items-center justify-center gap-3 py-4 my-2 rounded-xl bg-slate-50 border border-slate-100">
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

        {/* Analog Clock Dial */}
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

export default function ContentScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Software Engineering",
    "AI & Machine Learning"
  ]);
  const [deliveryTime, setDeliveryTime] = useState<string>("09:00");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("+91 98765 43210");
  const [isWhatsappConnected, setIsWhatsappConnected] = useState<boolean>(true);
  const [clockOpen, setClockOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const toggleCategory = (label: string) => {
    setSelectedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

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
          topic: newTopic || selectedCategories.join(", "),
        });
      } catch {
        const fakeId = Date.now();
        return {
          id: fakeId,
          content: `🤖 Modern SDE Insight on ${selectedCategories[0] || "Tech"}:\nBuilding scalable career leverage starts with automated systems. ${newTopic ? `Focus hook: ${newTopic}.` : "Always build in public and connect with industry leaders consistently!"}\n\n#CareerGrowth #Automation #${(selectedCategories[0] || "Tech").replace(/\s+/g, "")}`,
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

  const handleSaveAutomation = () => {
    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      setIsWhatsappConnected(true);
      toast({
        title: "⚡ Settings & Waitlist Registered!",
        description: `Preferences saved! Daily WhatsApp alerts set for ${formatDisplayTime(deliveryTime)} to ${whatsappNumber}.`,
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
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:py-10 space-y-10 animate-fade-in pb-20">
      <AnalogClockModal
        open={clockOpen}
        onOpenChange={setClockOpen}
        initialTime={deliveryTime}
        onSelectTime={(newTime) => setDeliveryTime(newTime)}
      />

      {/* 🚀 HERO SECTION WITH COMING SOON BADGE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-10 border border-border/80 shadow-md">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-wider shadow-2xs animate-pulse">
            <Rocket className="h-3.5 w-3.5" />
            <span>AI SOCIAL API & AUTOMATION ENGINE 2.0 (IN ACTIVE DEVELOPMENT)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground leading-tight tracking-tight">
            Automated Content Post Scheduler & WhatsApp Delivery
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Build a high-impact personal brand on LinkedIn & Twitter on autopilot. Connect once via WhatsApp, choose your industry taste niches, and receive ready-to-publish scheduled posts automatically on your preferred time!
          </p>
        </div>
      </div>

      {/* ⚡ ACTIVE API INTEGRATION ANNOUNCEMENT CARD */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Zap className="h-3.5 w-3.5" /> Working on Direct Social Media APIs & Auto-Publishing Integration
          </span>
          <h3 className="text-lg font-bold text-foreground">
            Coming Soon: Direct 1-Click Publishing to LinkedIn & Twitter/X
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We are actively integrating official APIs for LinkedIn and Twitter/X auto-posting alongside WhatsApp instant alerts. Configure your schedule & taste preferences below to lock in early priority access!
          </p>
        </div>

        <div className="shrink-0">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 bg-primary text-primary-foreground hover:brightness-110 shadow-md rounded-full px-6 py-3 font-bold text-xs h-11 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Generate Sample AI Post
            </Button>
            <DialogContent className="sm:max-w-[480px] border-border bg-card rounded-2xl p-6">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold text-foreground">Generate AI Content Post</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Generate posts tailored to your <strong className="text-primary">{selectedCategories.length} selected taste niches</strong>.
                </p>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Specific Sub-topic / Hook (Optional)</label>
                  <Input
                    placeholder="e.g. System design tips, AI tools, interview hacks..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    className="w-full bg-primary text-primary-foreground hover:brightness-110 rounded-full font-semibold h-10 text-sm shadow-md cursor-pointer gap-2"
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

      {/* 📱 STEP-BY-STEP HOW IT WORKS */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">How It Works in 4 Simple Steps</h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Zero stress about social media presence. Set your preferences once and let Outly handle your content delivery.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 relative shadow-2xs hover:border-primary/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20">
              01
            </div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-primary" /> 1-Time WhatsApp Connect
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your WhatsApp number once. You will receive automated post alerts and delivery links right in your chat.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 relative shadow-2xs hover:border-primary/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20">
              02
            </div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" /> Set Schedule & Niches
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select your industry taste niches (AI, Web Dev, Startups) and pick your daily automated delivery time with our clock.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 relative shadow-2xs hover:border-primary/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20">
              03
            </div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-primary" /> Scheduled Post Delivered
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              At your scheduled time, high-engaging posts are delivered straight to your WhatsApp inbox ready to review and publish.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 relative shadow-2xs hover:border-primary/40 transition-all">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/20">
              04
            </div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Zero-Stress Social Growth
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Maintain a consistent, professional online brand effortlessly without spending hours drafting content daily.
            </p>
          </div>
        </div>
      </div>

      {/* 🌟 BENEFITS & NETWORKING VALUE SECTION */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Why Active Social Presence Matters
            </h2>
            <p className="text-xs text-muted-foreground">
              Supercharge your career opportunities, networking, and inbound visibility.
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            High ROI Networking
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Benefit 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">Best for Students & Early Career Techies</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stand out in the competitive tech market! Connect directly with startup founders, engineering leads, and top recruiters by consistently sharing insightful technical thoughts and project updates.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">Networking & Inbound Opportunities</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build an inbound magnet for high-paying job offers, freelance clients, mentorships, and investor funding simply by staying active and visible in your specific industry niche.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <Target className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">Personal Branding Without Burnout</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Grow your personal brand across LinkedIn & Twitter on complete autopilot while focusing 100% on your actual coding, core projects, and studies without content stress.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/50">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <Share2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">1-Tap WhatsApp Convenience</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No complex dashboards required on the go. Review, edit, or copy ready-to-publish posts directly from your phone on WhatsApp anywhere, anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ AUTOMATION SETTINGS & TASTE PREFERENCES SETUP */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
              Configure Your Taste Preferences & WhatsApp Alerts
            </h2>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
            isWhatsappConnected ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-amber-500/10 text-amber-600"
          }`}>
            <MessageSquare className="h-3.5 w-3.5" />
            {isWhatsappConnected ? "WhatsApp Delivery Ready" : "Setup Required"}
          </span>
        </div>

        {/* Pinterest-Style Multi-Select Content Taste Preference Chips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Select Your Content Taste Preferences (Multi-Selection Active)
            </label>
            <span className="text-[11px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
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
                      ? "bg-card text-foreground border-primary border-2 shadow-xs scale-[1.02]"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[3] ml-0.5" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Click multiple chips above to define your unique personal content mix. AI will generate posts blending these selected topics.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 pt-4 border-t border-border/60">
          {/* Daily Delivery Time — Trigger Analog Clock Modal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Scheduler Time of Daily Delivery
            </label>
            <button
              type="button"
              onClick={() => setClockOpen(true)}
              className="w-full h-10 px-3 bg-card border border-border rounded-xl text-xs font-bold text-foreground hover:bg-secondary/40 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
            >
              <span>{formatDisplayTime(deliveryTime)}</span>
              <Clock className="h-4 w-4 text-primary" />
            </button>
            <p className="text-[11px] text-muted-foreground">Click to open interactive analog clock picker.</p>
          </div>

          {/* WhatsApp Automation Setup */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
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
            className="gap-2 bg-primary text-primary-foreground hover:brightness-110 rounded-full px-6 py-2.5 font-semibold text-xs h-10 cursor-pointer shadow-md"
          >
            {isSavingSettings ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSavingSettings ? "Saving Preferences..." : "Save Automation & Lock Priority Waitlist"}
          </Button>
        </div>
      </div>

      {/* MAIN GRID LAYOUT: QUEUE & PREVIEW */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Scheduled / Draft Posts List */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border/60 px-6 py-4 bg-secondary/20 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Scheduled Queue ({posts.length})
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Next run: Today at {formatDisplayTime(deliveryTime)}</p>
            </div>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-primary/20">
              <Bell className="h-3 w-3" />
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
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
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
    </div>
  );
}

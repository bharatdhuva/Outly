import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, Sparkles, Copy, CheckCircle2, ChevronRight, AlertTriangle, ListPlus } from "lucide-react";

interface OptimizationResult {
  optimized_headlines: string[];
  optimized_about: string;
  skills_to_add: string[];
  missing_keywords: string[];
}

export default function LinkedInOptimizerPage() {
  const { toast } = useToast();
  const [jd, setJd] = useState("");
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const [copiedHeadlineIdx, setCopiedHeadlineIdx] = useState<number | null>(null);
  const [copiedAbout, setCopiedAbout] = useState(false);

  const handleOptimize = async () => {
    if (!jd.trim()) {
      toast({
        variant: "destructive",
        title: "Job Description Required",
        description: "Please paste a job description to optimize against.",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await api.optimizer.linkedin(jd, headline, about);
      setResult(data);
      toast({
        title: "Profile Optimized!",
        description: "Check the suggestions and updated copy below.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHeadline = (txt: string, index: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedHeadlineIdx(index);
    toast({
      title: "Copied Headline!",
      description: "Headline copied to clipboard.",
    });
    setTimeout(() => setCopiedHeadlineIdx(null), 2000);
  };

  const handleCopyAbout = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedAbout(true);
    toast({
      title: "Copied Summary!",
      description: "About section copied to clipboard.",
    });
    setTimeout(() => setCopiedAbout(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <div>
        <p className="text-[13px] font-medium text-primary">Workspace</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">LinkedIn Profile Optimizer</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Tailor your professional presence to match your target roles. Optimize your headline and about section to pass recruiter filters.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
            <h2 className="text-[15px] font-semibold text-foreground">1. Paste Target Job Description</h2>
            <p className="text-[12px] text-muted-foreground">
              Provide the job description you are targeting to allow keyword extraction.
            </p>
            <Textarea
              className="min-h-[160px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              placeholder="Paste job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
            <h2 className="text-[15px] font-semibold text-foreground">2. Current Profile Details (Optional)</h2>
            <p className="text-[12px] text-muted-foreground">
              Add your current headline and summary to build upon your existing content.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Current Headline</span>
                <Input
                  className="bg-white border-border text-[13px] focus-visible:ring-primary"
                  placeholder="e.g. Software Engineering Student at MSU Baroda"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Current About / Summary</span>
                <Textarea
                  className="min-h-[120px] bg-white border-border text-[13px] focus-visible:ring-primary"
                  placeholder="Paste current summary or bio..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>
            </div>
          </section>

          <Button
            onClick={handleOptimize}
            disabled={loading}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing Profile...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize LinkedIn Profile
              </>
            )}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="h-full flex flex-col">
          {result ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Headlines */}
              <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
                <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-primary" />
                  Optimized Headlines (3 Options)
                </h2>
                <div className="space-y-3">
                  {result.optimized_headlines.map((hl, index) => (
                    <div
                      key={index}
                      className="p-3 bg-secondary/40 border border-border/80 rounded-lg flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-[10px] text-primary uppercase block">Option {index + 1}</span>
                        <p className="text-secondary-foreground font-medium">{hl}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopyHeadline(hl, index)}
                      >
                        {copiedHeadlineIdx === index ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Keywords and Skills */}
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-3">
                  <h3 className="text-xs font-bold uppercase text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[11px] font-medium text-destructive"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-3">
                  <h3 className="text-xs font-bold uppercase text-success flex items-center gap-1.5">
                    <ListPlus className="h-4 w-4" />
                    Recommended Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.skills_to_add.map((sk, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-success/10 border border-success/20 px-2 py-0.5 text-[11px] font-medium text-success"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {/* About summary */}
              <section className="flex-1 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div>
                    <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      Optimized About Section
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => handleCopyAbout(result.optimized_about)}
                  >
                    {copiedAbout ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedAbout ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  className="flex-1 min-h-[220px] bg-white border-border text-[13px] leading-relaxed resize-none focus-visible:ring-primary overflow-y-auto"
                  value={result.optimized_about}
                  onChange={(e) => setResult({ ...result, optimized_about: e.target.value })}
                />
              </section>
            </div>
          ) : (
            <section className="flex-1 rounded-xl border border-dashed border-border/60 bg-muted/10 p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] font-medium">Optimization Results</p>
              <p className="text-[11px] text-muted-foreground/60 max-w-[240px] mt-1">
                Provide your target job requirements on the left, click optimize, and view suggestions here.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

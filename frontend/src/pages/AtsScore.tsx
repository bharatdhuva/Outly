import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Loader2, UploadCloud, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface EvaluationResult {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
}

export default function AtsScorePage() {
  const { toast } = useToast();
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      toast({
        variant: "destructive",
        title: "Unsupported File",
        description: "Please upload a .txt file, or copy-paste your resume directly.",
      });
      return;
    }

    try {
      const text = await file.text();
      setResume(text);
      toast({
        title: "Resume Loaded",
        description: "Successfully read text from file.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error Reading File",
        description: String(err),
      });
    }
  };

  const checkScore = async () => {
    if (!resume.trim()) {
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please paste your resume text or upload a file.",
      });
      return;
    }
    if (!jd.trim()) {
      toast({
        variant: "destructive",
        title: "Job Description Required",
        description: "Please paste the job description to match against.",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await api.ats.score(resume, jd);
      setResult(data);
      toast({
        title: "Evaluation Complete",
        description: `ATS Match Score: ${data.score}/100`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Evaluation Failed",
        description: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) return "text-success stroke-success";
    if (score >= 41) return "text-warning stroke-warning";
    return "text-destructive stroke-destructive";
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <div>
        <p className="text-[13px] font-medium text-primary">ATS Optimizer</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">ATS Resume Score Checker</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Compare your resume against any Job Description using AI. Identify missing keyword gaps and receive actionable feedback instantly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">1. Paste Resume</h2>
            <p className="text-[13px] text-muted-foreground mb-2">Paste raw text or upload a .txt file.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[12px] h-8"
                onClick={() => document.getElementById("resume-upload")?.click()}
              >
                <UploadCloud className="h-4.5 w-4.5" />
                Upload .txt
              </Button>
              <input
                id="resume-upload"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <Textarea
            className="min-h-[220px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            placeholder="Paste resume details, experience, skills, and summary..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">2. Paste Job Description</h2>
            <p className="text-[13px] text-muted-foreground mb-2">Include role specifics, key qualifications, and tech requirements.</p>
            <div className="h-8" /> {/* spacing alignment */}
          </div>
          <Textarea
            className="min-h-[220px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            placeholder="Paste job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </section>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={checkScore}
          disabled={loading}
          size="lg"
          className="px-8 bg-primary text-primary-foreground hover:bg-primary/95 min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning Resume...
            </>
          ) : (
            "Check ATS Score"
          )}
        </Button>
      </div>

      {result && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-6 animate-slide-up">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6 border-b border-border/40 pb-6">
            {/* Score Ring indicator */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className={`fill-none transition-all duration-1000 ${getScoreColor(result.score)}`}
                  strokeWidth="8"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * result.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-[28px] font-bold tracking-tight text-foreground">{result.score}</span>
                <span className="block text-[11px] font-semibold text-muted-foreground uppercase">Score</span>
              </div>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-[18px] font-bold text-foreground">Resume Evaluation Metrics</h2>
              <p className="text-[13px] text-muted-foreground leading-5">
                Our AI compared your background against the JD keywords and structure constraints. Ideal scores for bypass are generally 75+.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Missing Keywords ({result.missing_keywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_keywords.length === 0 ? (
                  <span className="text-[13px] text-muted-foreground">None found. Nice match!</span>
                ) : (
                  result.missing_keywords.map((kw, i) => (
                    <span key={i} className="rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-[12px] font-medium text-destructive">
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />
                Matched Keywords ({result.matched_keywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.matched_keywords.length === 0 ? (
                  <span className="text-[13px] text-muted-foreground">None found yet. Try adding key SDE/role terms.</span>
                ) : (
                  result.matched_keywords.map((kw, i) => (
                    <span key={i} className="rounded-full bg-success/10 border border-success/20 px-2.5 py-1 text-[12px] font-medium text-success">
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 pt-5 space-y-3">
            <h3 className="text-[14px] font-semibold text-foreground">Actionable Suggestions</h3>
            <ol className="list-decimal list-inside space-y-2 text-[13px] text-muted-foreground leading-6">
              {result.suggestions.map((suggestion, i) => (
                <li key={i} className="pl-1">
                  <span className="text-foreground">{suggestion}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={checkScore} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Rescan Resume
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

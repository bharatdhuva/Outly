import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, EvaluationResult } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Check,
  Info,
  AlertCircle
} from "lucide-react";

export default function AtsScorePage() {
  const { toast } = useToast();
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Vault integration state
  const [selectedVaultId, setSelectedVaultId] = useState<string>("custom");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [savingResume, setSavingResume] = useState(false);

  // Fetch resumes from the Resume Vault
  const { data: resumes = [], refetch: refetchResumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: api.resume.list,
  });

  // Automatically load default resume if present
  useEffect(() => {
    if (resumes.length > 0 && !resume) {
      const defaultResume = resumes.find(r => r.is_default === 1);
      if (defaultResume && defaultResume.content) {
        setResume(defaultResume.content);
        setSelectedVaultId(String(defaultResume.id));
      }
    }
  }, [resumes]);

  const handleVaultSelect = (idStr: string) => {
    setSelectedVaultId(idStr);
    if (idStr === "custom") {
      setResume("");
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResume(found.content);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "pdf" && ext !== "docx") {
      toast({
        variant: "destructive",
        title: "Unsupported File",
        description: "Please upload a .txt, .pdf, or .docx file.",
      });
      return;
    }

    setParsingFile(true);
    try {
      const data = await api.ats.parseFile(file);
      setResume(data.content);
      setSelectedVaultId("custom");
      toast({
        title: "File Read Successfully",
        description: `Extracted text from ${file.name}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error Reading File",
        description: String(err),
      });
    } finally {
      setParsingFile(false);
    }
  };

  const saveToVault = async () => {
    if (!resume.trim()) return;
    if (!saveLabel.trim()) {
      toast({
        variant: "destructive",
        title: "Label Required",
        description: "Please provide a descriptive label for this resume selection.",
      });
      return;
    }

    setSavingResume(true);
    try {
      const filename = `ats_${saveLabel.toLowerCase().replace(/[^a-z0-9]/g, "_")}.txt`;
      await api.resume.create({
        filename,
        label: saveLabel,
        content: resume,
        is_default: false
      });
      toast({
        title: "Saved to Vault",
        description: `Saved "${saveLabel}" to your Resume Vault.`,
      });
      setShowSaveDialog(false);
      setSaveLabel("");
      refetchResumes();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Save",
        description: String(err),
      });
    } finally {
      setSavingResume(false);
    }
  };

  const checkScore = async () => {
    if (!resume.trim()) {
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please paste your resume text, upload a file, or choose one from the vault.",
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
        title: "Scan Completed",
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

  const getScoreColorClass = (score: number) => {
    if (score >= 75) return "text-success stroke-success";
    if (score >= 50) return "text-warning stroke-warning";
    return "text-destructive stroke-destructive";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 75) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  const getSeniorityBadgeColor = (status?: "Good" | "Fair" | "Poor" | string) => {
    if (status === "Good") return "bg-success/15 text-success border-success/20";
    if (status === "Fair") return "bg-warning/15 text-warning border-warning/20";
    return "bg-destructive/15 text-destructive border-destructive/20";
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in pb-12">
      <div>
        <p className="text-[13px] font-medium text-primary uppercase tracking-wider">ATS Optimization Suite</p>
        <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-foreground">ATS Resume Score Checker</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Compare your resume against any target Job Description. Our SRE/SDE-calibrated AI highlights missing hard/soft skills, assesses seniority fit, identifies layout parser bottlenecks, and guides you to 80+ matching score.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Side: Paste Resume */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
            <div>
              <h2 className="text-[16px] font-semibold text-foreground">1. Resume Input Source</h2>
              <p className="text-[13px] text-muted-foreground">Upload file (.pdf, .docx, .txt) or select from vault.</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[12px] h-8.5 shrink-0"
                onClick={() => document.getElementById("resume-upload")?.click()}
                disabled={parsingFile}
              >
                {parsingFile ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5" />
                )}
                Upload Doc
              </Button>
              <input
                id="resume-upload"
                type="file"
                accept=".txt,.pdf,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />

              <select
                className="flex h-8.5 w-full sm:w-[170px] rounded-md border border-input bg-background px-2.5 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={selectedVaultId}
                onChange={(e) => handleVaultSelect(e.target.value)}
              >
                <option value="custom">✍️ Custom/Paste Text</option>
                {resumes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    💼 {r.label} ({r.filename.split(".").pop()?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <Textarea
              className="min-h-[260px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              placeholder="Paste the full text of your resume here, or choose a file above..."
              value={resume}
              onChange={(e) => {
                setResume(e.target.value);
                setSelectedVaultId("custom");
              }}
            />
            {resume.trim() && (
              <button
                type="button"
                onClick={() => setShowSaveDialog(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-secondary/80 hover:bg-secondary border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground transition"
              >
                <Save className="h-3.5 w-3.5 text-muted-foreground" />
                Save to Vault
              </button>
            )}
          </div>

          {/* Quick Dialog to Save Resume to Vault Inline */}
          {showSaveDialog && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-foreground">Save Resume Selection</span>
                <span className="text-[10px] text-muted-foreground">Will be saved to Resume Vault</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SDE-2 Resume (Updated)"
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-[12px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                />
                <Button size="sm" className="h-8 text-[11px]" disabled={savingResume} onClick={saveToVault}>
                  {savingResume && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-[11px]" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Right Side: Paste Job Description */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">2. Target Job Description</h2>
            <p className="text-[13px] text-muted-foreground">Paste requirements, qualifications, and stack specifics.</p>
          </div>
          <Textarea
            className="min-h-[260px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            placeholder="Paste target job description details here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </section>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={checkScore}
          disabled={loading || parsingFile}
          size="lg"
          className="px-10 bg-primary text-primary-foreground hover:bg-primary/95 min-w-[220px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing with SRE AI...
            </>
          ) : (
            "Check ATS Match Score"
          )}
        </Button>
      </div>

      {result && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-8 animate-slide-up">
          {/* Header overall score banner */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8 border-b border-border/40 pb-6">
            {/* SVG radial dial */}
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted fill-none"
                  strokeWidth="8.5"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className={`fill-none transition-all duration-1000 ${getScoreColorClass(result.score)}`}
                  strokeWidth="8.5"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * result.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-[32px] font-extrabold tracking-tight text-foreground">{result.score}</span>
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-[-2px]">Score</span>
              </div>
            </div>

            {/* Score breakdown metrics */}
            <div className="flex-1 space-y-4 w-full">
              <div className="text-center md:text-left space-y-1">
                <h2 className="text-[20px] font-bold text-foreground">ATS Score Breakdown</h2>
                <p className="text-[13px] text-muted-foreground">
                  Your resume score was calculated across four essential Applicant Tracking System dimensions.
                </p>
              </div>

              {result.breakdown && (
                <div className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[12px] font-semibold">
                      <span className="text-muted-foreground">Technical Skills Match</span>
                      <span className="text-foreground">{result.breakdown.skills_match}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getScoreProgressColor(result.breakdown.skills_match)}`}
                        style={{ width: `${result.breakdown.skills_match}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[12px] font-semibold">
                      <span className="text-muted-foreground">Experience Alignment</span>
                      <span className="text-foreground">{result.breakdown.experience_match}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getScoreProgressColor(result.breakdown.experience_match)}`}
                        style={{ width: `${result.breakdown.experience_match}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[12px] font-semibold">
                      <span className="text-muted-foreground">Format Readability (Parser friendly)</span>
                      <span className="text-foreground">{result.breakdown.formatting_readability}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getScoreProgressColor(result.breakdown.formatting_readability)}`}
                        style={{ width: `${result.breakdown.formatting_readability}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[12px] font-semibold">
                      <span className="text-muted-foreground">Impact & Quantified Metrics</span>
                      <span className="text-foreground">{result.breakdown.impact_metrics}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${getScoreProgressColor(result.breakdown.impact_metrics)}`}
                        style={{ width: `${result.breakdown.impact_metrics}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seniority analysis section */}
          {result.experience_analysis && (
            <div className="rounded-lg border border-border/80 bg-secondary/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-foreground">Seniority Fit Matcher:</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getSeniorityBadgeColor(result.experience_analysis.seniority_match)}`}>
                  {result.experience_analysis.seniority_match} Match
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-6">
                {result.experience_analysis.comments}
              </p>
            </div>
          )}

          {/* Missing Keywords Panels */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Missing Keywords Column */}
            <div className="space-y-4">
              <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
                Missing Critical Keywords
              </h3>

              {/* If missing_keywords is structured as an object */}
              {typeof result.missing_keywords === "object" && !Array.isArray(result.missing_keywords) ? (
                <div className="space-y-3.5">
                  {result.missing_keywords.hard_skills?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Hard Skills / Domain</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missing_keywords.hard_skills.map((kw, i) => (
                          <span key={i} className="rounded-md bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-[12px] font-medium text-destructive">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missing_keywords.tools_technologies?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Tools / Technologies</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missing_keywords.tools_technologies.map((kw, i) => (
                          <span key={i} className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[12px] font-medium text-amber-600 dark:text-amber-500">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missing_keywords.soft_skills?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Soft Skills / Execution</span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missing_keywords.soft_skills.map((kw, i) => (
                          <span key={i} className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[12px] font-medium text-blue-600 dark:text-blue-500">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!result.missing_keywords.hard_skills?.length &&
                    !result.missing_keywords.tools_technologies?.length &&
                    !result.missing_keywords.soft_skills?.length) && (
                    <span className="text-[13px] text-muted-foreground block">Zero keyword gaps. Your resume contains excellent keyword matching!</span>
                  )}
                </div>
              ) : (
                /* Fallback if missing_keywords is flat array */
                <div className="flex flex-wrap gap-1.5">
                  {(result.missing_keywords as string[]).length === 0 ? (
                    <span className="text-[13px] text-muted-foreground">Zero keyword gaps. Nice match!</span>
                  ) : (
                    (result.missing_keywords as string[]).map((kw, i) => (
                      <span key={i} className="rounded-md bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-[12px] font-medium text-destructive">
                        {kw}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Matched Keywords Column */}
            <div className="space-y-4">
              <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <CheckCircle className="h-4.5 w-4.5 text-success" />
                Successfully Matched Keywords ({result.matched_keywords.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.matched_keywords.length === 0 ? (
                  <span className="text-[13px] text-muted-foreground">No matches found yet. Incorporate target terms from the JD to build matches.</span>
                ) : (
                  result.matched_keywords.map((kw, i) => (
                    <span key={i} className="rounded-md bg-success/10 border border-success/20 px-2.5 py-1 text-[12px] font-medium text-success flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Formatting alerts / warnings */}
          {result.formatting_issues && result.formatting_issues.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 space-y-2">
              <h3 className="text-[13px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                ATS Parser Formatting Warnings ({result.formatting_issues.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-[12.5px] text-muted-foreground leading-5">
                {result.formatting_issues.map((issue, i) => (
                  <li key={i} className="pl-1">
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Suggestions */}
          <div className="border-t border-border/40 pt-5 space-y-3.5">
            <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-primary" />
              Actionable Fixes (Optimizations)
            </h3>
            <ol className="list-decimal list-inside space-y-3.5 text-[13.5px] text-muted-foreground leading-6">
              {result.suggestions.map((suggestion, i) => (
                <li key={i} className="pl-1">
                  <span className="text-foreground font-medium">{suggestion}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={checkScore} disabled={loading} className="gap-2 text-[13px] h-9">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Rescan Resume
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

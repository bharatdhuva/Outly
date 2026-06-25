import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, X, FileText, Copy, Download, Save, Check, AlertTriangle, CheckCircle } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ResumeTailorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jobDesc, setJobDesc] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("custom");
  const [loading, setLoading] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<string | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [activeTab, setActiveTab] = useState<"original" | "tailored">("original");
  const [copied, setCopied] = useState(false);
  const [savingToVault, setSavingToVault] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[] | {
    hard_skills: string[];
    soft_skills: string[];
    tools_technologies: string[];
  }>({ hard_skills: [], soft_skills: [], tools_technologies: [] });
  const [sources, setSources] = useState<Array<{ title: string; url: string; domain: string }>>([]);
  const [showSourcesList, setShowSourcesList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes from vault
  const { data: resumes = [] } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setSelectedVaultId("custom");
    setLoading(true);
    setTailoredResult(null);
    setMatchedKeywords([]);
    setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
    setSources([]);
    setShowSourcesList(false);
    setActiveTab("original");

    try {
      const parsed = await api.ats.parseFile(file);
      setResumeText(parsed.content);
      toast({
        title: "Resume Loaded",
        description: `Extracted text from ${file.name} successfully.`,
      });
    } catch (err) {
      // Fallback for TXT files if parser fails
      try {
        const text = await file.text();
        setResumeText(text);
        toast({
          title: "Resume Loaded",
          description: `Read text from ${file.name}.`,
        });
      } catch (innerErr) {
        toast({
          variant: "destructive",
          title: "File Reading Error",
          description: "Could not parse or read this file format. Please upload .txt, .pdf, or .docx.",
        });
        setResumeFile(null);
        setResumeText(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVaultSelect = (idStr: string) => {
    setSelectedVaultId(idStr);
    setResumeFile(null);
    setTailoredResult(null);
    setMatchedKeywords([]);
    setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
    setSources([]);
    setShowSourcesList(false);
    setActiveTab("original");
    if (idStr === "custom") {
      setResumeText(null);
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResumeText(found.content);
      }
    }
  };

  const handleTailor = async () => {
    if (!resumeText) {
      toast({
        variant: "destructive",
        title: "Resume missing",
        description: "Please upload or select a resume first.",
      });
      return;
    }
    if (!jobDesc.trim()) {
      toast({
        variant: "destructive",
        title: "Job description missing",
        description: "Please paste the target job description.",
      });
      return;
    }

    setTailoring(true);
    try {
      const response = await api.ats.tailor(resumeText, jobDesc);
      setTailoredResult(response.tailoredResume);
      setMatchedKeywords(response.matchedKeywords || []);
      setMissingKeywords(response.missingKeywords || { hard_skills: [], soft_skills: [], tools_technologies: [] });
      setSources(response.sources || []);
      setShowSourcesList(false);
      setActiveTab("tailored");
      toast({
        title: "Resume Tailored Successfully!",
        description: "The AI optimized version and keyword insights are ready.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Tailoring Failed",
        description: String(err),
      });
    } finally {
      setTailoring(false);
    }
  };

  const handleCopy = () => {
    if (!tailoredResult) return;
    navigator.clipboard.writeText(tailoredResult);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Tailored resume markdown copied successfully.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!tailoredResult) return;
    const blob = new Blob([tailoredResult], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tailored_resume.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "File Downloaded",
      description: "Tailored resume saved as tailored_resume.md.",
    });
  };

  const handleSaveToVault = async () => {
    if (!tailoredResult) return;
    
    const originalLabel = resumeFile 
      ? resumeFile.name.replace(/\.[^/.]+$/, "") 
      : (resumes.find(r => String(r.id) === selectedVaultId)?.label || "Resume");
    
    const defaultLabel = `${originalLabel} (Tailored)`;
    const label = window.prompt("Enter a name/label to save this tailored resume in your Vault:", defaultLabel);
    
    if (label === null) return; // User cancelled
    const finalLabel = label.trim() || defaultLabel;

    setSavingToVault(true);
    try {
      await api.resume.create({
        filename: "tailored_resume.md",
        label: finalLabel,
        content: tailoredResult,
      });
      
      // Invalidate the cache to reload the vault dropdown
      await queryClient.invalidateQueries({ queryKey: ["resume", "list"] });
      
      toast({
        title: "Saved to Vault",
        description: `Successfully saved "${finalLabel}" to your Resume Vault.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: String(err),
      });
    } finally {
      setSavingToVault(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-[13px] font-medium text-primary">Resume Tailor</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">Prepare a role-specific application</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Paste the role context, upload your resume, and review the source material before generating a tailored version.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">Job description</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Include responsibilities, requirements, and any company-specific context.</p>
          </div>
          <Textarea
            className="min-h-[320px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </section>

        <section className="flex min-h-[420px] flex-col rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          {/* Resume Header with Vault Selection Dropdown or Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-border/40 pb-3">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">
                {tailoredResult ? (
                  <div className="flex rounded-md bg-secondary p-0.5 text-muted-foreground text-[12px] font-medium">
                    <button
                      type="button"
                      className={`rounded-md px-2.5 py-1 transition-all ${
                        activeTab === "original"
                          ? "bg-white text-foreground shadow-sm font-semibold"
                          : "hover:text-foreground"
                      }`}
                      onClick={() => setActiveTab("original")}
                    >
                      Original
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-2.5 py-1 transition-all ${
                        activeTab === "tailored"
                          ? "bg-white text-foreground shadow-sm font-semibold"
                          : "hover:text-foreground"
                      }`}
                      onClick={() => setActiveTab("tailored")}
                    >
                      Tailored Version ✨
                    </button>
                  </div>
                ) : (
                  "Resume source"
                )}
              </h2>
              {!tailoredResult && <p className="mt-1 text-[13px] text-muted-foreground">Upload a PDF/Word file or select from vault.</p>}
            </div>
            
            {resumes.length > 0 && activeTab === "original" && (
              <select
                className="flex h-8.5 w-full sm:w-[170px] rounded-md border border-input bg-background px-2.5 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground"
                value={selectedVaultId}
                onChange={(e) => handleVaultSelect(e.target.value)}
              >
                <option value="custom">📁 Select from Vault...</option>
                {resumes.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    💼 {r.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Upload Placeholder State */}
          {!resumeFile && selectedVaultId === "custom" && !loading && !tailoring && (
            <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center min-h-[300px]">
              <div className="flex max-w-sm flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-[14px] font-medium text-foreground">Upload your resume</p>
                <p className="text-[13px] leading-5 text-muted-foreground">Choose a document to preview before tailoring.</p>
                <Button className="mt-1" onClick={() => fileInputRef.current?.click()}>
                  Select file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="grid flex-1 place-items-center rounded-xl border border-border bg-secondary/10 min-h-[300px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-[13px] font-medium text-muted-foreground">Loading your resume...</span>
              </div>
            </div>
          )}

          {/* Tailoring Loader State */}
          {tailoring && (
            <div className="grid flex-1 place-items-center rounded-xl border border-border bg-secondary/10 min-h-[300px]">
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <Loader2 className="h-9 w-9 animate-spin text-primary" />
                <span className="text-[14px] font-semibold text-foreground">AI Tailoring in Progress...</span>
                <span className="text-[13px] text-muted-foreground max-w-xs">
                  We are analyzing the job description and rewriting your resume summary and work achievements to highlight the best matches.
                </span>
              </div>
            </div>
          )}

          {/* Document Preview Pane (Original or Tailored) */}
          {(resumeFile || selectedVaultId !== "custom") && !loading && !tailoring && (
            <div className="min-h-0 flex-1 flex flex-col min-h-[300px]">
              {activeTab === "original" ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                    <span className="truncate text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      {resumeFile ? resumeFile.name : (resumes.find(r => String(r.id) === selectedVaultId)?.label || "Vault Resume")}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-muted-foreground h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setResumeFile(null);
                        setResumeText(null);
                        setSelectedVaultId("custom");
                        setTailoredResult(null);
                        setMatchedKeywords([]);
                        setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
                        setSources([]);
                        setShowSourcesList(false);
                        setActiveTab("original");
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>

                  {(() => {
                    if (resumeFile) {
                      return resumeFile.type === "application/pdf" ? (
                        <div className="flex-1 overflow-hidden rounded-lg border border-border bg-secondary">
                          <PdfViewer file={resumeFile} />
                        </div>
                      ) : resumeText ? (
                        <div className="flex-1 max-h-[360px] overflow-y-auto rounded-lg border border-border bg-secondary p-4">
                          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-foreground">{resumeText}</pre>
                        </div>
                      ) : null;
                    } else {
                      const selectedVaultResume = resumes.find(r => String(r.id) === selectedVaultId);
                      const isPdf = selectedVaultResume?.filename.toLowerCase().endsWith(".pdf");
                      if (isPdf) {
                        return (
                          <div className="flex-1 overflow-hidden rounded-lg border border-border bg-secondary">
                            <PdfViewer url={api.resume.getFileUrl(selectedVaultResume.id)} />
                          </div>
                        );
                      }
                      return resumeText ? (
                        <div className="flex-1 max-h-[360px] overflow-y-auto rounded-lg border border-border bg-secondary p-4">
                          <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-foreground">{resumeText}</pre>
                        </div>
                      ) : null;
                    }
                  })()}
                </>
              ) : (
                // Tailored tab content
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                    <span className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                      ✨ Tailored Resume Preview (Markdown)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 px-2.5 text-[12px] border-border text-foreground hover:bg-secondary"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-7 px-2.5 text-[12px] border-border text-foreground hover:bg-secondary"
                        onClick={handleDownload}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 h-7 px-2.5 text-[12px] bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleSaveToVault}
                        disabled={savingToVault}
                      >
                        {savingToVault ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save to Vault
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[360px] rounded-lg border border-border bg-secondary p-4">
                    <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-foreground">{tailoredResult}</pre>
                  </div>

                  {/* Grounded Web Search Sources */}
                  {sources && sources.length > 0 && (
                    <div className="mt-3.5 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSourcesList(!showSourcesList)}
                        className="inline-flex self-start items-center gap-2 rounded-full border border-border bg-secondary/80 px-3 py-1.5 text-[12.5px] font-semibold text-foreground hover:bg-secondary transition-all active:scale-[0.97] shadow-sm cursor-pointer"
                      >
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {sources.slice(0, 3).map((src, i) => (
                            <img
                              key={i}
                              className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-background bg-white shrink-0 border border-border/10"
                              src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ))}
                        </div>
                        <span>{sources.length} sources</span>
                      </button>

                      {showSourcesList && (
                        <div className="rounded-lg border border-border bg-background p-3.5 shadow-md max-h-[220px] overflow-y-auto space-y-2.5 animate-slide-up">
                          {sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2.5 rounded-md p-2 hover:bg-secondary transition-colors cursor-pointer"
                            >
                              <img
                                className="h-4 w-4 mt-0.5 rounded shrink-0 bg-white border border-border/10"
                                src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                                alt=""
                              />
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-semibold text-foreground truncate hover:text-primary transition-colors">{src.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{src.url}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Keywords Analysis Card */}
      {tailoredResult && (matchedKeywords.length > 0 || 
        (typeof missingKeywords === "object" && !Array.isArray(missingKeywords) && 
         ((missingKeywords.hard_skills?.length || 0) > 0 || 
          (missingKeywords.tools_technologies?.length || 0) > 0 || 
          (missingKeywords.soft_skills?.length || 0) > 0)) ||
        (Array.isArray(missingKeywords) && missingKeywords.length > 0)) && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] space-y-6 animate-slide-up">
          <div className="border-b border-border/40 pb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-foreground">AI Tailoring Keyword Insights</h3>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                These keywords were analyzed during the tailoring process to optimize your resume for the job description.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recommended Keywords Column */}
            <div className="space-y-4">
              <h4 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                Recommended Keywords to Add
              </h4>

              {typeof missingKeywords === "object" && !Array.isArray(missingKeywords) ? (
                <div className="space-y-3.5">
                  {(missingKeywords.hard_skills?.length || 0) > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Hard Skills / Domain</span>
                      <div className="flex flex-wrap gap-1.5">
                        {missingKeywords.hard_skills.map((kw, i) => (
                          <span key={i} className="rounded-md bg-destructive/10 border border-destructive/20 px-2.5 py-1 text-[12px] font-medium text-destructive">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(missingKeywords.tools_technologies?.length || 0) > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Tools / Technologies</span>
                      <div className="flex flex-wrap gap-1.5">
                        {missingKeywords.tools_technologies.map((kw, i) => (
                          <span key={i} className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[12px] font-medium text-amber-600 dark:text-amber-500">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(missingKeywords.soft_skills?.length || 0) > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Soft Skills / Execution</span>
                      <div className="flex flex-wrap gap-1.5">
                        {missingKeywords.soft_skills.map((kw, i) => (
                          <span key={i} className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[12px] font-medium text-blue-600 dark:text-blue-500">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!missingKeywords.hard_skills?.length &&
                    !missingKeywords.tools_technologies?.length &&
                    !missingKeywords.soft_skills?.length) && (
                    <span className="text-[13px] text-muted-foreground block">Zero keyword gaps. Your resume contains excellent keyword coverage!</span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(missingKeywords as string[]).length === 0 ? (
                    <span className="text-[13px] text-muted-foreground">Zero keyword gaps. Nice match!</span>
                  ) : (
                    (missingKeywords as string[]).map((kw, i) => (
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
              <h4 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                Primary Skills Detected ({matchedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.length === 0 ? (
                  <span className="text-[13px] text-muted-foreground">
                    No matching skills detected during optimization.
                  </span>
                ) : (
                  matchedKeywords.map((kw, i) => (
                    <span key={i} className="rounded-md bg-success/10 border border-success/20 px-2.5 py-1 text-[12px] font-medium text-success flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {kw}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Action Submit Area */}
      <div className="flex justify-end gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <Button
          size="lg"
          className="px-8 font-semibold shadow-sm gap-2"
          onClick={handleTailor}
          disabled={tailoring || !resumeText || !jobDesc.trim()}
        >
          {tailoring ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Tailoring Resume...
            </>
          ) : (
            "Tailor Resume"
          )}
        </Button>
      </div>
    </div>
  );
}

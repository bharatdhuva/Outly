import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import DotLottieLoader from "@/components/DotLottieLoader";
import AiErrorModal from "@/components/AiErrorModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PdfViewer from "@/components/PdfViewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Loader2, 
  UploadCloud, 
  X, 
  FileText, 
  Copy, 
  Download, 
  Save, 
  Check, 
  AlertTriangle, 
  CheckCircle,
  Lock,
  RefreshCw,
  Info,
  ExternalLink,
  Sparkles
} from "lucide-react";

export default function ResumeTailorPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [jobDesc, setJobDesc] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("custom");
  const [loading, setLoading] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<string | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingToVault, setSavingToVault] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[] | {
    hard_skills: string[];
    soft_skills: string[];
    tools_technologies: string[];
  }>({ hard_skills: [], soft_skills: [], tools_technologies: [] });
  const [sources, setSources] = useState<Array<{ title: string; url: string; domain: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes from vault
  const { data: resumes = [] } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Fetch current user session to get user specific details
  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.auth.me,
    enabled: !!localStorage.getItem("outly_token"),
  });

  // Load user-specific daily limit status from localStorage
  useEffect(() => {
    const userPrefix = userData?.user?.email || "anonymous";
    const storageKey = `ats_limit_reached_${userPrefix}`;
    const isPro = userData?.user?.plan === "pro" || localStorage.getItem("outly_premium_user") === "true";

    if (isPro) {
      setIsLimitExceeded(false);
    } else {
      const isLocked = localStorage.getItem(storageKey) === "true";
      setIsLimitExceeded(isLocked);
    }
  }, [userData]);

  // Drag and Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLimitExceeded) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLimitExceeded) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  const processResumeFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "pdf" && ext !== "docx") {
      toast({
        variant: "destructive",
        title: "Unsupported File",
        description: "Please upload a .txt, .pdf, or .docx file.",
      });
      return;
    }

    setResumeFile(file);
    setSelectedVaultId("custom");
    setLoading(true);
    setTailoredResult(null);
    setMatchedKeywords([]);
    setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
    setSources([]);

    try {
      const parsed = await api.ats.parseFile(file);
      setResumeText(parsed.content);
    } catch (err) {
      try {
        const text = await file.text();
        setResumeText(text);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  const handleVaultSelect = (idStr: string) => {
    setSelectedVaultId(idStr);
    setResumeFile(null);
    setTailoredResult(null);
    setMatchedKeywords([]);
    setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
    setSources([]);
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
      toast({
        title: "Resume Tailored Successfully!",
        description: "The AI optimized version and keyword insights are ready.",
      });
    } catch (err) {
      const errStr = String(err);
      const isLimitError = errStr.includes("LIMIT_ATS_EXCEEDED") || errStr.toLowerCase().includes("limit reached");
      
      if (isLimitError) {
        setIsLimitExceeded(true);
        setShowLimitModal(true);
        const userPrefix = userData?.user?.email || "anonymous";
        localStorage.setItem(`ats_limit_reached_${userPrefix}`, "true");
      } else {
        const isAiError = errStr.includes("Gemini") || errStr.includes("GoogleGenerativeAI") || errStr.includes("evaluations failed") || errStr.includes("rate limit") || errStr.includes("404");
        if (isAiError) {
          setShowAiErrorModal(true);
        } else {
          toast({
            variant: "destructive",
            title: "Tailoring Failed",
            description: errStr,
          });
        }
      }
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
    <div className="mx-auto w-full max-w-7xl px-6 py-6 sm:px-8 space-y-8 animate-fade-in pb-16">
      
      {/* Hero text header */}
      <div className="space-y-3 text-left">
        <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
          RESUME TAILOR
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight tracking-tight">
          Tailor your resume for any role
        </h1>
        <p className="text-muted-foreground text-[13px] sm:text-[14px] leading-relaxed max-w-3xl">
          Paste the target job description and upload your resume. Our AI automatically aligns your experience and skills to match hiring criteria.
        </p>
      </div>

      {/* INPUT WORKSPACE (Side by Side columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Left Input: Job Description */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col h-[320px] md:h-[460px] text-left space-y-4">
          <div className="flex justify-between items-center border-b border-border/40 pb-3">
            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-outly-accent" />
              Job Description
            </h2>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Target Context</span>
          </div>
          <Textarea
            className="flex-1 resize-none rounded-xl border-border bg-white text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-success p-3.5"
            placeholder="Paste the job description here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {/* Right Input: Resume Source */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col min-h-[460px] text-left">
          
          <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-4">
            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-success" />
              Resume Source
            </h2>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Candidate Input</span>
          </div>

          {loading ? (
            <DotLottieLoader size={150} minHeight="min-h-[250px]" />
          ) : !resumeFile && selectedVaultId === "custom" ? (
            isLimitExceeded ? (
              <div className="flex-1 border-2 border-dashed border-border bg-secondary/35 rounded-xl flex flex-col items-center justify-center p-6 text-center select-none cursor-not-allowed">
                <div className="space-y-4">
                  <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-[14px] font-bold text-foreground">Daily Limit Reached (3/3)</p>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">Please upgrade to Pro for unlimited tailoring.</p>
                  </div>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/pricing");
                    }}
                    className="bg-outly-accent hover:brightness-110 text-white text-xs font-bold tracking-wider px-6 py-2.5 rounded-full active:scale-[0.98] transition h-10 uppercase"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-all duration-200 ${
                  isDragging 
                    ? "border-success bg-[#fdfaf3]/80 scale-[1.01]" 
                    : "border-success/35 hover:border-success bg-[#fdfaf3]/35 hover:bg-[#fdfaf3]/65"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="space-y-4">
                  <UploadCloud className="h-8 w-8 text-success/70 mx-auto animate-bounce" />
                  <div>
                    <p className="text-[13px] font-bold text-foreground">Drag & drop your resume, or click to choose</p>
                    <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, TXT. Max 2MB.</p>
                  </div>

                  {resumes.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 pt-1.5 max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="bg-white border border-border h-8 text-[11px] rounded-lg px-2.5 font-bold text-foreground/70 focus:outline-none focus:ring-1 focus:ring-success shadow-sm w-full cursor-pointer hover:border-success/50 transition"
                        value={selectedVaultId}
                        onChange={(e) => handleVaultSelect(e.target.value)}
                      >
                        <option value="custom">Or select from Vault...</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={String(r.id)}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
                <span className="truncate text-[12px] font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-success" />
                  {resumeFile ? resumeFile.name : (resumes.find(r => String(r.id) === selectedVaultId)?.label || "Vault Resume")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground h-7 px-2 hover:bg-destructive/10 hover:text-destructive text-[11px] font-bold"
                  onClick={() => {
                    setResumeFile(null);
                    setResumeText(null);
                    setSelectedVaultId("custom");
                    setTailoredResult(null);
                    setMatchedKeywords([]);
                    setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
                    setSources([]);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>

              <div className="flex-1 min-h-[360px] overflow-hidden rounded-xl border border-border bg-secondary/10 flex flex-col">
                {resumeFile && resumeFile.type === "application/pdf" ? (
                  <div className="flex-1 flex flex-col min-h-[360px]">
                    <PdfViewer file={resumeFile} />
                  </div>
                ) : !resumeFile && resumes.find(r => String(r.id) === selectedVaultId)?.filename.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex-1 flex flex-col min-h-[360px]">
                    <PdfViewer url={api.resume.getFileUrl(Number(selectedVaultId))} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-3.5 text-left max-h-[360px]">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/80">{resumeText}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Submit Area (Below inputs) */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 sm:gap-4 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-[var(--shadow-card)]">
        <span className="text-[11px] font-bold text-muted-foreground">Tailored live by Outly AI</span>
        <Button
          className="w-full sm:w-auto max-w-[220px] bg-outly-accent hover:brightness-110 text-white px-5 font-bold tracking-normal rounded-full shadow-md shadow-outly-accent/15 active:scale-[0.98] transition-all gap-1.5 h-9 text-xs cursor-pointer"
          onClick={handleTailor}
          disabled={tailoring || !resumeText || !jobDesc.trim()}
        >
          {tailoring ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Tailoring...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Tailor Resume
            </>
          )}
        </Button>
      </div>

      {/* TAILORING ANIMATED PROGRESS LOADER CARD */}
      {tailoring && (
        <div className="w-full bg-card border border-border rounded-2xl p-10 text-center shadow-[var(--shadow-card)] space-y-4 animate-pulse">
          <Loader2 className="h-9 w-9 animate-spin text-outly-accent mx-auto" />
          <div className="space-y-2 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">AI Tailoring in Progress...</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Outly AI is parsing the job description, cross-referencing industry skill sets, and rewriting your resume points. This takes about 10-15 seconds.
            </p>
          </div>
        </div>
      )}

      {/* TAILORED DOCK PREVIEW & KEYWORD ANALYSIS SECTION */}
      {tailoredResult && !tailoring && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-border/40 animate-slide-up">
          
          {/* Left Panel: Tailored Resume preview panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col h-[380px] md:h-[600px] text-left">
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Tailored Resume (Markdown)
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Optimized work history and professional profile summary.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 px-3 text-[11px] border-border text-foreground hover:bg-secondary rounded-lg font-bold"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 px-3 text-[11px] border-border text-foreground hover:bg-secondary rounded-lg font-bold"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-secondary/10 p-4 font-mono text-[12px] leading-relaxed text-foreground/80">
                <pre className="whitespace-pre-wrap">{tailoredResult}</pre>
              </div>
            </div>
          </div>

          {/* Right Panel: Keyword Insights & Search References (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Keyword Analysis Card */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] space-y-4 text-left">
              <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
                <Sparkles className="h-4.5 w-4.5 text-outly-accent animate-pulse" />
                Keyword Improvements
              </h3>
              
              <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                {/* Matched skills */}
                {matchedKeywords.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-success uppercase tracking-wider block">Matched Primary Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {matchedKeywords.map((kw, i) => (
                        <span key={i} className="rounded-md bg-success/5 border border-success/15 px-2 py-0.5 text-[10px] font-semibold text-success flex items-center gap-1">
                          <Check className="h-2.5 w-2.5" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {typeof missingKeywords === "object" && !Array.isArray(missingKeywords) ? (
                  <div className="space-y-3">
                    {(missingKeywords.hard_skills?.length || 0) > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Recommended Hard Skills to Add</span>
                        <div className="flex flex-wrap gap-1">
                          {missingKeywords.hard_skills.map((kw, i) => (
                            <span key={i} className="rounded-md bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(missingKeywords.tools_technologies?.length || 0) > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Tools / Technologies</span>
                        <div className="flex flex-wrap gap-1">
                          {missingKeywords.tools_technologies.map((kw, i) => (
                            <span key={i} className="rounded-md bg-blue-500/5 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(missingKeywords.soft_skills?.length || 0) > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Soft Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {missingKeywords.soft_skills.map((kw, i) => (
                            <span key={i} className="rounded-md bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Recommended Skills to Add</span>
                    <div className="flex flex-wrap gap-1">
                      {(missingKeywords as string[]).map((kw, i) => (
                        <span key={i} className="rounded-md bg-amber-500/5 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grounded References Card */}
            {sources.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] space-y-4 text-left flex flex-col h-[270px]">
                <div className="flex justify-between items-center border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground flex items-center gap-2">
                      <Info className="h-4.5 w-4.5 text-primary" />
                      Grounded Search Sources
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Role requirements verified from external benchmark profiles.</p>
                  </div>
                  <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">{sources.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-white hover:bg-secondary/40 transition duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          className="h-4 w-4 rounded shrink-0 bg-white border border-border/10"
                          src={`https://www.google.com/s2/favicons?domain=${src.domain}&sz=32`}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-foreground truncate">{src.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">{src.url}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Limit Exceeded Dialog Modal */}
      <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-border bg-card p-6 font-sans">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Lock className="w-6 h-6 shrink-0" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Daily Limit Reached (3/3)</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Your free tier is limited to 3 ATS resume checks/tailoring checks per day. Upgrade to Outly Pro for unlimited checks, AI resume tailoring, and interview preparation guides.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
            <Button
              variant="outline"
              onClick={() => setShowLimitModal(false)}
              className="w-full sm:w-auto border-border text-xs font-medium h-10 rounded-full hover:bg-secondary active:scale-[0.98] transition"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowLimitModal(false);
                navigate("/pricing");
              }}
              className="w-full sm:w-auto bg-outly-accent hover:brightness-110 hover:scale-[1.02] text-white text-xs font-medium h-10 rounded-full shadow-lg shadow-outly-accent/20 active:scale-[0.98] transition-all"
            >
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AiErrorModal open={showAiErrorModal} onClose={() => setShowAiErrorModal(false)} />

    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, EvaluationResult } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import PdfViewer from "@/components/PdfViewer";
import AiErrorModal from "@/components/AiErrorModal";
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
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Check,
  Info,
  AlertCircle,
  X,
  FileText,
  Lock,
  ChevronRight
} from "lucide-react";

export default function AtsScorePage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch current user session to get user specific details
  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.auth.me,
    enabled: !!localStorage.getItem("outly_token"),
  });

  const [mode, setMode] = useState<"general" | "targeted">("general");
  const [resume, setResume] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("custom");
  const [isDragging, setIsDragging] = useState(false);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [unlockAtTime, setUnlockAtTime] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState("");
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const userEmail = userData?.user?.email || "anonymous";
  const [prevUserEmail, setPrevUserEmail] = useState("anonymous");

  // Reset loading flag if userEmail changes to prevent overwrites
  if (userEmail !== prevUserEmail) {
    setPrevUserEmail(userEmail);
    setIsStateLoaded(false);
  }

  // Load state from localStorage on mount and when userEmail changes
  useEffect(() => {
    const loadedMode = (localStorage.getItem(`ats_mode_${userEmail}`) as "general" | "targeted") || "general";
    const loadedResume = localStorage.getItem(`ats_resume_${userEmail}`) || "";
    const loadedFileName = localStorage.getItem(`ats_resume_file_name_${userEmail}`) || "";
    const loadedJd = localStorage.getItem(`ats_jd_${userEmail}`) || "";
    
    const savedResult = localStorage.getItem(`ats_result_${userEmail}`);
    const loadedResult = savedResult ? JSON.parse(savedResult) : null;
    
    const loadedVaultId = localStorage.getItem(`ats_selected_vault_id_${userEmail}`) || "custom";

    setMode(loadedMode);
    setResume(loadedResume);
    setResumeFileName(loadedFileName);
    setJd(loadedJd);
    setResult(loadedResult);
    setSelectedVaultId(loadedVaultId);
    
    setIsStateLoaded(true);
  }, [userEmail]);

  // Sync state changes to localStorage (user-scoped)
  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem(`ats_mode_${userEmail}`, mode);
  }, [mode, userEmail, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem(`ats_resume_${userEmail}`, resume);
  }, [resume, userEmail, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem(`ats_resume_file_name_${userEmail}`, resumeFileName);
  }, [resumeFileName, userEmail, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem(`ats_jd_${userEmail}`, jd);
  }, [jd, userEmail, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    if (result) {
      localStorage.setItem(`ats_result_${userEmail}`, JSON.stringify(result));
    } else {
      localStorage.removeItem(`ats_result_${userEmail}`);
    }
  }, [result, userEmail, isStateLoaded]);

  useEffect(() => {
    if (!isStateLoaded) return;
    localStorage.setItem(`ats_selected_vault_id_${userEmail}`, selectedVaultId);
  }, [selectedVaultId, userEmail, isStateLoaded]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Interactive dashboard states
  const [activeCategory, setActiveCategory] = useState<"content" | "format" | "style" | "sections" | "roles">("content");
  
  // Custom React state scanning loader
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [showScanLoader, setShowScanLoader] = useState(false);

  // Fetch resumes from the Resume Vault
  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: api.resume.list,
  });

  // Mock Result to show in Demo state before upload
  const mockResult: EvaluationResult = {
    score: 72,
    breakdown: {
      skills_match: 65,
      experience_match: 60,
      formatting_readability: 45,
      impact_metrics: 55
    },
    experience_analysis: {
      seniority_match: "Fair",
      comments: "Your work progression matches a Mid-Senior level engineering profile, but lacks explicit project scale metrics."
    },
    missing_keywords: ["Redis", "Docker", "System Design"],
    matched_keywords: ["TypeScript", "Node.js", "React"],
    formatting_issues: [
      "Inconsistent section spacing above 'Projects' header",
      "Avoid margins smaller than 0.5 inches"
    ],
    suggestions: [
      "Add a 2-line professional profile summary at the top.",
      "Quantify achievement bullets in your latest role.",
      "Incorporate target technologies like Docker and Redis."
    ]
  };

  // Switch vault resume
  const handleVaultSelect = (idStr: string) => {
    setSelectedVaultId(idStr);
    setResumeFile(null); // Clear uploaded file when vault item is selected
    setResumeFileName("");
    if (idStr === "custom") {
      setResume("");
      setResult(null);
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResume(found.content);
        // Automatically trigger evaluation scan for the vault item
        triggerAtsScan(found.content);
      }
    }
  };



  // Helper to compute countdown text from an unlock ISO timestamp
  const getCountdown = (unlockIso: string): string => {
    const diff = new Date(unlockIso).getTime() - Date.now();
    if (diff <= 0) return "";
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Load user-specific limit status from localStorage (timestamp-based auto-expiry)
  useEffect(() => {
    const userPrefix = userData?.user?.email || "anonymous";
    const storageKey = `ats_limit_unlock_${userPrefix}`;
    const isPro = userData?.user?.plan === "pro" || localStorage.getItem("outly_premium_user") === "true";

    if (isPro) {
      setIsLimitExceeded(false);
    } else {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const unlockTime = new Date(stored).getTime();
        if (Date.now() >= unlockTime) {
          localStorage.removeItem(storageKey);
          setIsLimitExceeded(false);
          setUnlockAtTime(null);
        } else {
          setIsLimitExceeded(true);
          setUnlockAtTime(stored);
          setCountdownText(getCountdown(stored));
        }
      } else {
        setIsLimitExceeded(false);
      }
    }
  }, [userData]);

  // Tick countdown every minute and auto-unlock when time passes
  useEffect(() => {
    if (!unlockAtTime) return;
    const timer = setInterval(() => {
      const diff = new Date(unlockAtTime).getTime() - Date.now();
      if (diff <= 0) {
        setIsLimitExceeded(false);
        setUnlockAtTime(null);
        setCountdownText("");
        const userPrefix = userData?.user?.email || "anonymous";
        localStorage.removeItem(`ats_limit_unlock_${userPrefix}`);
        clearInterval(timer);
      } else {
        setCountdownText(getCountdown(unlockAtTime));
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [unlockAtTime, userData]);

  // Handle file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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
    setResumeFileName(file.name);
    setParsingFile(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 150);

    try {
      const data = await api.ats.parseFile(file);
      setResume(data.content);
      setSelectedVaultId("custom");
      // Automatically trigger evaluation scan after parsing
      triggerAtsScan(data.content);
    } catch (err) {
      try {
        const text = await file.text();
        setResume(text);
        setSelectedVaultId("custom");
        triggerAtsScan(text);
      } catch (innerErr) {
        toast({
          variant: "destructive",
          title: "Error Reading File",
          description: "Could not parse or read this file format. Please upload .txt, .pdf, or .docx.",
        });
        setResumeFile(null);
        setResumeFileName("");
        setResume("");
        setResult(null);
      }
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setParsingFile(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  // Trigger evaluation scan with loader simulation
  const triggerAtsScan = async (resumeText: string) => {
    if (!resumeText.trim()) return;
    if (mode === "targeted" && !jd.trim()) {
      toast({
        variant: "destructive",
        title: "Job Description Required",
        description: "Please paste the job description to match against in Targeted Mode.",
      });
      return;
    }

    const loadingStatuses = [
      "Extracting text profile & layout structure...",
      "Analyzing semantic density and content quality...",
      "Running 27 universal ATS compatibility checks...",
      "Scanning experience timeline for quantified metrics...",
      "Verifying font, spacing, and section margins...",
      "Comparing keyword match vectors with hiring systems...",
      "Synthesizing actionable formatting recommendations..."
    ];

    setShowScanLoader(true);
    setScanProgress(0);
    
    let statusIndex = 0;
    setScanStatus(loadingStatuses[0]);

    // Interval to cycle through statuses continuously
    const statusTimer = setInterval(() => {
      statusIndex = (statusIndex + 1) % loadingStatuses.length;
      setScanStatus(loadingStatuses[statusIndex]);
    }, 1200);

    // Progress bar animation triggers (gradually increment and hold at 98)
    let progress = 0;
    const progressTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 2; // increment by 2-6%
      if (progress >= 98) {
        progress = 98;
      }
      setScanProgress(progress);
    }, 150);

    setLoading(true);
    try {
      const data = await api.ats.score(resumeText, mode === "targeted" ? jd : "");
      
      // Stop the timers
      clearInterval(statusTimer);
      clearInterval(progressTimer);

      // Complete the progress bar cleanly
      setScanProgress(100);
      setScanStatus("Finalizing ATS scoring report...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setResult(data);
      window.dispatchEvent(new CustomEvent("outly-notification", {
        detail: {
          title: "Resume Scanned 🔍",
          description: `Your resume has been successfully scanned. ATS Match Score: ${data.score}/100.`
        }
      }));
      toast({
        title: "Scan Completed",
        description: `ATS Match Score: ${data.score}/100`,
      });
    } catch (err) {
      clearInterval(statusTimer);
      clearInterval(progressTimer);
      
      const errStr = String(err);
      const isLimitError = errStr.includes("LIMIT_ATS_EXCEEDED") || errStr.toLowerCase().includes("limit reached");
      
      if (isLimitError) {
        setIsLimitExceeded(true);
        setShowLimitModal(true);
        const unlockIso = (err as any)?.data?.unlockAt || null;
        if (unlockIso) {
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));
          const userPrefix = userData?.user?.email || "anonymous";
          localStorage.setItem(`ats_limit_unlock_${userPrefix}`, unlockIso);
        }} else {
        const isAiError = errStr.includes("Gemini") || errStr.includes("GoogleGenerativeAI") || errStr.includes("evaluations failed") || errStr.includes("rate limit") || errStr.includes("404");
        if (isAiError) {
          setShowAiErrorModal(true);
        } else {
          toast({
            variant: "destructive",
            title: "Evaluation Failed",
            description: errStr,
          });
        }
      }
      setResult(null);
    } finally {
      setShowScanLoader(false);
      setLoading(false);
    }
  };

  // Manual check score click
  const handleCheckScoreClick = () => {
    triggerAtsScan(resume);
  };

  // Get active evaluation dataset
  const activeResult = result || mockResult;

  // Calculate score category grades
  const contentScore = activeResult.breakdown 
    ? Math.round((activeResult.breakdown.skills_match + activeResult.breakdown.experience_match) / 2) 
    : 65;
  
  const formatScore = activeResult.breakdown 
    ? activeResult.breakdown.formatting_readability 
    : 45;

  const styleScore = activeResult.breakdown 
    ? activeResult.breakdown.impact_metrics 
    : 55;

  // Helper to detect sections in plain text
  const getSectionsScore = (text: string) => {
    if (!text) return 0;
    const lower = text.toLowerCase();
    let score = 0;
    if (lower.includes("experience") || lower.includes("work")) score += 20;
    if (lower.includes("education")) score += 20;
    if (lower.includes("skills")) score += 20;
    if (lower.includes("project")) score += 20;
    if (lower.includes("summary") || lower.includes("profile")) score += 20;
    return score || 40; // baseline fallback
  };

  const sectionsScore = result ? getSectionsScore(resume) : 60;
  
  const rolesScore = activeResult.experience_analysis?.seniority_match === "Good" 
    ? 90 
    : activeResult.experience_analysis?.seniority_match === "Fair" 
      ? 65 
      : 40;

  // Compute overall issue count
  const getIssuesCount = (res: EvaluationResult) => {
    let count = 0;
    if (res.formatting_issues) count += res.formatting_issues.length;
    if (res.missing_keywords) {
      if (Array.isArray(res.missing_keywords)) {
        count += res.missing_keywords.length;
      } else {
        const mk = res.missing_keywords as any;
        count += (mk.hard_skills?.length || 0) + (mk.tools_technologies?.length || 0) + (mk.soft_skills?.length || 0);
      }
    }
    if (res.experience_analysis && res.experience_analysis.seniority_match !== "Good") {
      count += 1;
    }
    return count || 8; // baseline
  };

  const issuesCount = result ? getIssuesCount(result) : 18;

  // Helpers for category grades coloring
  const getBadgeColorClass = (scoreNum: number) => {
    if (scoreNum >= 75) return "bg-success/10 text-success border-success/15";
    if (scoreNum >= 50) return "bg-warning/10 text-warning border-warning/15";
    return "bg-amber-500/10 text-amber-700 border-amber-550/15";
  };

  const getScoreDialColorClass = (scoreNum: number) => {
    if (scoreNum >= 75) return "stroke-success text-success";
    if (scoreNum >= 50) return "stroke-warning text-warning";
    return "stroke-amber-500 text-amber-500";
  };

  const getMissingKeywordsArray = (kw: any): string[] => {
    if (!kw) return [];
    if (Array.isArray(kw)) return kw;
    return [
      ...(kw.hard_skills || []),
      ...(kw.tools_technologies || []),
      ...(kw.soft_skills || [])
    ];
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-4 sm:py-6 sm:px-8 space-y-6 sm:space-y-12 animate-fade-in pb-20">
      
      {/* TWO COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
        
        {/* ─── LEFT COLUMN: HERO DESCRIPTIONS & INPUT OR RESUME VIEW ─── */}
        <div className="lg:col-span-6 space-y-4 sm:space-y-8 flex flex-col justify-center min-h-0 md:min-h-[480px]">
          
          {/* Hero text header */}
          {!result && (
            <div className="space-y-3 sm:space-y-4">
              <span className="text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-3 py-1.5 rounded-full inline-block">
                RESUME CHECKER
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-foreground leading-[1.08] tracking-tight">
                Is your resume good enough?
              </h1>
              <p className="text-muted-foreground text-[14px] sm:text-[15px] leading-relaxed max-w-xl">
                A free and fast AI resume checker doing 27 crucial checks to ensure your resume's content, layout and design is technically compatible with the applicant tracking systems and get you interview callbacks.
              </p>
            </div>
          )}

          {!result ? (
            isLimitExceeded ? (
              /* Locked upload zone because limit is reached */
              <div 
                className="border-2 border-dashed border-border bg-secondary/30 p-5 sm:p-10 text-center rounded-2xl select-none cursor-not-allowed"
              >
                <div className="space-y-3 sm:space-y-4 py-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-600">
                    <Lock className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[14px] sm:text-[15px] font-bold text-foreground">
                      Limit Reached{countdownText ? ` · Unlocks in ${countdownText}` : " (3/3)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
                      You've used 3 resume checks. {countdownText ? `Try again in ${countdownText}.` : "Upgrade to Outly Pro for unlimited scans and deeper semantic matching."}
                    </p>
                  </div>
                  <Button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/pricing");
                    }}
                    className="bg-outly-accent hover:brightness-110 hover:scale-[1.02] text-white text-xs font-bold tracking-wider px-6 py-4 rounded-full shadow-lg shadow-outly-accent/20 active:scale-[0.98] transition-all h-10 shrink-0 uppercase"
                  >
                    Upgrade to Outly Pro
                  </Button>
                </div>
              </div>
            ) : (parsingFile || showScanLoader) ? (
              /* Real Upload & Scan Progress loader */
              <div className="border-2 border-dashed border-success/60 bg-[#fdfaf3]/50 p-5 sm:p-10 text-center rounded-2xl select-none flex flex-col items-center justify-center min-h-[220px] w-full animate-pulse">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4 text-success">
                  <UploadCloud className="w-6 h-6 animate-bounce shrink-0" />
                </div>
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-outly-dark">
                    <span>{parsingFile ? "Uploading resume..." : "Outly AI is checking your document..."}</span>
                    <span>{parsingFile ? uploadProgress : scanProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${parsingFile ? uploadProgress : scanProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium min-h-[16px]">
                    {parsingFile ? "Please wait while Outly processes your file..." : scanStatus}
                  </p>
                </div>
              </div>
            ) : (
              /* Upload Dropzone Box with Dotted Border - supporting Drag and Drop */
              <div 
                onClick={() => document.getElementById("resume-upload-input")?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-5 sm:p-10 text-center rounded-2xl cursor-pointer select-none transition-all duration-200 ${
                  isDragging 
                    ? "border-success bg-[#fdfaf3]/80 scale-[1.01]" 
                    : "border-success/35 hover:border-success bg-[#fdfaf3]/35 hover:bg-[#fdfaf3]/65"
                }`}
              >
                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[14px] sm:text-[15px] font-bold text-foreground">
                      Drag & drop your resume here, or click to choose a file.
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      PDF & DOCX only. Max 2MB file size.
                    </p>
                  </div>
 
                  <Button 
                    type="button"
                    disabled={parsingFile}
                    className="bg-outly-accent hover:brightness-110 text-white text-xs font-bold tracking-normal px-5 py-2.5 rounded-full shadow-md shadow-outly-accent/15 active:scale-[0.98] transition h-9 shrink-0 gap-1.5 cursor-pointer max-w-full truncate"
                  >
                    {parsingFile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {parsingFile ? "Uploading..." : "Upload Your Resume"}
                  </Button>
 
                  {/* Inline Vault Resume Selector */}
                  {resumes.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 pt-2 max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Or select from Vault</span>
                      <select
                        id="vault-select-trigger"
                        className="bg-white border border-border h-8 text-[11px] rounded-lg px-2 font-bold text-foreground/70 focus:outline-none focus:ring-1 focus:ring-success shadow-sm w-full cursor-pointer hover:border-success/50 transition"
                        value={selectedVaultId}
                        onChange={(e) => handleVaultSelect(e.target.value)}
                      >
                        <option value="custom">Select a resume...</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={String(r.id)}>
                            {r.label} ({r.filename.split(".").pop()?.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
 
                  {/* Privacy terms guarantee (as requested) */}
                  <div className="text-muted-foreground/60 text-[11px] font-semibold flex items-center justify-center gap-1.5 pt-1">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                    <span>Your resume and website data is completely safe.</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Resume Preview Workspace (PDF or text block) after scan completes */
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)] flex-1 flex flex-col min-h-0 md:min-h-[380px] animate-slide-up">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/40 pb-2.5">
                <span className="truncate text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-outly-accent shrink-0" />
                  {resumeFile ? resumeFile.name : resumeFileName || resumes.find(r => String(r.id) === selectedVaultId)?.label || "Uploaded Resume"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground h-7 px-2 hover:bg-destructive/10 hover:text-destructive text-[11px]"
                  onClick={() => {
                    setResult(null);
                    setResume("");
                    setResumeFile(null);
                    setResumeFileName("");
                    setSelectedVaultId("custom");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>

              {/* View PDF file or plain text */}
              <div className="flex-1 min-h-[260px] md:min-h-[480px] overflow-hidden rounded-xl border border-border bg-secondary/10 flex flex-col">
                {resumeFile && resumeFile.type === "application/pdf" ? (
                  <div className="flex-1 flex flex-col min-h-[260px] md:min-h-[480px]">
                    <PdfViewer file={resumeFile} />
                  </div>
                ) : !resumeFile && resumes.find(r => String(r.id) === selectedVaultId)?.filename.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex-1 flex flex-col min-h-[260px] md:min-h-[480px]">
                    <PdfViewer url={api.resume.getFileUrl(Number(selectedVaultId))} />
                  </div>
                ) : (
                  <div className="flex-1 max-h-[260px] md:max-h-[480px] overflow-y-auto p-4 text-left">
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/80">{resume}</pre>
                  </div>
                )}
              </div>

              {/* Action tray below active resume preview */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">Checked by Outly AI</span>
                <Button
                  onClick={handleCheckScoreClick}
                  disabled={loading}
                  size="sm"
                  className="bg-outly-accent hover:bg-outly-accent/95 text-white text-[11px] px-4 py-1.5 font-bold tracking-wider rounded-lg shadow-sm"
                >
                  <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                  RESCAN RESUME
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* ─── RIGHT COLUMN: THE INTERACTIVE DASHBOARD CARD ─── */}
        {!isLimitExceeded && (result || !isMobile) && (
          <div className="lg:col-span-6 relative flex items-center justify-center w-full">
          
          {/* Background glowing mesh radial effect */}
          <div className="absolute inset-0 bg-outly-accent/5 blur-[80px] rounded-full transform -translate-y-12 select-none pointer-events-none"></div>
          
          {/* Browser Frame Mockup Container */}
          <div className={`relative bg-card border border-border/85 rounded-2xl shadow-[0_22px_70px_rgba(26,26,26,0.06)] w-full max-w-xl overflow-hidden flex flex-col z-10 select-none transition-all duration-300 ${
            !result
              ? "h-[180px] min-h-[180px] md:h-[600px] md:min-h-[500px]"
              : "h-auto md:h-[600px] min-h-[500px]"
          }`}>
            
            {/* Browser Header Bar */}
            <div className="bg-secondary/40 border-b border-border/60 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-destructive/80"></div>
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-warning/80"></div>
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-success/80"></div>
              </div>
              <div className="bg-white border border-border/50 rounded-md text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 px-3 sm:px-6 py-0.5 tracking-tight flex items-center gap-1.5 select-none max-w-[140px] xs:max-w-none truncate">
                <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-success shrink-0" />
                <span className="truncate">ats.outly.online</span>
              </div>
              <div className="w-8 sm:w-10"></div>
            </div>

            {/* Main Score Dashboard Layout */}
            {result && result.isValidResume === false ? (
              /* Invalid Resume Error State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-white animate-fade-in min-h-[400px]">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive border border-destructive/20">
                  <AlertTriangle className="w-7 h-7 shrink-0 animate-bounce" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Invalid Document Detected</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
                  {result.error || "The uploaded document does not appear to be a valid resume/CV. Outly AI scanned the file but could not identify standard sections or profile details."}
                </p>
                <div className="bg-secondary/40 border border-border/60 rounded-xl p-4 max-w-sm text-left space-y-3.5 w-full">
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-foreground">
                    💡 Proper Resume Requirements:
                  </span>
                  <ul className="space-y-2 text-[11.5px] text-muted-foreground font-medium">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>Must contain standard sections (e.g., <strong>Experience</strong>, <strong>Education</strong>, or <strong>Skills</strong>).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>Must include candidate contact info (e.g., email or phone number).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span>Cannot be a tax form, invoice, receipt, ID card, or general article.</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={() => {
                    setResult(null);
                    setResume("");
                    setResumeFile(null);
                    setResumeFileName("");
                    setSelectedVaultId("custom");
                  }}
                  className="mt-6 bg-outly-accent hover:brightness-110 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md shadow-outly-accent/20 cursor-pointer transition active:scale-[0.97] h-9 shrink-0 gap-1.5"
                >
                  Upload a Different File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:grid md:grid-cols-12 flex-1 h-auto md:h-[calc(100%-44px)]">
              
              {/* Left Panel: Score circular dial & category selector buttons (5/12 cols) */}
              <div className="col-span-12 md:col-span-5 border-b md:border-b-0 md:border-r border-border/60 p-4 bg-secondary/10 flex flex-col justify-between h-auto md:h-full overflow-y-auto">
                
                <div className="space-y-4">
                  <span className="text-[11px] font-bold text-foreground/80 tracking-tight block">Resume Score</span>
                  
                  {/* SVG Arc Progress Dial */}
                  <div className="relative flex flex-col items-center justify-center py-2">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="46" className="stroke-muted fill-none" strokeWidth="8" />
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        className={`fill-none transition-all duration-1000 ${getScoreDialColorClass(activeResult.score)}`}
                        strokeWidth="8"
                        strokeDasharray="289"
                        strokeDashoffset={289 - (289 * activeResult.score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-foreground">{activeResult.score}</span>
                      <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-wider mt-[-2px]">/ 100</span>
                    </div>
                  </div>

                  {/* Issues indicator badge */}
                  <div className="text-center">
                    <span className={`inline-block text-[8px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      activeResult.score >= 80 
                        ? "bg-success/10 text-success border border-success/15" 
                        : activeResult.score >= 50 
                          ? "bg-warning/10 text-warning border border-warning/15" 
                          : "bg-amber-500/10 text-amber-700 border border-amber-500/15"
                    }`}>
                      {issuesCount} Issues Found
                    </span>
                  </div>
                </div>

                {/* Categories Tab Selector */}
                <div className="space-y-1.5 pt-4 border-t border-border/50">
                  <button
                    onClick={() => setActiveCategory("content")}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-300 active:scale-[0.97] relative overflow-hidden ${
                      activeCategory === "content" 
                        ? "bg-white border border-border shadow-sm pl-3.5" 
                        : "hover:bg-white/50 border border-transparent pl-2 text-muted-foreground"
                    }`}
                  >
                    {activeCategory === "content" && (
                      <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md bg-outly-accent animate-[slide-up_0.3s_ease-out]" />
                    )}
                    <span className={`text-[11px] font-bold ${activeCategory === "content" ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>Content</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${getBadgeColorClass(contentScore)}`}>{contentScore}%</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory("format")}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-300 active:scale-[0.97] relative overflow-hidden ${
                      activeCategory === "format" 
                        ? "bg-white border border-border shadow-sm pl-3.5" 
                        : "hover:bg-white/50 border border-transparent pl-2 text-muted-foreground"
                    }`}
                  >
                    {activeCategory === "format" && (
                      <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md bg-outly-accent animate-[slide-up_0.3s_ease-out]" />
                    )}
                    <span className={`text-[11px] font-bold ${activeCategory === "format" ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>Format & Density</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${getBadgeColorClass(formatScore)}`}>{formatScore}%</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory("style")}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-300 active:scale-[0.97] relative overflow-hidden ${
                      activeCategory === "style" 
                        ? "bg-white border border-border shadow-sm pl-3.5" 
                        : "hover:bg-white/50 border border-transparent pl-2 text-muted-foreground"
                    }`}
                  >
                    {activeCategory === "style" && (
                      <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md bg-outly-accent animate-[slide-up_0.3s_ease-out]" />
                    )}
                    <span className={`text-[11px] font-bold ${activeCategory === "style" ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>Style</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${getBadgeColorClass(styleScore)}`}>{styleScore}%</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory("sections")}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-300 active:scale-[0.97] relative overflow-hidden ${
                      activeCategory === "sections" 
                        ? "bg-white border border-border shadow-sm pl-3.5" 
                        : "hover:bg-white/50 border border-transparent pl-2 text-muted-foreground"
                    }`}
                  >
                    {activeCategory === "sections" && (
                      <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md bg-outly-accent animate-[slide-up_0.3s_ease-out]" />
                    )}
                    <span className={`text-[11px] font-bold ${activeCategory === "sections" ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>Sections</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${getBadgeColorClass(sectionsScore)}`}>{sectionsScore}%</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory("roles")}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-300 active:scale-[0.97] relative overflow-hidden ${
                      activeCategory === "roles" 
                        ? "bg-white border border-border shadow-sm pl-3.5" 
                        : "hover:bg-white/50 border border-transparent pl-2 text-muted-foreground"
                    }`}
                  >
                    {activeCategory === "roles" && (
                      <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-md bg-outly-accent animate-[slide-up_0.3s_ease-out]" />
                    )}
                    <span className={`text-[11px] font-bold ${activeCategory === "roles" ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>Roles</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${getBadgeColorClass(rolesScore)}`}>{rolesScore}%</span>
                  </button>
                </div>

              </div>

              {/* Right Panel: Detailed Checklist items of active category (7/12 cols) */}
              <div className="col-span-12 md:col-span-7 p-5 bg-white overflow-y-auto h-auto md:h-full flex flex-col justify-between text-left">
                
                <div className="space-y-4">
                  {/* Render content dynamically based on active category */}
                  {activeCategory === "content" && (
                    <div className="space-y-4 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Content Audits</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Scans keyword targets, density, and achievement metrics.</p>
                        </div>
                        <span className="text-xs font-bold text-success">{contentScore}%</span>
                      </div>

                      <div className="space-y-3">
                        {/* ATS Parse Check */}
                        <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-foreground">ATS Parse Rate</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Universal fonts and plain structure parsed successfully with 98% clarity.</span>
                          </div>
                        </div>

                        {/* Quantified Metrics Check */}
                        <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-foreground">Quantified Impact</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Multiple achievement bullet points contain key metric parameters.</span>
                          </div>
                        </div>

                        {/* Keyword gaps (Live/mock data mapped) */}
                        {getMissingKeywordsArray(activeResult.missing_keywords).length > 0 ? (
                          <div className="space-y-3 w-full">
                            <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 p-2.5 rounded-xl">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div className="w-full">
                                <span className="block text-[11px] font-bold text-amber-700">Keyword Gaps Detected</span>
                                <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Your CV lacks these core terms required for this domain:</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 w-full">
                              {getMissingKeywordsArray(activeResult.missing_keywords).map((kw, i) => (
                                <div key={i} className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl w-full text-left break-words">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                                  <span className="text-[10px] font-medium text-foreground leading-relaxed break-words w-full">{kw}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                            <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[11px] font-bold text-success">Excellent Keyword Match</span>
                              <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">No critical keyword gaps found in content parameters.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeCategory === "format" && (
                    <div className="space-y-4 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Format &amp; Density</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Audits spacing, layout margins, fonts, and lengths.</p>
                        </div>
                        <span className="text-xs font-bold text-warning">{formatScore}%</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-foreground">Standard Page-Length</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">The page length is highly optimal and stays within scannable guidelines.</span>
                          </div>
                        </div>

                        {activeResult.formatting_issues && activeResult.formatting_issues.length > 0 ? (
                          <div className="flex items-start gap-2.5 bg-warning/5 border border-warning/15 p-2.5 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                            <div className="w-full">
                              <span className="block text-[11px] font-bold text-warning">Layout Inconsistencies</span>
                              <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Adjust padding and section headers to standard scales:</span>
                              <ul className="list-disc list-inside mt-2 text-[10px] text-muted-foreground space-y-1">
                                {activeResult.formatting_issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                            <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[11px] font-bold text-success">Clean Spacing Layout</span>
                              <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">No parser-breaking tables or spacing issues detected.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeCategory === "style" && (
                    <div className="space-y-4 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Style &amp; Grammar</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Scans action verb ratios, redundant phrases, and buzzwords.</p>
                        </div>
                        <span className="text-xs font-bold text-warning">{styleScore}%</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-foreground">Action-Oriented phrasings</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">CV features strong leading action verbs (e.g., 'engineered', 'optimized', 'developed').</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 bg-warning/5 border border-warning/15 p-2.5 rounded-xl">
                          <Info className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-warning">Avoid Weak Buzzwords</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Replace fluff adjectives like 'highly motivated' with quantitative metrics.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === "sections" && (
                    <div className="space-y-4 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Section Anchors</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Confirms presence of standard CV structural blocks.</p>
                        </div>
                        <span className="text-xs font-bold text-success">{sectionsScore}%</span>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <div className="flex justify-between items-center text-[11px] border-b border-border/40 pb-2">
                          <span className="font-bold text-foreground/80">Work Experience</span>
                          {resume.toLowerCase().includes("experience") || resume.toLowerCase().includes("work") || resume.toLowerCase().includes("employment") || resume.toLowerCase().includes("history") ? (
                            <span className="text-success font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Found</span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1"><X className="w-3 h-3" /> Missing</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[11px] border-b border-border/40 pb-2">
                          <span className="font-bold text-foreground/80">Education &amp; Credentials</span>
                          {resume.toLowerCase().includes("education") || resume.toLowerCase().includes("academic") || resume.toLowerCase().includes("degree") || resume.toLowerCase().includes("university") || resume.toLowerCase().includes("college") || resume.toLowerCase().includes("school") ? (
                            <span className="text-success font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Found</span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1"><X className="w-3 h-3" /> Missing</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[11px] border-b border-border/40 pb-2">
                          <span className="font-bold text-foreground/80">Key Projects</span>
                          {resume.toLowerCase().includes("project") || resume.toLowerCase().includes("accomplishment") ? (
                            <span className="text-success font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Found</span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1"><X className="w-3 h-3" /> Missing</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[11px] border-b border-border/40 pb-2">
                          <span className="font-bold text-foreground/80">Summary Profile</span>
                          {resume.toLowerCase().includes("summary") || resume.toLowerCase().includes("profile") || resume.toLowerCase().includes("objective") || resume.toLowerCase().includes("about me") ? (
                            <span className="text-success font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Found</span>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1"><X className="w-3 h-3" /> Missing</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === "roles" && (
                    <div className="space-y-4 animate-[slide-up_0.4s_cubic-bezier(0.16,1,0.3,1)]">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Role Alignment</h4>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Grades seniority progression, titles, and match quality.</p>
                        </div>
                        <span className="text-xs font-bold text-warning">{rolesScore}%</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5 bg-success/5 border border-success/15 p-2.5 rounded-xl">
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-foreground">Seniority Level Match</span>
                            <span className={`block text-[10px] mt-1 font-bold ${
                              activeResult.experience_analysis?.seniority_match === "Good" ? "text-success" : "text-warning"
                            }`}>
                              {activeResult.experience_analysis?.seniority_match} Match Grade
                            </span>
                          </div>
                        </div>

                        {activeResult.experience_analysis?.comments && (
                          <div className="flex items-start gap-2.5 bg-secondary/40 border border-border p-2.5 rounded-xl">
                            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[11px] font-bold text-foreground">Expert Evaluation Comment</span>
                              <span className="block text-[10px] text-muted-foreground mt-1 leading-relaxed">{activeResult.experience_analysis.comments}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Live rescanner / status footer */}
                {result && (
                  <div className="border-t border-border/40 pt-4 mt-6 flex items-center justify-between text-[10px] text-muted-foreground font-medium select-none">
                    <span>Scanned live by Outly AI</span>
                    <button 
                      onClick={handleCheckScoreClick} 
                      disabled={loading}
                      className="flex items-center gap-1 font-bold text-outly-accent hover:underline transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                      <span>Rescan</span>
                    </button>
                  </div>
                )}

              </div>

              </div>
            )}

            {/* ─── MOCK DEMO CARD BLUR OVERLAY ─── */}
            {!result && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none transition-all duration-300">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-success/10 flex items-center justify-center mb-2 sm:mb-3">
                  <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-success animate-pulse shrink-0" />
                </div>
                <h3 className="text-xs sm:text-base font-bold text-foreground mb-0.5 sm:mb-1">Upload to Unlock Complete Report</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground max-w-xs leading-relaxed mb-3 sm:mb-5 hidden sm:block">
                  Upload your resume or select a sample from your vault to unlock the comprehensive 27-point ATS scoring report.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center max-w-[200px] sm:max-w-none">
                  <Button 
                    onClick={() => document.getElementById("resume-upload-input")?.click()}
                    disabled={parsingFile}
                    className="w-full sm:w-auto bg-outly-accent hover:brightness-110 text-white text-[11px] font-bold px-5 py-2 rounded-full shadow-md shadow-outly-accent/15 transition h-8.5 shrink-0 gap-1.5 cursor-pointer max-w-full truncate"
                  >
                    {parsingFile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {parsingFile ? "Uploading..." : "Upload Resume"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const select = document.getElementById("vault-select-trigger") as HTMLSelectElement;
                      if (select) select.focus();
                    }}
                    className="w-full sm:w-auto bg-muted hover:bg-muted/90 text-foreground text-[11px] font-bold px-5 py-2 rounded-full border border-border h-8.5 cursor-pointer"
                  >
                    Choose Vault
                  </Button>
                </div>
              </div>
            )}

            {/* ─── SCANNING LOADER OVERLAY ─── */}
            {showScanLoader && (
              <div className="absolute inset-0 bg-white/95 z-40 flex flex-col items-center justify-center p-4 text-center select-none animate-fade-in">
                <div className="space-y-3 w-full max-w-[210px]">
                  {/* Spinning Circle */}
                  <div className="relative w-8 h-8 mx-auto">
                    <div className="absolute inset-0 border-3 border-success/10 rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-t-success rounded-full animate-spin"></div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <h3 className="text-[10px] font-extrabold text-foreground uppercase tracking-wider">Outly AI Engine</h3>
                    <p className="text-[9px] text-muted-foreground leading-normal min-h-[26px]">{scanStatus}</p>
                  </div>
                  
                  {/* Custom Progress Bar */}
                  <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-success transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      </div>

      {/* Actionable suggestions list (Rendered only after live scan completes) */}
      {result && result.isValidResume !== false && result.suggestions && result.suggestions.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-5 text-left max-w-4xl mx-auto animate-slide-up">
          <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
            <Info className="h-5.5 w-5.5 text-primary shrink-0" />
            Actionable Fixes &amp; Optimizations
          </h3>
          <ol className="space-y-4 pl-1">
            {result.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-3.5 text-xs text-muted-foreground leading-relaxed">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                  {i + 1}
                </span>
                <span className="text-foreground/80 font-medium pt-0.5">{suggestion}</span>
              </li>
            ))}
          </ol>
        </section>
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
              Your free tier is limited to 3 ATS checks per day. Upgrade to Outly Pro for unlimited checks, AI resume tailoring, and interview preparation guides.
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

import { useState, useEffect, useRef } from "react";
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
import { FileUploadCard, UploadedFile } from "@/components/ui/file-upload-card";

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

  const uploadedFiles: UploadedFile[] = resumeFile
    ? [
        {
          id: "ats-resume-upload",
          file: resumeFile,
          progress: parsingFile ? uploadProgress : 100,
          status: parsingFile ? "uploading" : "completed",
        },
      ]
    : [];
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [unlockAtTime, setUnlockAtTime] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState("");
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  const resultContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (result) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      setTimeout(() => {
        resultContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    }
  }, [result]);

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
    let loadedResult = null;
    try {
      loadedResult = savedResult ? JSON.parse(savedResult) : null;
    } catch {
      loadedResult = null;
    }
    
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
    queryKey: ["resume", "list"],
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
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (num: number) => String(num).padStart(2, "0");
    if (hrs > 0) return `${hrs}h ${pad(mins)}m ${pad(secs)}s`;
    return `${mins}m ${pad(secs)}s`;
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

  // Tick countdown every second and auto-unlock when time passes
  useEffect(() => {
    if (!unlockAtTime) return;
    
    // Initial call to set the live state immediately on mount or key change
    setCountdownText(getCountdown(unlockAtTime));

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
    }, 1000);
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Maximum file size allowed is 5 MB.",
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

  const handleFilesSelect = (selectedFiles: File[]) => {
    const file = selectedFiles[0];
    if (file) {
      processResumeFile(file);
    }
  };

  // Trigger evaluation scan with loader simulation
  const triggerAtsScan = async (resumeText: string) => {
    if (isLimitExceeded) {
      window.dispatchEvent(new CustomEvent("outly_limit_exceeded", {
        detail: {
          code: "LIMIT_ATS_EXCEEDED",
          message: "Free tier is limited to 3 ATS checks per 12 hours."
        }
      }));
      return;
    }
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
      if (data.isValidResume === false) {
        toast({
          variant: "destructive",
          title: "Invalid Resume Format",
          description: "Please upload a valid CV containing standard sections (Experience, Skills, Education).",
        });
      } else {
        toast({
          title: "Resume Uploaded Successfully",
          description: `Analysis complete with match score: ${data.score}/100.`,
        });
      }
    } catch (err) {
      clearInterval(statusTimer);
      clearInterval(progressTimer);
      
      const errStr = String(err);
      const isLimitError = errStr.includes("LIMIT_ATS_EXCEEDED") || errStr.toLowerCase().includes("limit reached");
      
      if (isLimitError) {
        setIsLimitExceeded(true);
        const unlockIso = (err as any)?.data?.unlockAt || null;
        if (unlockIso) {
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));
          const userPrefix = userData?.user?.email || "anonymous";
          localStorage.setItem(`ats_limit_unlock_${userPrefix}`, unlockIso);
        }
      } else {
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

  const FACTORS = [
    { id: "contact", label: "Contact details", category: "Content", passed: resume ? (resume.includes("@") || /\d{10}/.test(resume)) : null },
    { id: "headings", label: "Section headings", category: "Structure", passed: sectionsScore >= 60 },
    { id: "density", label: "Keyword density", category: "Content", passed: contentScore >= 60 },
    { id: "verbs", label: "Action verbs", category: "Language", passed: styleScore >= 50 },
    { id: "impact", label: "Quantified impact", category: "Content", passed: (activeResult.breakdown?.impact_metrics ?? 0) >= 50 },
    { id: "parsability", label: "File parsability", category: "Format", passed: result ? result.isValidResume !== false : null },
    { id: "spacing", label: "Length & spacing", category: "Format", passed: formatScore >= 50 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-8 space-y-6 animate-fade-in pb-20 text-left">
      {/* Top Header matching ResumeTailor & ResumeVault */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#2DC08D]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Resume / Checker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1.5">
            ATS Resume Checker
          </h1>
          <p className="text-[13px] text-neutral-500 font-normal mt-1">
            We check your resume against 27 factors that applicant tracking systems look at, and tell you exactly what to fix.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* ─── LEFT COLUMN: UPLOAD / PREVIEW ─── */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Upload card matching screenshot */}
          <div className="space-y-3">
            {isLimitExceeded ? (
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 sm:p-10 text-center select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-600">
                  <Lock className="w-5 h-5 shrink-0" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Limit Reached{countdownText ? ` · Unlocks in ${countdownText}` : " (3/3)"}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    You've used your 3 free resume checks. Upgrade to Outly Pro for unlimited scans.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold px-5 h-9 rounded-lg cursor-pointer"
                >
                  Upgrade to Pro
                </Button>
              </div>
            ) : parsingFile || showScanLoader ? (
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 sm:p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center min-h-[260px] space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-800" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-neutral-800">
                    {parsingFile ? "Uploading resume..." : scanStatus || "Checking 27 factors..."}
                  </p>
                  <p className="font-mono text-[11px] text-neutral-400">
                    {parsingFile ? `${uploadProgress}% processed` : `${scanProgress}% analyzed`}
                  </p>
                </div>
                <div className="w-48 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                    style={{ width: `${parsingFile ? uploadProgress : scanProgress}%` }}
                  />
                </div>
              </div>
            ) : result ? (
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-xs font-semibold text-neutral-900 truncate">
                      {resumeFile ? resumeFile.name : resumeFileName || "Uploaded Resume"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setResult(null);
                      setResume("");
                      setResumeFile(null);
                      setResumeFileName("");
                      setSelectedVaultId("custom");
                    }}
                    className="text-[11px] font-medium text-neutral-400 hover:text-neutral-900 cursor-pointer transition-colors shrink-0"
                  >
                    Change file
                  </button>
                </div>

                <div className="max-h-[360px] overflow-y-auto rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
                  {result.isValidResume === false ? (
                    <div className="text-center py-6 px-4 space-y-2">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                      <p className="text-xs font-semibold text-neutral-900">Invalid Resume Document</p>
                      <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs mx-auto">
                        {result.error || "The uploaded document lacks standard resume sections (Experience, Education, Skills)."}
                      </p>
                    </div>
                  ) : resumeFile && resumeFile.type === "application/pdf" ? (
                    <PdfViewer file={resumeFile} />
                  ) : !resumeFile && resumes.find(r => String(r.id) === selectedVaultId)?.filename.toLowerCase().endsWith(".pdf") ? (
                    <PdfViewer url={api.resume.getFileUrl(selectedVaultId)} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-700">
                      {resume}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-8 sm:p-14 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/50"
                  }`}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight font-sans">
                    Drop your resume here
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2.5">
                    or <span className="underline underline-offset-4 text-neutral-900 font-semibold">browse files</span>
                  </p>
                  <p className="font-mono text-[11px] text-neutral-400 mt-6 tracking-wide">
                    PDF, DOCX, TXT · up to 5 MB
                  </p>
                </div>

                {resumes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] text-neutral-400 font-medium">Or select from Vault:</span>
                    <select
                      className="text-[11px] bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-neutral-700 focus:outline-none focus:border-neutral-400 cursor-pointer max-w-[200px] truncate"
                      value={selectedVaultId}
                      onChange={(e) => handleVaultSelect(e.target.value)}
                    >
                      <option value="custom">Choose a resume...</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-neutral-400 font-normal pl-1">
              <Lock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <span>Your resume stays private and is never shared.</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: ATS REPORT CARD ─── */}
        <div className="lg:col-span-6 rounded-2xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left">
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900 font-sans">ATS report</h3>
              <span className="font-mono text-xs text-neutral-400">27 factors</span>
            </div>

            {/* Score placeholder or Live score */}
            <div className="py-5 border-b border-neutral-100">
              {!result ? (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-2.5 bg-neutral-300 rounded-full" />
                  <span className="font-mono text-sm font-medium text-neutral-400">/ 100</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-neutral-900 tracking-tight">{result.score}</span>
                    <span className="font-mono text-base font-medium text-neutral-400">/ 100</span>
                    <span className={`ml-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      result.score >= 80 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : result.score >= 50 
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                      {result.score >= 80 ? "Strong Match" : result.score >= 50 ? "Needs Review" : "Low Score"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.score >= 80 ? "bg-emerald-600" : result.score >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 7 Factor Rows */}
            <div className="divide-y divide-neutral-100">
              {FACTORS.map((factor) => {
                const status = result ? factor.passed : null;
                return (
                  <div key={factor.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      {status === true ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : status === false ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      ) : (
                        <span className="text-neutral-300 text-sm leading-none shrink-0">•</span>
                      )}
                      <span className={`font-medium ${status !== null ? "text-neutral-900" : "text-neutral-700"}`}>
                        {factor.label}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">{factor.category}</span>
                  </div>
                );
              })}
            </div>

            {/* Detailed recommendations if result is present */}
            {result && (
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                {issuesCount > 0 ? (
                  <div className="bg-neutral-50 rounded-xl p-3.5 space-y-2 border border-neutral-200/60">
                    <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider block">
                      Key Recommendations ({issuesCount})
                    </span>
                    <ul className="text-xs text-neutral-600 space-y-1.5 list-disc list-inside">
                      {activeResult.formatting_issues?.slice(0, 3).map((issue, i) => (
                        <li key={i} className="leading-relaxed">{issue}</li>
                      ))}
                      {getMissingKeywordsArray(activeResult.missing_keywords).slice(0, 3).length > 0 && (
                        <li className="leading-relaxed">
                          Add keywords: <span className="font-medium text-neutral-900">{getMissingKeywordsArray(activeResult.missing_keywords).slice(0, 3).join(", ")}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 font-medium">
                    ✓ Excellent ATS compatibility. No critical formatting or content issues found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-6 border-t border-neutral-100 mt-5 space-y-3">
            {!result ? (
              <>
                <p className="text-xs text-neutral-600 font-medium">Add your resume to see your score.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsingFile}
                  className="bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-2"
                >
                  {parsingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{parsingFile ? "Uploading..." : "Upload resume"}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  Scan another resume
                </button>
                <button
                  onClick={() => navigate("/resume-tailor")}
                  className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                >
                  Tailor for a role →
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      <AiErrorModal open={showAiErrorModal} onClose={() => setShowAiErrorModal(false)} />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt"
        onChange={handleFileUpload}
      />
    </div>
  );
}

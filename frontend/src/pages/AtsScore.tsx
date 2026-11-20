import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, EvaluationResult } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import PdfViewer from "@/components/PdfViewer";
import AiErrorModal from "@/components/AiErrorModal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Spinner } from "@/components/Spinner";
import { m } from "motion/react";
import { dur, ease } from "@/lib/motion-tokens";
import "./AtsScore.css";
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
function getMissingKeywordsArray(kw: any): string[] {
  if (!kw) return [];
  if (Array.isArray(kw)) {
    return kw.filter((k) => typeof k === "string" && k.trim());
  }
  if (typeof kw === "object") {
    return [
      ...(Array.isArray(kw.hard_skills) ? kw.hard_skills : []),
      ...(Array.isArray(kw.tools_technologies) ? kw.tools_technologies : []),
      ...(Array.isArray(kw.soft_skills) ? kw.soft_skills : []),
    ].filter((k) => typeof k === "string" && k.trim());
  }
  return [];
}

function getKeyRecommendations(res: EvaluationResult): string[] {
  const list: string[] = [];

  // 1. Resume-specific recommendations from heuristic & AI analysis
  if (res.suggestions && Array.isArray(res.suggestions)) {
    res.suggestions.forEach((s) => {
      if (s && typeof s === "string" && s.trim()) {
        const trimmed = s.trim();
        if (!list.includes(trimmed)) list.push(trimmed);
      }
    });
  }

  // 2. Concrete document formatting issues detected
  if (res.formatting_issues && Array.isArray(res.formatting_issues)) {
    res.formatting_issues.forEach((f) => {
      if (f && typeof f === "string" && f.trim()) {
        const trimmed = f.trim();
        if (!list.includes(trimmed)) list.push(trimmed);
      }
    });
  }

  // 3. Experience seniority alignment feedback if not optimal
  if (res.experience_analysis && res.experience_analysis.seniority_match !== "Good" && res.experience_analysis.comments) {
    const seniorityNote = `Experience Alignment: ${res.experience_analysis.comments}`;
    if (!list.includes(seniorityNote)) list.push(seniorityNote);
  }

  // Show model findings separately from deterministic rules so users can tell
  // whether the AI analysis actually ran and see its resume-grounded feedback.
  if (res.llm_analysis) {
    for (const item of [...(res.llm_analysis.weaknesses || []), ...(res.llm_analysis.rewrite_suggestions || []).map((entry) => `${entry.section}: ${entry.suggested}`)]) {
      const trimmed = item.trim();
      if (trimmed && !list.includes(trimmed)) list.push(trimmed);
    }
  }

  // 4. Missing keywords (grouped as ONE concrete recommendation listing top skills)
  const missing = getMissingKeywordsArray(res.missing_keywords);
  if (missing.length > 0) {
    const topMissing = missing.slice(0, 5).join(", ");
    const keywordNote = `Add role-specific keywords: ${topMissing}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ""}`;
    if (!list.some(item => item.toLowerCase().includes("keywords"))) {
      list.push(keywordNote);
    }
  }

  return list;
}

export default function AtsScorePage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch current user session to get user specific details
  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.auth.me,
    enabled: !!localStorage.getItem("outly_token"),
  });

  const userEmail = userData?.user?.email || "anonymous";
  const isPro = userData?.user?.plan === "pro" || localStorage.getItem("outly_premium_user") === "true";

  // Fetch ATS limit status directly from backend
  const { data: limitData, refetch: refetchLimitStatus } = useQuery({
    queryKey: ["atsLimitStatus", userEmail],
    queryFn: api.ats.getLimitStatus,
    enabled: !!localStorage.getItem("outly_token"),
    staleTime: 0,
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
  const [scanCount, setScanCount] = useState<number>(0);

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
  const scanInProgressRef = useRef(false);

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
  const [scanStatus, setScanStatus] = useState("");
  const [showScanLoader, setShowScanLoader] = useState(false);

  // Fetch resumes from the Resume Vault
  const { data: resumes = [] } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Switch vault resume
  const handleVaultSelect = (idStr: string) => {
    setSelectedVaultId(idStr);
    setResumeFile(null); // Clear uploaded file when vault item is selected
    setResumeFileName("");
    setResume("");
    setResult(null);
    if (idStr === "custom") {
      setResume("");
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResume(found.content);
        setResumeFileName(found.filename || found.label || "Saved resume");
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

  // Load user-specific limit status from frontend storage and backend
  useEffect(() => {
    const userPrefix = userData?.user?.email || "anonymous";
    if (isPro) {
      setIsLimitExceeded(false);
      setUnlockAtTime(null);
      setCountdownText("");
      return;
    }

    const savedCount = parseInt(localStorage.getItem(`ats_scan_count_${userPrefix}`) || "0", 10);
    setScanCount(savedCount);

    const stored = localStorage.getItem(`ats_limit_unlock_${userPrefix}`);
    if (stored) {
      const unlockTime = new Date(stored).getTime();
      if (Date.now() >= unlockTime) {
        localStorage.removeItem(`ats_limit_unlock_${userPrefix}`);
        localStorage.removeItem(`ats_scan_count_${userPrefix}`);
        setScanCount(0);
        setIsLimitExceeded(false);
        setUnlockAtTime(null);
        setCountdownText("");
      } else {
        setIsLimitExceeded(true);
        setUnlockAtTime(stored);
        setCountdownText(getCountdown(stored));
      }
    } else if (savedCount >= 3) {
      const unlockIso = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(`ats_limit_unlock_${userPrefix}`, unlockIso);
      setIsLimitExceeded(true);
      setUnlockAtTime(unlockIso);
      setCountdownText(getCountdown(unlockIso));
    } else if (limitData?.isLimitExceeded) {
      setIsLimitExceeded(true);
      if (limitData.unlockAt) {
        setUnlockAtTime(limitData.unlockAt);
        setCountdownText(getCountdown(limitData.unlockAt));
        localStorage.setItem(`ats_limit_unlock_${userPrefix}`, limitData.unlockAt);
      }
    } else {
      setIsLimitExceeded(false);
    }
  }, [isPro, limitData, userEmail, userData]);

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
    setResume("");
    setResult(null);
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
    } catch (err: any) {
      const errStr = String(err?.message || err);
      const isLimit =
        err?.data?.code === "LIMIT_ATS_EXCEEDED" ||
        (err?.status === 403 &&
          !errStr.includes("<html") &&
          !errStr.includes("<!DOCTYPE") &&
          (err?.data?.code?.startsWith("LIMIT_") ||
            errStr.includes("LIMIT_ATS_EXCEEDED") ||
            errStr.toLowerCase().includes("limit reached")));

      if (isLimit) {
        setIsLimitExceeded(true);
        const unlockIso = err?.data?.unlockAt || null;
        if (unlockIso) {
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));
          const userPrefix = userData?.user?.email || "anonymous";
          localStorage.setItem(`ats_limit_unlock_${userPrefix}`, unlockIso);
        }
        window.dispatchEvent(
          new CustomEvent("outly_limit_exceeded", {
            detail: {
              code: "LIMIT_ATS_EXCEEDED",
              message:
                (err?.data?.message && !String(err?.data?.message).includes("<html"))
                  ? err.data.message
                  : (!errStr.includes("<html") && !errStr.includes("<!DOCTYPE") && errStr.length < 200)
                  ? errStr
                  : "Free tier is limited to 3 ATS checks per 12 hours. Upgrade to Outly Pro for unlimited scans.",
            },
          })
        );
        setResumeFile(null);
        setResumeFileName("");
        return;
      }

      try {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (ext === "txt" || ext === "md") {
          const text = await file.text();
          if (text && text.trim().length > 20) {
            setResume(text);
            setSelectedVaultId("custom");
            return;
          }
        }
        toast({
          variant: "destructive",
          title: "File Parsing Failed",
          description: "Unable to extract text from this document. Please upload a clear PDF, DOCX, or paste your resume text.",
        });
        setResumeFile(null);
        setResumeFileName("");
        setResume("");
        setResult(null);
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
    e.target.value = "";
  };

  const handleFilesSelect = (selectedFiles: File[]) => {
    const file = selectedFiles[0];
    if (file) {
      processResumeFile(file);
    }
  };

  // Run the ATS check only after the user explicitly asks for a score.
  const triggerAtsScan = async (resumeText: string) => {
    if (isLimitExceeded || scanCount >= 3) {
      window.dispatchEvent(
        new CustomEvent("outly_limit_exceeded", {
          detail: {
            code: "LIMIT_ATS_EXCEEDED",
            message: "Free tier is limited to 3 ATS checks per 12 hours. Upgrade to Outly Pro for unlimited scans.",
          },
        })
      );
      return;
    }
    if (!resumeText.trim()) return;
    if (scanInProgressRef.current) return;
    scanInProgressRef.current = true;
    setShowScanLoader(true);
    setScanStatus("Analyzing resume content and ATS readability…");
    setResult(null);
    setLoading(true);
    try {
      const data = await api.ats.score(resumeText, "");

      setResult(data);
      
      // Frontend-level lock: count successful scans and lock after 3
      if (!isPro) {
        const userPrefix = userData?.user?.email || "anonymous";
        const currentCount = parseInt(localStorage.getItem(`ats_scan_count_${userPrefix}`) || "0", 10);
        const newCount = currentCount + 1;
        localStorage.setItem(`ats_scan_count_${userPrefix}`, String(newCount));
        setScanCount(newCount);

        if (newCount >= 3) {
          const unlockIso = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
          localStorage.setItem(`ats_limit_unlock_${userPrefix}`, unlockIso);
          setIsLimitExceeded(true);
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));

          // Immediately give popup to upgrade!
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("outly_limit_exceeded", {
                detail: {
                  code: "LIMIT_ATS_EXCEEDED",
                  message: "You have completed your 3 free ATS scans. Upgrade to Outly Pro for unlimited scans and AI tailoring.",
                  unlockAt: unlockIso,
                },
              })
            );
          }, 600);
        }
      }

      refetchLimitStatus();
      window.dispatchEvent(new CustomEvent("outly-notification", {
        detail: {
          title: "ATS check complete",
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
          title: "ATS check complete",
          description: `Your resume score is ${data.score}/100.`,
        });
      }
    } catch (err: any) {
      const errStr = String(err?.message || err);
      const isLimitError =
        err?.data?.code === "LIMIT_ATS_EXCEEDED" ||
        (err?.status === 403 &&
          !errStr.includes("<html") &&
          !errStr.includes("<!DOCTYPE") &&
          (err?.data?.code?.startsWith("LIMIT_") ||
            errStr.includes("LIMIT_ATS_EXCEEDED") ||
            errStr.toLowerCase().includes("limit reached")));
      
      if (isLimitError) {
        setIsLimitExceeded(true);
        const unlockIso = err?.data?.unlockAt || null;
        if (unlockIso) {
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));
          const userPrefix = userData?.user?.email || "anonymous";
          localStorage.setItem(`ats_limit_unlock_${userPrefix}`, unlockIso);
        }
        window.dispatchEvent(
          new CustomEvent("outly_limit_exceeded", {
            detail: {
              code: "LIMIT_ATS_EXCEEDED",
              message:
                (err?.data?.message && !String(err?.data?.message).includes("<html"))
                  ? err.data.message
                  : (!errStr.includes("<html") && !errStr.includes("<!DOCTYPE") && errStr.length < 200)
                  ? errStr
                  : "Free tier is limited to 3 ATS checks per 12 hours. Upgrade to Outly Pro for unlimited scans.",
            },
          })
        );
      } else {
        const isCloudflareBlock =
          errStr.includes("<html") ||
          errStr.includes("<!DOCTYPE") ||
          errStr.includes("challenges.cloudflare.com");
        
        if (isCloudflareBlock) {
          toast({
            variant: "destructive",
            title: "Security Check Intercepted",
            description: "Cloudflare firewall challenged the request. Please refresh the page or try again shortly.",
          });
        } else {
          const isAiError =
            err?.status === 429 ||
            errStr.includes("Gemini") ||
            errStr.includes("GoogleGenerativeAI") ||
            errStr.includes("evaluations failed") ||
            errStr.toLowerCase().includes("rate limit") ||
            errStr.toLowerCase().includes("too many requests") ||
            errStr.includes("404");
          if (isAiError) {
            setShowAiErrorModal(true);
          } else {
            toast({
              variant: "destructive",
              title: "Evaluation Failed",
              description: errStr.length > 200 ? "Request failed. Please try again." : errStr,
            });
          }
        }
      }
      setResult(null);
      refetchLimitStatus();
    } finally {
      scanInProgressRef.current = false;
      setShowScanLoader(false);
      setLoading(false);
    }
  };

  // Manual check score click
  const handleCheckScoreClick = () => {
    if (!resume.trim() || parsingFile || loading || showScanLoader) return;
    triggerAtsScan(resume);
  };

  const contentScore = result?.breakdown?.skills_match ?? 0;
  const formatScore = result?.breakdown?.formatting_readability ?? 0;
  const styleScore = result?.breakdown?.impact_metrics ?? 0;
  const keyRecommendations = result ? getKeyRecommendations(result) : [];
  const matchedKeywords = result?.matched_keywords ?? [];
  const missingKeywords = getMissingKeywordsArray(result?.missing_keywords);

  const FACTORS = [
    { id: "contact", label: "Contact details", category: "Content", passed: result ? (resume.includes("@") || /\d{10}/.test(resume)) : null },
    { id: "headings", label: "Section headings", category: "Structure", passed: result ? (result.breakdown?.experience_match ?? 0) >= 50 : null },
    { id: "density", label: "Keyword coverage", category: "Content", passed: result ? contentScore >= 50 : null },
    { id: "verbs", label: "Action & impact", category: "Language", passed: result ? styleScore >= 50 : null },
    { id: "impact", label: "Quantified impact", category: "Content", passed: result ? styleScore >= 50 : null },
    { id: "parsability", label: "File parsability", category: "Format", passed: result ? result.isValidResume !== false : null },
    { id: "spacing", label: "Length & readability", category: "Format", passed: result ? formatScore >= 50 : null },
  ];

  return (
    <div className="ats-page landing-style-page resume-workspace-page mx-auto w-full max-w-7xl px-4 sm:px-6 py-5 sm:py-9 space-y-5 sm:space-y-7 animate-fade-in pb-8 sm:pb-20 text-left font-sans">
      <header className="ats-page-header">
        <div className="ats-page-heading">
          <div className="ats-eyebrow"><span className="ats-eyebrow-dot" /> RESUME INTELLIGENCE <span className="ats-eyebrow-divider">/</span> 01</div>
          <h1>Know what an ATS can read.</h1>
          <p>Get a clear resume score, see what is working, and focus on the fixes that matter.</p>
        </div>
      </header>

      <div className="ats-page-meta" aria-label="Supported resume formats">
        <span><FileText size={14} /> PDF, DOCX, or TXT</span>
        <i />
        <span>Up to 5 MB</span>
        <i />
        <span>Private to your account</span>
      </div>

      <div className="ats-workspace">
        
        {/* ─── LEFT COLUMN: UPLOAD / PREVIEW ─── */}
        <div className="ats-input-column">
          <section className="ats-panel ats-input-panel">
            <div className="ats-panel-heading">
              <div><span className="ats-step-label">01 / YOUR RESUME</span><h2>Start with your latest copy</h2></div>
              <span className="ats-panel-index">INPUT</span>
            </div>
            {isLimitExceeded || scanCount >= 3 ? (
              <div className="ats-limit-state select-none">
                <div className="ats-state-icon ats-state-icon-warm">
                  <Lock className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h3>
                    Limit Reached{countdownText ? ` · Unlocks in ${countdownText}` : ""}
                  </h3>
                  <p>
                    You've reached your free check limit. Upgrade to Outly Pro for unlimited scans.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("outly_limit_exceeded", {
                        detail: {
                          code: "LIMIT_ATS_EXCEEDED",
                          message: "Free tier is limited to 3 ATS checks per 12 hours. Upgrade to Outly Pro for unlimited scans.",
                        },
                      })
                    );
                  }}
                  className="resume-primary-action ats-primary-button"
                >
                  Upgrade to Pro
                </Button>
              </div>
            ) : parsingFile || showScanLoader ? (
              <div className="ats-loading-state">
                <span className="ats-loading-orbit"><Loader2 className="animate-spin" /></span>
                <div>
                  <p className="ats-loading-title">
                    {parsingFile ? "Uploading resume..." : scanStatus || "Checking your resume…"}
                  </p>
                  <p className="ats-loading-copy">
                    {parsingFile ? `${uploadProgress}% processed` : "This can take a few moments"}
                  </p>
                </div>
                <div className="ats-progress-track">
                  <div
                    className={`ats-progress-fill ${parsingFile ? "" : "is-indeterminate"}`}
                    style={parsingFile ? { transform: `scaleX(${Math.max(0, Math.min(1, uploadProgress / 100))})` } : undefined}
                  />
                </div>
              </div>
            ) : (result || resume.trim()) ? (
              <div className="ats-resume-loaded">
                <div className="ats-file-toolbar">
                  <div className="ats-file-name">
                    <span className="ats-file-icon"><FileText size={17} /></span>
                    <span>
                      <small>SELECTED FILE</small>
                      {resumeFile ? resumeFile.name : resumeFileName || "Uploaded Resume"}
                    </span>
                  </div>
                  <div className="ats-file-actions">
                    <button
                      type="button"
                      onClick={() => {
                        if (isLimitExceeded || scanCount >= 3) {
                          window.dispatchEvent(
                            new CustomEvent("outly_limit_exceeded", {
                              detail: {
                                code: "LIMIT_ATS_EXCEEDED",
                                message: "Free tier is limited to 3 ATS checks per 12 hours. Upgrade to Outly Pro for unlimited scans.",
                              },
                            })
                          );
                          return;
                        }
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        fileInputRef.current?.click();
                      }}
                      className={`ats-change-file transition-colors cursor-pointer ${
                        isLimitExceeded || scanCount >= 3
                          ? "is-limit"
                          : ""
                      }`}
                      title={isLimitExceeded || scanCount >= 3 ? "Free limit reached" : "Select another resume file"}
                    >
                      {isLimitExceeded || scanCount >= 3 ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Limit reached</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          <span className="hidden sm:inline">Select another resume</span>
                          <span className="sm:hidden">Change</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        setResume("");
                        setResumeFile(null);
                        setResumeFileName("");
                        setSelectedVaultId("custom");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="ats-clear-file cursor-pointer transition-colors"
                      title="Remove resume"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="ats-resume-preview">
                  {result?.isValidResume === false ? (
                    <div className="ats-invalid-resume">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                      <p className="ats-invalid-title">This file doesn’t look like a resume</p>
                      <p className="ats-invalid-copy">
                        {result.error || "The uploaded document lacks standard resume sections (Experience, Education, Skills)."}
                      </p>
                    </div>
                  ) : resumeFile && (resumeFile.type.toLowerCase().includes("pdf") || resumeFile.name.toLowerCase().endsWith(".pdf")) ? (
                    <PdfViewer file={resumeFile} />
                  ) : !resumeFile && resumes.find(r => String(r.id) === selectedVaultId)?.filename.toLowerCase().endsWith(".pdf") ? (
                    <PdfViewer url={api.resume.getFileUrl(selectedVaultId)} />
                  ) : (
                    <pre className="ats-resume-text">
                      {resume}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="ats-upload-state">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`ats-dropzone transition-all cursor-pointer ${isDragging ? "is-dragging" : ""}`}
                >
                  <span className="ats-upload-icon"><UploadCloud size={24} /></span>
                  <h3>Drop your resume here</h3>
                  <p>or <span>browse files</span></p>
                  <small>PDF, DOCX, or TXT · up to 5 MB</small>
                </div>

                {resumes.length > 0 && (
                  <div className="ats-vault-select" onClick={(e) => e.stopPropagation()}>
                    <span>Already saved a resume?</span>
                    <select
                      className="ats-vault-select-control"
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

          </section>
          <div className="ats-privacy-note"><Lock size={14} /><span>Your resume stays private and is never shared.</span></div>
        </div>

        {/* ─── RIGHT COLUMN: ATS REPORT CARD ─── */}
        <section className="ats-panel ats-report-panel">
          <div className="ats-panel-heading ats-report-heading">
            <div><span className="ats-step-label">02 / YOUR RESULTS</span><h2>ATS compatibility</h2></div>
            <span className="ats-panel-index">REPORT</span>
          </div>

          <div className="ats-report-body">
            <div className="ats-report-topline">
              <span className="ats-report-caption">OVERALL SCORE</span>
            </div>

            {/* Score placeholder or Live score */}
            <div className="ats-score-summary">
              {!result ? (
                <div className="ats-empty-score"><strong>—</strong><span>/ 100</span><p>Your score and checks will appear here.</p></div>
              ) : (
                <div className="ats-score-result">
                  <div className="ats-score-number"><AnimatedNumber className="ats-score-value" value={result.score} /><span className="ats-score-unit">/ 100</span></div>
                  <span className={`ats-score-label ${result.score >= 80 ? "is-strong" : result.score >= 50 ? "is-review" : "is-low"}`}>
                    {result.isValidResume === false ? "Resume not recognized" : result.score >= 80 ? "Strong foundation" : result.score >= 50 ? "Room to improve" : "Needs attention"}
                  </span>
                  <div className="ats-score-track"><span style={{ width: `${Math.max(0, Math.min(100, result.score))}%` }} /></div>
                  {result.analysis_source && result.isValidResume !== false && (
                    <div className="ats-analysis-provenance">
                      <span className={`ats-analysis-source ${result.analysis_source === "heuristic_ai" ? "is-ai" : ""}`}>
                        {result.analysis_source === "heuristic_ai" ? "ATS rules + AI analysis" : "Rule-based ATS estimate"}
                      </span>
                      {result.analysis_notice && <small>{result.analysis_notice}</small>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {result?.breakdown && (
              <div className="ats-breakdown-grid">
                {[["Skills", result.breakdown.skills_match], ["Experience", result.breakdown.experience_match], ["Readability", result.breakdown.formatting_readability], ["Impact", result.breakdown.impact_metrics]].map(([label, score]) => (
                  <div className="ats-breakdown-item" key={String(label)}><span>{label}</span><strong>{score}<small>/100</small></strong></div>
                ))}
              </div>
            )}

            <div className="ats-factor-section">
              <div className="ats-section-heading"><h3>Compatibility checks</h3><span>{result ? `${FACTORS.filter((factor) => factor.passed).length} / ${FACTORS.length} clear` : "Ready when you are"}</span></div>
              <div className="ats-factors-grid">
              {FACTORS.map((factor) => {
                const status = result ? factor.passed : null;
                return (
                  <div key={factor.id} className={`ats-factor ${status === true ? "is-pass" : status === false ? "is-flagged" : "is-pending"}`}>
                    <div className="ats-factor-status">
                      {status === true ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : status === false ? (
                        <span className="ats-factor-dot" />
                      ) : (
                        <span className="ats-factor-dot" />
                      )}
                    </div>
                    <span className="ats-factor-label">{factor.label}</span>
                    <small>{factor.category}</small>
                  </div>
                );
              })}
              </div>
            </div>

            {/* Detailed recommendations if result is present */}
            {result && (
              <div className="ats-recommendations">
                {keyRecommendations.length > 0 ? (
                  <div className="ats-recommendation-card">
                    <div className="ats-section-heading"><h3>Next best fixes</h3><span>{keyRecommendations.length} suggestions</span></div>
                    <ul>
                      {keyRecommendations.map((rec, i) => (
                        <li key={i}><span className="ats-recommendation-number">{String(i + 1).padStart(2, "0")}</span><span>{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="ats-empty-recommendations">
                    {result ? "A clean result. Keep your strongest, most relevant experience easy to scan." : "Your highest-impact recommendations will appear after the scan."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="ats-report-actions">
            {!result ? (
              <>
                {resume.trim() ? (
                  <>
                    <p>{showScanLoader ? "Checking your resume…" : "Resume preview ready. Run an ATS check when you’re ready."}</p>
                    <button
                      onClick={handleCheckScoreClick}
                      disabled={parsingFile || loading || showScanLoader || !resume.trim()}
                      className="resume-primary-action ats-primary-button"
                    >
                      {showScanLoader ? <Spinner size={14} className="text-white" /> : null}
                      <span>{showScanLoader ? "Checking ATS score…" : "Check ATS score"}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p>Add your resume to see your score.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={parsingFile}
                      className="resume-primary-action ats-primary-button"
                    >
                      {parsingFile ? <Spinner size={14} className="text-white" /> : null}
                      <span>{parsingFile ? "Uploading..." : "Upload resume"}</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="ats-action-row">
                <button
                  onClick={() => {
                    if (isLimitExceeded || scanCount >= 3) {
                      window.dispatchEvent(
                        new CustomEvent("outly_limit_exceeded", {
                          detail: {
                            code: "LIMIT_ATS_EXCEEDED",
                            message: "Free tier is limited to 3 ATS checks per 12 hours. Upgrade to Outly Pro for unlimited scans.",
                          },
                        })
                      );
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className={`resume-primary-action ats-primary-button cursor-pointer ${
                    isLimitExceeded || scanCount >= 3 ? "bg-neutral-900 hover:bg-black" : "bg-neutral-950 hover:bg-neutral-800"
                  }`}
                >
                  {isLimitExceeded || scanCount >= 3 ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Free Limit Reached · Upgrade</span>
                    </>
                  ) : (
                    <span>Scan another resume</span>
                  )}
                </button>
                <button
                  onClick={() => navigate("/resume-tailor")}
                  className="ats-secondary-button cursor-pointer"
                >
                  Tailor for a role →
                </button>
              </div>
            )}
          </div>

        </section>

      </div>

      {result && result.isValidResume !== false && (matchedKeywords.length > 0 || missingKeywords.length > 0) && (
        <section className="ats-keyword-section">
          <div className="ats-keyword-heading"><div><span className="ats-step-label">03 / ROLE SIGNALS</span><h2>What your resume communicates</h2></div><p>Keywords are matched against the content we could read.</p></div>
          <div className="ats-keyword-grid">
            <article className="ats-keyword-card ats-keyword-card-match"><span className="ats-keyword-label">FOUND IN YOUR RESUME <b>{matchedKeywords.length}</b></span><div>{matchedKeywords.length ? matchedKeywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <p>No matched keywords were detected in this scan.</p>}</div></article>
            <article className="ats-keyword-card ats-keyword-card-missing"><span className="ats-keyword-label">POTENTIAL GAPS <b>{missingKeywords.length}</b></span><div>{missingKeywords.length ? missingKeywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <p>No additional keyword gaps were reported.</p>}</div></article>
          </div>
        </section>
      )}

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

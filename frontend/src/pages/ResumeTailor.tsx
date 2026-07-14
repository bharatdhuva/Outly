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
  CheckCircle,
  Lock,
  RefreshCw,
  Info,
  ExternalLink,
  Sparkles
} from "lucide-react";

const validateResumeTextClient = (text: string): { isValid: boolean; error?: string } => {
  if (!text || text.trim().length < 150) {
    return {
      isValid: false,
      error: "The uploaded document is too short to be a valid resume."
    };
  }

  const lowerText = text.toLowerCase();

  // 1. Resume sections detection
  const hasExperience = /experience|work\s+history|employment|professional\s+experience|professional\s+history|job\s+history/i.test(lowerText);
  const hasEducation = /education|academic|university|college|degree|qualification/i.test(lowerText);
  const hasSkills = /skills|technical\s+skills|expertise|technologies|core\s+competencies|competencies|programming\s+languages/i.test(lowerText);
  const hasProjects = /projects|personal\s+projects|academic\s+projects|key\s+projects/i.test(lowerText);
  const hasSummary = /summary|professional\s+summary|objective|career\s+objective|profile|about\s+me/i.test(lowerText);
  const hasCertifications = /certifications|certificates|awards|interests/i.test(lowerText);

  // 2. Contact info indicators
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i.test(lowerText);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(lowerText);
  const hasLinks = /linkedin\.com|github\.com/i.test(lowerText);
  
  const hasContactInfo = hasEmail || hasPhone || hasLinks || /email|phone|contact/i.test(lowerText);

  // 3. Count matching major sections
  let sectionMatchCount = 0;
  if (hasExperience) sectionMatchCount++;
  if (hasEducation) sectionMatchCount++;
  if (hasSkills) sectionMatchCount++;
  if (hasProjects) sectionMatchCount++;
  if (hasSummary) sectionMatchCount++;
  if (hasCertifications) sectionMatchCount++;

  // 4. Non-resume markers
  const isInvoiceOrReceipt = /invoice|bill\s+to|amount\s+due|payment\s+due|total\s+due|receipt|subtotal|tax\s+invoice|transaction\s+id/i.test(lowerText) && sectionMatchCount < 2;
  const isTaxForm = /form\s+\d{4}|tax\s+return|internal\s+revenue|irs|w-2|form\s+w2|1040/i.test(lowerText) && sectionMatchCount < 2;
  const isRecipe = /ingredients|instructions|cook\s+time|prep\s+time|servings|recipe/i.test(lowerText) && !hasExperience && !hasEducation;
  const isGenericCode = /import\s+.*\s+from|const\s+.*=|function\s+.*\(|class\s+.*\s*\{/i.test(lowerText) && !hasExperience && !hasEducation && !hasSkills;

  const meetsSectionRequirement = sectionMatchCount >= 2;
  
  if (!meetsSectionRequirement || !hasContactInfo || isInvoiceOrReceipt || isTaxForm || isRecipe || isGenericCode) {
    return {
      isValid: false,
      error: "The uploaded file does not appear to be a resume/CV. Please upload a valid resume containing standard sections (e.g., Experience, Education, Skills, or Projects) and contact information."
    };
  }

  return { isValid: true };
};

export default function ResumeTailorPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Persistent states stored in sessionStorage
  const [isValidResume, setIsValidResume] = useState<boolean | null>(() => {
    try {
      const val = sessionStorage.getItem("rt_isValidResume");
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  });
  const [resumeValidationError, setResumeValidationError] = useState<string | null>(() => sessionStorage.getItem("rt_resumeValidationError"));
  const [jobDesc, setJobDesc] = useState(() => sessionStorage.getItem("rt_jobDesc") || "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(() => sessionStorage.getItem("rt_resumeText"));
  const [selectedVaultId, setSelectedVaultId] = useState<string>(() => sessionStorage.getItem("rt_selectedVaultId") || "custom");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tailoredResult, setTailoredResult] = useState<string | null>(() => sessionStorage.getItem("rt_tailoredResult"));
  const [tailoring, setTailoring] = useState(false);
  const [tailoringDots, setTailoringDots] = useState("...");
  const [copied, setCopied] = useState(false);
  const [savingToVault, setSavingToVault] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>(() => {
    try {
      const val = sessionStorage.getItem("rt_matchedKeywords");
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });
  const [missingKeywords, setMissingKeywords] = useState<string[] | {
    hard_skills: string[];
    soft_skills: string[];
    tools_technologies: string[];
  }>(() => {
    try {
      const val = sessionStorage.getItem("rt_missingKeywords");
      return val ? JSON.parse(val) : { hard_skills: [], soft_skills: [], tools_technologies: [] };
    } catch {
      return { hard_skills: [], soft_skills: [], tools_technologies: [] };
    }
  });
  const [sources, setSources] = useState<Array<{ title: string; url: string; domain: string }>>(() => {
    try {
      const val = sessionStorage.getItem("rt_sources");
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [unlockAtTime, setUnlockAtTime] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState("");
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileStep, setMobileStep] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync states to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem("rt_jobDesc", jobDesc);
  }, [jobDesc]);

  useEffect(() => {
    if (resumeText !== null) {
      sessionStorage.setItem("rt_resumeText", resumeText);
    } else {
      sessionStorage.removeItem("rt_resumeText");
    }
  }, [resumeText]);

  useEffect(() => {
    sessionStorage.setItem("rt_selectedVaultId", selectedVaultId);
  }, [selectedVaultId]);

  useEffect(() => {
    if (tailoredResult !== null) {
      sessionStorage.setItem("rt_tailoredResult", tailoredResult);
    } else {
      sessionStorage.removeItem("rt_tailoredResult");
    }
  }, [tailoredResult]);

  useEffect(() => {
    sessionStorage.setItem("rt_matchedKeywords", JSON.stringify(matchedKeywords));
  }, [matchedKeywords]);

  useEffect(() => {
    sessionStorage.setItem("rt_missingKeywords", JSON.stringify(missingKeywords));
  }, [missingKeywords]);

  useEffect(() => {
    sessionStorage.setItem("rt_sources", JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    if (isValidResume !== null) {
      sessionStorage.setItem("rt_isValidResume", JSON.stringify(isValidResume));
    } else {
      sessionStorage.removeItem("rt_isValidResume");
    }
  }, [isValidResume]);

  useEffect(() => {
    if (resumeValidationError !== null) {
      sessionStorage.setItem("rt_resumeValidationError", resumeValidationError);
    } else {
      sessionStorage.removeItem("rt_resumeValidationError");
    }
  }, [resumeValidationError]);

  // Animating tailoring dots loader
  useEffect(() => {
    let interval: number;
    if (tailoring) {
      let count = 0;
      interval = window.setInterval(() => {
        count = (count + 1) % 4;
        setTailoringDots(".".repeat(count));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [tailoring]);

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

  // Load user-specific daily limit status from localStorage (12h timestamp-based auto-expiry)
  useEffect(() => {
    const userPrefix = userData?.user?.email || "anonymous";
    const storageKey = `tailor_limit_unlock_${userPrefix}`;
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
        localStorage.removeItem(`tailor_limit_unlock_${userPrefix}`);
        clearInterval(timer);
      } else {
        setCountdownText(getCountdown(unlockAtTime));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [unlockAtTime, userData]);

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
    setUploadProgress(0);
    setTailoredResult(null);
    setMatchedKeywords([]);
    setMissingKeywords({ hard_skills: [], soft_skills: [], tools_technologies: [] });
    setSources([]);

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
      const parsed = await api.ats.parseFile(file);
      setResumeText(parsed.content);
      const validation = validateResumeTextClient(parsed.content);
      if (!validation.isValid) {
        setIsValidResume(false);
        setResumeValidationError(validation.error || null);
      } else {
        toast({
          title: "Uploaded successfully",
          description: `Successfully processed "${file.name}"`,
        });
        setIsValidResume(true);
        setResumeValidationError(null);
      }
    } catch (err) {
      try {
        const text = await file.text();
        setResumeText(text);
        const validation = validateResumeTextClient(text);
        if (!validation.isValid) {
          setIsValidResume(false);
          setResumeValidationError(validation.error || null);
        } else {
          toast({
            title: "Uploaded successfully",
            description: `Successfully processed "${file.name}"`,
          });
          setIsValidResume(true);
          setResumeValidationError(null);
        }
      } catch (innerErr) {
        toast({
          variant: "destructive",
          title: "File Reading Error",
          description: "Could not parse or read this file format. Please upload .txt, .pdf, or .docx.",
        });
        setResumeFile(null);
        setResumeText(null);
        setIsValidResume(null);
        setResumeValidationError(null);
      }
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 400);
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
      setIsValidResume(null);
      setResumeValidationError(null);
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResumeText(found.content);
        const validation = validateResumeTextClient(found.content);
        if (!validation.isValid) {
          setIsValidResume(false);
          setResumeValidationError(validation.error || null);
        } else {
          setIsValidResume(true);
          setResumeValidationError(null);
        }
      }
    }
  };

  const handleTailor = async () => {
    if (isLimitExceeded) {
      window.dispatchEvent(new CustomEvent("outly_limit_exceeded", {
        detail: {
          code: "LIMIT_TAILOR_EXCEEDED",
          message: "Free tier is limited to 3 resume tailorings per 12 hours."
        }
      }));
      return;
    }
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
      window.dispatchEvent(new CustomEvent("outly-notification", {
        detail: {
          title: "Resume Tailored ✨",
          description: "Your resume has been successfully tailored for the target job description."
        }
      }));
    } catch (err) {
      const errStr = String(err);
      const isLimitError = errStr.includes("LIMIT_TAILOR_EXCEEDED") || errStr.toLowerCase().includes("limit reached");
      
      if (isLimitError) {
        setIsLimitExceeded(true);
        const unlockIso = (err as any)?.data?.unlockAt || null;
        if (unlockIso) {
          setUnlockAtTime(unlockIso);
          setCountdownText(getCountdown(unlockIso));
          const userPrefix = userData?.user?.email || "anonymous";
          localStorage.setItem(`tailor_limit_unlock_${userPrefix}`, unlockIso);
        }
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
    <div className="mx-auto w-full max-w-7xl px-6 py-4 sm:py-6 sm:px-8 space-y-5 sm:space-y-8 animate-fade-in pb-20">
      
      {/* Hero text header */}
      <div className="space-y-2 sm:space-y-3 text-left">
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

      {/* INPUT WORKSPACE (Side by Side columns / Mobile Wizard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-stretch">
        
        {/* Left Input: Job Description */}
        {(!isMobile || mobileStep === 1) && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col h-[320px] md:h-[460px] text-left space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-outly-accent" />
                Job Description
              </h2>
              {isMobile ? (
                <span className="text-[10px] font-extrabold text-outly-accent uppercase bg-outly-accent/5 px-2 py-0.5 rounded-full">Step 1 of 2</span>
              ) : (
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Target Context</span>
              )}
            </div>
            <Textarea
              className="flex-1 resize-none rounded-xl border-border bg-white text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-success p-3.5"
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
            {isMobile && (
              <Button
                onClick={() => setMobileStep(2)}
                disabled={jobDesc.trim().length < 15}
                className="w-full bg-outly-accent hover:brightness-110 text-white font-bold tracking-normal rounded-full shadow-md active:scale-[0.98] transition-all h-9 text-xs cursor-pointer mt-2"
              >
                Next: Upload Resume &rarr;
              </Button>
            )}
          </div>
        )}

        {/* Right Input: Resume Source */}
        {(!isMobile || mobileStep === 2) && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)] flex flex-col min-h-[460px] text-left animate-fade-in">
            
            <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-4">
            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-success" />
              Resume Source
            </h2>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Candidate Input</span>
          </div>

          {loading ? (
            <div className="flex-1 border-2 border-dashed border-success/60 bg-[#fdfaf3]/50 p-6 text-center rounded-xl select-none flex flex-col items-center justify-center min-h-[250px] w-full">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4 text-success">
                <UploadCloud className="w-6 h-6 animate-bounce shrink-0" />
              </div>
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-outly-dark">
                  <span>Uploading resume...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 font-medium">Please wait while Outly processes your file...</p>
              </div>
            </div>
          ) : !resumeFile && selectedVaultId === "custom" ? (
            isLimitExceeded ? (
              <div className="flex-1 border-2 border-dashed border-border bg-secondary/35 rounded-xl flex flex-col items-center justify-center p-6 text-center select-none cursor-not-allowed">
                <div className="space-y-4">
                  <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-[14px] font-bold text-foreground">Limit Reached{countdownText ? ` · Unlocks in ${countdownText}` : " (3/3)"}</p>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">You've used 3 resume tailoring/check attempts. {countdownText ? `Try again in ${countdownText}.` : "Please upgrade to Pro for unlimited tailoring."}</p>
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
                    setIsValidResume(null);
                    setResumeValidationError(null);
                    setMobileStep(1);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>

              <div className="flex-1 min-h-[360px] overflow-hidden rounded-xl border border-border bg-secondary/10 flex flex-col">
                {isValidResume === false ? (
                  /* Invalid Resume Error State */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-white animate-fade-in">
                    <div className="flex items-center justify-center mb-0.5">
                      <dotlottie-wc
                        src="https://lottie.host/11b02034-8246-4f8e-9e73-a1cd4138eb67/FlOkPtywgI.lottie"
                        style={{ width: "110px", height: "110px" }}
                        autoplay
                        loop
                      />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">Invalid Document Detected</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm leading-relaxed mb-4">
                      {resumeValidationError || "The uploaded document does not appear to be a valid resume/CV."}
                    </p>
                    <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5 max-w-sm text-left space-y-2.5 w-full">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground">
                        💡 Proper Resume Requirements:
                      </span>
                      <ul className="space-y-1.5 text-[10.5px] text-muted-foreground font-medium">
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
                  </div>
                ) : resumeFile && resumeFile.type === "application/pdf" ? (
                  <div className="flex-1 flex flex-col min-h-[360px]">
                    <PdfViewer file={resumeFile} />
                  </div>
                ) : !resumeFile && resumes.find(r => String(r.id) === selectedVaultId)?.filename.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex-1 flex flex-col min-h-[360px]">
                    <PdfViewer url={api.resume.getFileUrl(selectedVaultId)} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-3.5 text-left max-h-[360px]">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground/80">{resumeText}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
          {isMobile && (
            <div className="mt-4 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                type="button"
                onClick={() => setMobileStep(1)}
                className="w-full font-bold text-xs rounded-full border-zinc-200 text-muted-foreground hover:bg-zinc-50 h-9 cursor-pointer"
              >
                &larr; Back to Job Description
              </Button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Action Submit Area (Below inputs) */}
      {(!isMobile || mobileStep === 2) && (
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 sm:gap-4 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-[var(--shadow-card)] animate-fade-in">
          <span className="text-[11px] font-bold text-muted-foreground">Tailored live by Outly AI</span>
          <Button
            className="w-full sm:w-auto max-w-[220px] bg-outly-accent hover:brightness-110 text-white px-5 font-bold tracking-normal rounded-full shadow-md shadow-outly-accent/15 active:scale-[0.98] transition-all gap-1.5 h-9 text-xs cursor-pointer"
            onClick={handleTailor}
            disabled={tailoring || !resumeText || !jobDesc.trim() || isValidResume === false}
          >
            {tailoring ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Tailoring{tailoringDots}
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Tailor Resume
              </>
            )}
          </Button>
        </div>
      )}

      {/* TAILORING ANIMATED PROGRESS LOADER CARD */}
      {tailoring && (
        <div className="w-full bg-card border border-border rounded-2xl p-10 text-center shadow-[var(--shadow-card)] space-y-4 animate-pulse">
          <Loader2 className="h-9 w-9 animate-spin text-outly-accent mx-auto" />
          <div className="space-y-2 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">AI Tailoring in Progress{tailoringDots}</h3>
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 px-3 text-[11px] border-border text-foreground hover:bg-secondary rounded-lg font-bold"
                    onClick={handleSaveToVault}
                    disabled={savingToVault}
                  >
                    {savingToVault ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {savingToVault ? "Saving..." : "Save to Vault"}
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


      <AiErrorModal open={showAiErrorModal} onClose={() => setShowAiErrorModal(false)} />

    </div>
  );
}

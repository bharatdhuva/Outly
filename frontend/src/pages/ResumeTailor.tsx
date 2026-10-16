import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
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
  CheckCircle2,
  Lock, 
  RefreshCw, 
  Info, 
  ExternalLink, 
  Sparkles,
  Target,
  AlertCircle,
  Search,
  Layers,
  Zap,
  ArrowUpRight,
  ArrowRight
} from "lucide-react";
import { FileUploadCard, UploadedFile } from "@/components/ui/file-upload-card";

const parseJobInfo = (text: string) => {
  if (!text || text.trim().length === 0) {
    return { title: "Senior Software Engineer", company: "Target Company", location: "Bengaluru" };
  }
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  
  let title = "";
  let company = "";
  let location = "";

  for (const line of lines.slice(0, 8)) {
    const clean = line.replace(/^[#*\-•\s]+/, "").trim();
    if (!clean) continue;
    
    const roleMatch = clean.match(/(?:role|position|job\s*title|looking\s+for\s+(?:an?|the)?)\s*[:\-–]?\s*([A-Za-z0-9\s/&,.-]+)/i);
    if (roleMatch && roleMatch[1].trim().length < 60) {
      title = roleMatch[1].trim();
      break;
    }

    const atMatch = clean.match(/^([A-Za-z0-9\s/&,.-]+?)\s+(?:at|@)\s+([A-Za-z0-9\s&,.-]+)$/i);
    if (atMatch && atMatch[1].length < 50) {
      title = atMatch[1].trim();
      company = atMatch[2].trim();
      break;
    }

    const dashMatch = clean.match(/^([A-Za-z0-9\s/&,.-]+?)\s*[-–|]\s*([A-Za-z0-9\s&,.-]+)$/);
    if (dashMatch && dashMatch[1].length < 50 && !dashMatch[1].toLowerCase().includes("http")) {
      title = dashMatch[1].trim();
      company = dashMatch[2].trim();
      break;
    }

    if (!title && clean.length > 3 && clean.length < 55 && !clean.includes(":") && !clean.includes("http")) {
      title = clean;
    }
  }

  for (const line of lines.slice(0, 15)) {
    if (!company) {
      const compMatch = line.match(/(?:company|organization|about\s+us)\s*[:\-–]?\s*([A-Za-z0-9\s&,.-]+)/i);
      if (compMatch && compMatch[1].trim().length < 40) {
        company = compMatch[1].trim();
      }
    }
    if (!location) {
      const locMatch = line.match(/(?:location|place|city|based\s+in)\s*[:\-–]?\s*([A-Za-z0-9\s,.-]+)/i);
      if (locMatch && locMatch[1].trim().length < 40) {
        location = locMatch[1].trim();
      }
    }
  }

  if (!title) title = "Senior Software Engineer";
  if (!company) company = "Google";
  if (!location) location = "Bengaluru";

  return { title, company, location };
};

const getTailoredAgo = (iso?: string) => {
  if (!iso) return "tailored 2 minutes ago";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "tailored just now";
  if (diffMins === 1) return "tailored 1 minute ago";
  if (diffMins < 60) return `tailored ${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "tailored 1 hour ago";
  return `tailored ${diffHours} hours ago`;
};

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

  const uploadedFiles: UploadedFile[] = resumeFile
    ? [
        {
          id: "tailor-resume-upload",
          file: resumeFile,
          progress: loading ? uploadProgress : 100,
          status: loading ? "uploading" : "completed",
        },
      ]
    : [];
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
  const [modificationsSummary, setModificationsSummary] = useState<string[]>(() => {
    try {
      const val = sessionStorage.getItem("rt_modificationsSummary");
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tailoredAt, setTailoredAt] = useState<string>(() => sessionStorage.getItem("rt_tailoredAt") || "");

  useEffect(() => {
    if (tailoredAt) {
      sessionStorage.setItem("rt_tailoredAt", tailoredAt);
    } else {
      sessionStorage.removeItem("rt_tailoredAt");
    }
  }, [tailoredAt]);

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
    sessionStorage.setItem("rt_modificationsSummary", JSON.stringify(modificationsSummary));
  }, [modificationsSummary]);

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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Maximum file size allowed is 5 MB.",
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

  const handleFilesSelect = (selectedFiles: File[]) => {
    const file = selectedFiles[0];
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
    setModificationsSummary([]);
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
      setModificationsSummary(response.modificationsSummary || []);
      setTailoredAt(new Date().toISOString());
      setIsEditing(false);
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

  const jobInfo = parseJobInfo(jobDesc);
  const tailoredAgoText = getTailoredAgo(tailoredAt);

  const flatMissingKeywords: string[] = Array.isArray(missingKeywords)
    ? missingKeywords
    : [
        ...(missingKeywords?.hard_skills || []),
        ...(missingKeywords?.tools_technologies || []),
        ...(missingKeywords?.soft_skills || [])
      ];

  const totalKeywords = matchedKeywords.length + flatMissingKeywords.length;
  const matchPercentage = totalKeywords > 0
    ? Math.round((matchedKeywords.length / totalKeywords) * 100)
    : 80;

  if (tailoredResult && !isEditing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:py-8 space-y-6 animate-fade-in pb-20">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-left">
          <div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
              RESUME / TAILOR
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1.5">
              {jobInfo.title}
            </h1>
            <p className="text-[13px] text-muted-foreground font-medium mt-1">
              {jobInfo.company} · {jobInfo.location} — {tailoredAgoText}
            </p>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="self-start bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
          >
            Re-tailor <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border-b border-border/60 my-5" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Tailored resume */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-foreground">Tailored resume</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleSaveToVault}
                  disabled={savingToVault}
                  className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 font-medium"
                >
                  {savingToVault ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingToVault ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 min-h-[550px] shadow-sm overflow-x-auto text-left">
              <pre className="whitespace-pre-wrap font-mono text-[12px] sm:text-[13px] leading-relaxed text-foreground/90 select-text font-normal">
                {tailoredResult}
              </pre>
            </div>
          </div>

          {/* Right Column: Keyword Match */}
          <div className="lg:col-span-4 space-y-6 pt-2 text-left">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground uppercase block">
                KEYWORD MATCH
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-none">
                  {matchPercentage}
                </span>
                <span className="text-2xl font-semibold text-muted-foreground">%</span>
              </div>
              <p className="text-[12px] text-muted-foreground font-medium mt-2">
                {matchedKeywords.length} of {Math.max(matchedKeywords.length, totalKeywords)} keywords from the job description
              </p>
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, matchPercentage))}%` }}
                />
              </div>
            </div>

            <div className="border-b border-border/60 my-5" />

            {/* Missing Section */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Missing</span>
                <span className="text-xs text-muted-foreground font-mono">{flatMissingKeywords.length}</span>
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-2 mt-3 text-xs text-foreground/85 leading-relaxed">
                {flatMissingKeywords.length > 0 ? (
                  flatMissingKeywords.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold leading-none text-sm">•</span>
                      <span>{kw}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic text-[11px]">No missing critical keywords detected</span>
                )}
              </div>
            </div>

            <div className="border-b border-border/60 my-5" />

            {/* Matched Section */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Matched</span>
                <span className="text-xs text-muted-foreground font-mono">{matchedKeywords.length}</span>
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-2 mt-3 text-xs text-foreground/85 leading-relaxed">
                {matchedKeywords.length > 0 ? (
                  matchedKeywords.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      <span className="text-emerald-500 font-bold leading-none text-sm">•</span>
                      <span>{kw}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic text-[11px]">No matched keywords yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <AiErrorModal open={showAiErrorModal} onClose={() => setShowAiErrorModal(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 sm:py-8 space-y-6 animate-fade-in pb-20 text-left">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-left">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.25em] text-neutral-400 uppercase">
            RESUME / TAILOR / INPUTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1.5">
            Tailor your resume for a role
          </h1>
          <p className="text-[13px] text-neutral-500 font-normal mt-1">
            Paste the job description and add your resume. We'll rewrite it around the role's keywords.
          </p>
        </div>

        {tailoredResult && (
          <button
            onClick={() => setIsEditing(false)}
            className="self-start text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 font-medium cursor-pointer transition-colors pt-2"
          >
            ← Back to tailored resume
          </button>
        )}
      </div>

      {/* INPUT WORKSPACE (Side by Side columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Column: 01 Job description */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
              <span className="font-mono text-neutral-400 font-normal">01</span>
              <span>Job description</span>
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">
              {jobDesc.trim() ? `${jobDesc.trim().split(/\s+/).length} words` : "0 words"}
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200/80 bg-white p-4 h-[440px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col focus-within:border-neutral-400 transition-colors">
            <textarea
              className="flex-1 w-full resize-none border-0 bg-transparent text-[12.5px] leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:outline-none font-mono"
              placeholder="Paste the job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: 02 Your resume */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
              <span className="font-mono text-neutral-400 font-normal">02</span>
              <span>Your resume</span>
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">
              PDF, DOCX, TXT · 5 MB
            </span>
          </div>

          <div className="rounded-xl border border-neutral-200/80 bg-white p-4 h-[440px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processResumeFile(file);
              }}
            />

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-700" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-neutral-800">Uploading resume...</p>
                  <p className="text-[11px] text-neutral-400">{uploadProgress}% processed</p>
                </div>
                <div className="w-48 h-1 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-900 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : !resumeFile && selectedVaultId === "custom" ? (
              isLimitExceeded ? (
                <div className="flex-1 border border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center p-6 text-center select-none">
                  <Lock className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-neutral-800">Limit Reached{countdownText ? ` · Unlocks in ${countdownText}` : " (3/3)"}</p>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto mt-1 mb-3">
                    You've used your free tailor attempts. Upgrade to Pro for unlimited tailoring.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/pricing")}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs px-4 h-8 rounded-lg cursor-pointer"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-lg flex-1 flex flex-col items-center justify-center text-center p-6 transition-colors cursor-pointer ${
                    isDragging ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50"
                  }`}
                >
                  <p className="text-xl sm:text-2xl font-normal text-neutral-800">
                    Drop your resume here
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    or <span className="underline underline-offset-2 text-neutral-800 font-medium">browse files</span>
                  </p>

                  {resumes.length > 0 && (
                    <div className="mt-5 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="w-full text-[11px] bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-600 focus:outline-none focus:border-neutral-400 cursor-pointer"
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
              )
            ) : (
              /* Resume Preview / Uploaded state */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                  <span className="truncate text-xs font-medium text-neutral-800 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-neutral-500" />
                    {resumeFile ? resumeFile.name : (resumes.find(r => String(r.id) === selectedVaultId)?.label || "Vault Resume")}
                  </span>
                  <button
                    onClick={() => {
                      setResumeFile(null);
                      setResumeText(null);
                      setSelectedVaultId("custom");
                      setIsValidResume(null);
                      setResumeValidationError(null);
                    }}
                    className="text-neutral-400 hover:text-neutral-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
                  {isValidResume === false ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                      <AlertCircle className="w-6 h-6 text-amber-600 mb-2" />
                      <p className="text-xs font-semibold text-neutral-800">Invalid Resume Format</p>
                      <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
                        {resumeValidationError || "Document does not contain standard resume sections (Experience, Education, Skills)."}
                      </p>
                    </div>
                  ) : resumeFile && resumeFile.type === "application/pdf" ? (
                    <PdfViewer file={resumeFile} />
                  ) : !resumeFile && resumes.find(r => String(r.id) === selectedVaultId)?.filename.toLowerCase().endsWith(".pdf") ? (
                    <PdfViewer url={api.resume.getFileUrl(selectedVaultId)} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-neutral-700">
                      {resumeText}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <p className="text-xs text-neutral-500">
          {!jobDesc.trim() && !resumeText
            ? "Paste the job description and add your resume to continue."
            : !jobDesc.trim()
            ? "Paste the target job description to continue."
            : !resumeText
            ? "Add your resume to continue."
            : isValidResume === false
            ? "Please provide a valid resume file to continue."
            : "Ready to tailor your resume."}
        </p>

        <button
          onClick={handleTailor}
          disabled={tailoring || !resumeText || !jobDesc.trim() || isValidResume === false}
          className="self-end sm:self-auto bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          {tailoring ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Tailoring{tailoringDots}
            </>
          ) : (
            <>
              Tailor resume <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* TAILORING ANIMATED PROGRESS LOADER CARD */}
      {tailoring && (
        <div className="w-full bg-white border border-neutral-200/80 rounded-xl p-10 text-center shadow-xs space-y-3 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-800 mx-auto" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-xs font-semibold text-neutral-900">AI Tailoring in Progress{tailoringDots}</h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Outly AI is parsing requirements, extracting role skills, and rewriting your resume points. This takes about 10-15 seconds.
            </p>
          </div>
        </div>
      )}

      <AiErrorModal open={showAiErrorModal} onClose={() => setShowAiErrorModal(false)} />

    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ResumeVaultItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  Loader2,
  Building,
  Calendar,
  ChevronRight,
  X,
  FolderArchive,
} from "lucide-react";

interface ResumeDocSection {
  title: string;
  content: string;
}

interface ParsedResumeDoc {
  name: string;
  subtitle: string;
  sections: ResumeDocSection[];
}

function formatResumeDate(dateStr?: string | Date): string {
  if (!dateStr) return "15 Jul 2026";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "15 Jul 2026";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseResumeDocument(
  content: string | null | undefined,
  fallbackName: string,
  fallbackEmail: string
): ParsedResumeDoc {
  const defaultDoc: ParsedResumeDoc = {
    name: fallbackName || "Bharat Dhuva",
    subtitle: `Software Engineer · ${fallbackEmail || "bharatdhuva276@gmail.com"}`,
    sections: [
      {
        title: "EDUCATION",
        content: "B.E. Computer Science & Engineering — The Maharaja Sayajirao University of Baroda, 2024–2027",
      },
      {
        title: "SKILLS",
        content: "JavaScript, TypeScript, Java, Python, SQL · React, Node.js, Express · Git, Docker, Vercel",
      },
      {
        title: "PROJECTS",
        content: "Outly — AI-powered career automation platform serving 100+ users, with ATS scoring, resume vault and job tracker.",
      },
    ],
  };

  if (!content || !content.trim()) {
    return defaultDoc;
  }

  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) {
    return defaultDoc;
  }

  const sectionKeywords = [
    "EDUCATION", "SKILLS", "PROJECTS", "EXPERIENCE", "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE", "SUMMARY", "ABOUT", "CERTIFICATIONS", "ACHIEVEMENTS"
  ];

  let name = fallbackName || "Bharat Dhuva";
  let subtitle = `Software Engineer · ${fallbackEmail || "bharatdhuva276@gmail.com"}`;
  const sections: ResumeDocSection[] = [];

  let firstSectionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const upper = lines[i].toUpperCase().replace(/[^A-Z ]/g, "").trim();
    if (sectionKeywords.some(kw => upper === kw || upper.startsWith(kw + " "))) {
      firstSectionIdx = i;
      break;
    }
  }

  if (firstSectionIdx > 0) {
    name = lines[0] || name;
    if (firstSectionIdx > 1) {
      subtitle = lines.slice(1, firstSectionIdx).join(" · ");
    }
  }

  if (firstSectionIdx === -1) {
    return {
      name: lines[0] || name,
      subtitle: lines[1] || subtitle,
      sections: defaultDoc.sections,
    };
  }

  let currentTitle = "";
  let currentLines: string[] = [];

  for (let i = firstSectionIdx; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase().replace(/[^A-Z ]/g, "").trim();
    const isHeader = sectionKeywords.some(kw => upper === kw || upper.startsWith(kw + " "));

    if (isHeader) {
      if (currentTitle && currentLines.length > 0) {
        sections.push({ title: currentTitle, content: currentLines.join("\n") });
      }
      currentTitle = upper;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentTitle && currentLines.length > 0) {
    sections.push({ title: currentTitle, content: currentLines.join("\n") });
  }

  return {
    name,
    subtitle,
    sections: sections.length > 0 ? sections : defaultDoc.sections,
  };
}

export default function ResumeVaultPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedResumeId, setSelectedResumeId] = useState<string | number | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"preview" | "applications">("preview");

  // Upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [resumeLabel, setResumeLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Edit label state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLabelText, setEditLabelText] = useState("");

  // Delete inline popover state
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);

  // Inline edit state for resume version title
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineLabel, setInlineLabel] = useState("");
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes from vault
  const { data: serverResumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Fetch applications
  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
  });

  // Fetch user settings / profile for resume document info
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: api.auth.me,
  });

  const userName = userData?.user?.fullName || settings?.full_name || "Bharat Dhuva";
  const userEmail = userData?.user?.email || "bharatdhuva276@gmail.com";

  const resumes: ResumeVaultItem[] = serverResumes;

  // Auto-select first or default resume when resumes list updates
  useEffect(() => {
    if (resumes.length > 0) {
      const currentExists = resumes.some(r => String(r.id) === String(selectedResumeId));
      if (!currentExists) {
        const defaultRes = resumes.find(r => r.is_default === 1);
        setSelectedResumeId(defaultRes ? defaultRes.id : resumes[0].id);
      }
    } else {
      setSelectedResumeId(null);
    }
  }, [resumes, selectedResumeId]);

  useEffect(() => {
    setIsEditingInline(false);
  }, [selectedResumeId]);

  useEffect(() => {
    if (isEditingInline) {
      setTimeout(() => {
        inlineInputRef.current?.focus();
        inlineInputRef.current?.select();
      }, 50);
    }
  }, [isEditingInline]);

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string | number) => api.resume.setDefault(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", "list"] });
      toast({
        title: "Default Resume Updated",
        description: "Your default resume has been updated successfully.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.resume.delete(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", "list"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setSelectedResumeId(null);
      toast({
        title: "Resume Deleted",
        description: "Resume has been deleted from your vault.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    },
  });

  // Edit Label mutation
  const updateLabelMutation = useMutation({
    mutationFn: ({ id, label }: { id: string | number; label: string }) =>
      api.resume.update(String(id), { label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", "list"] });
      setIsEditOpen(false);
      toast({
        title: "Label Updated",
        description: "Resume label has been updated successfully.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: String(err),
      });
    },
  });

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "pdf" && ext !== "docx") {
      toast({
        variant: "destructive",
        title: "Unsupported File Format",
        description: "Please upload a .pdf, .docx, or .txt file.",
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

    setFileToUpload(file);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setResumeLabel(baseName.split("_").join(" ").split("-").join(" "));
  };

  const handleSaveResume = async () => {
    if (!fileToUpload) return;
    if (!resumeLabel.trim()) {
      toast({
        variant: "destructive",
        title: "Label Required",
        description: "Please provide a name/label for this resume version.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await api.resume.upload(fileToUpload, resumeLabel.trim());
      queryClient.invalidateQueries({ queryKey: ["resume", "list"] });
      setFileToUpload(null);
      setResumeLabel("");
      setSelectedResumeId(result.id);
      setActivePreviewTab("preview");
      toast({
        title: "Resume Saved",
        description: `Successfully added "${resumeLabel}" to your vault.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Save Resume",
        description: String(err),
      });
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Find selected resume
  const selectedResume =
    resumes.find(r => String(r.id) === String(selectedResumeId)) || (resumes.length > 0 ? resumes[0] : null);

  // Find linked applications
  const linkedApps = selectedResume
    ? applications.filter(app => String(app.resume_version_used) === String(selectedResume.id))
    : [];

  const handleCopyText = (text: string | null) => {
    const contentToCopy =
      text ||
      `${userName}\nSoftware Engineer · ${userEmail}\n\nEDUCATION\nB.E. Computer Science & Engineering — The Maharaja Sayajirao University of Baroda, 2024–2027\n\nSKILLS\nJavaScript, TypeScript, Java, Python, SQL · React, Node.js, Express · Git, Docker, Vercel\n\nPROJECTS\nOutly — AI-powered career automation platform serving 100+ users, with ATS scoring, resume vault and job tracker.`;
    navigator.clipboard.writeText(contentToCopy);
    toast({
      title: "Copied!",
      description: "Resume text copied to clipboard.",
    });
  };

  const handleSaveInlineLabel = () => {
    if (!selectedResume) return;
    const trimmed = inlineLabel.trim();
    if (!trimmed || trimmed === selectedResume.label) {
      setIsEditingInline(false);
      return;
    }
    updateLabelMutation.mutate(
      { id: selectedResume.id, label: trimmed },
      {
        onSettled: () => setIsEditingInline(false),
      }
    );
  };

  const parsedDoc = parseResumeDocument(selectedResume?.content, userName, userEmail);
  const isPdf = selectedResume?.filename?.toLowerCase().endsWith(".pdf") ?? false;
  const pdfUrl = selectedResume ? api.resume.getFileUrl(String(selectedResume.id)) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 sm:py-8 space-y-6 animate-fade-in pb-20 text-left font-sans">
      
      {/* Top Header matching ResumeTailor & AtsScore */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-left">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <FolderArchive className="w-3.5 h-3.5 text-[#2DC08D]" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Resume / Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-1.5">
            Resume Vault
          </h1>
          <p className="text-[13px] text-neutral-500 font-normal mt-1">
            Every version of your resume in one place, ready to tailor for the next application.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="self-start inline-flex items-center justify-center gap-1.5 bg-[#111111] hover:bg-black text-white px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload resume</span>
        </button>
      </div>

      {/* TWO COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-1">
        
        {/* ─── LEFT COLUMN: RESUME VERSIONS LIST ─── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <span className="text-[11px] font-semibold tracking-[0.16em] text-neutral-400 uppercase block">
            {resumes.length} {resumes.length === 1 ? "VERSION" : "VERSIONS"}
          </span>

          {resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center bg-white/70">
              <p className="text-xs font-semibold text-neutral-800">No resumes yet</p>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Upload your first resume to manage versions.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload resume
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {resumes.map((resumeItem) => {
                const isSelected = String(selectedResumeId) === String(resumeItem.id);
                const isDefault = resumeItem.is_default === 1;
                const appCount = applications.filter(
                  app => String(app.resume_version_used) === String(resumeItem.id)
                ).length;

              return (
                <div
                  key={resumeItem.id}
                  onClick={() => setSelectedResumeId(resumeItem.id)}
                  className={`group relative text-left p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border border-neutral-200/80 border-l-[3.5px] border-l-black rounded-r-md shadow-sm"
                      : "border border-transparent hover:bg-neutral-200/35 rounded-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 truncate">
                      {resumeItem.label}
                    </h3>
                    {isDefault && (
                      <span className="text-[10px] font-bold text-[#f25f4c] tracking-wider uppercase shrink-0">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-normal">
                    {resumeItem.filename}
                  </p>

                  <p className="text-[11px] text-neutral-400 font-normal mt-0.5">
                    {formatResumeDate(resumeItem.created_at || (resumeItem as any).createdAt)} · {appCount} {appCount === 1 ? "application" : "applications"}
                  </p>

                  {/* Subtle actions on hover: Set default & Delete */}
                  <div className={`absolute right-2.5 bottom-2.5 flex items-center gap-1 transition-opacity ${deleteTargetId === resumeItem.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {!isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultMutation.mutate(resumeItem.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
                        title="Set as Default"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    {/* Small Inline Popover anchored directly at the delete button without full screen blur overlay */}
                    <Popover
                      open={deleteTargetId === resumeItem.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteTargetId(null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(resumeItem.id);
                          }}
                          className={`p-1 transition-colors cursor-pointer ${
                            deleteTargetId === resumeItem.id
                              ? "text-red-600"
                              : "text-neutral-400 hover:text-red-600"
                          }`}
                          title="Delete Resume"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        side="top"
                        sideOffset={6}
                        onClick={(e) => e.stopPropagation()}
                        className="w-56 p-3 bg-white border border-neutral-200 shadow-xl rounded-xl z-50 text-left font-sans"
                      >
                        <p className="text-xs font-bold text-neutral-900">Delete version?</p>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-snug">
                          Remove <span className="font-semibold text-neutral-800">"{resumeItem.label}"</span> from vault?
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetId(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(resumeItem.id);
                              setDeleteTargetId(null);
                            }}
                            disabled={deleteMutation.isPending}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors cursor-pointer"
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          <p className="text-[11px] text-neutral-400 font-normal mt-3 px-1">
            PDF, DOCX or TXT, up to 5 MB.
          </p>
        </div>

        {/* ─── RIGHT COLUMN: PREVIEW CANVAS & ACTIONS ─── */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {selectedResume ? (
            <>
              {/* Header: Title + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                <div>
                  {isEditingInline ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <input
                        ref={inlineInputRef}
                        type="text"
                        value={inlineLabel}
                        onChange={(e) => setInlineLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveInlineLabel();
                          } else if (e.key === "Escape") {
                            setIsEditingInline(false);
                          }
                        }}
                        className="text-lg sm:text-[22px] font-bold text-neutral-900 tracking-tight bg-white border border-neutral-300 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-black shadow-inner max-w-sm"
                        placeholder="Resume version name"
                      />
                      <button
                        type="button"
                        onClick={handleSaveInlineLabel}
                        disabled={updateLabelMutation.isPending || !inlineLabel.trim()}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        title="Save (Enter)"
                      >
                        {updateLabelMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingInline(false)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                        title="Cancel (Esc)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setInlineLabel(selectedResume.label);
                        setIsEditingInline(true);
                      }}
                      className="group/title flex items-center gap-1.5 cursor-pointer -ml-1 pl-1 pr-2 py-0.5 rounded-lg hover:bg-neutral-100/70 transition-colors inline-flex"
                      title="Click text to rename"
                    >
                      <h2 className="text-lg sm:text-[22px] font-bold text-neutral-900 tracking-tight group-hover/title:text-black">
                        {selectedResume.label}
                      </h2>
                      <span
                        className="p-1 text-neutral-400 group-hover/title:text-neutral-800 transition-colors"
                        title="Click to rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-neutral-400 mt-0.5 font-normal">
                    {selectedResume.filename}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/ats-score")}
                    className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 rounded-lg text-xs font-medium px-3.5 py-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    Check ATS
                  </button>
                  <button
                    onClick={() => handleCopyText(selectedResume.content)}
                    className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 rounded-lg text-xs font-medium px-3.5 py-1.5 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Copy text</span>
                  </button>
                </div>
              </div>

              {/* Tabs: Preview / Used in applications */}
              <div className="border-b border-neutral-200 flex items-center gap-6 mb-6">
                <button
                  onClick={() => setActivePreviewTab("preview")}
                  className={`pb-2.5 text-xs sm:text-[13px] transition-colors cursor-pointer ${
                    activePreviewTab === "preview"
                      ? "text-neutral-900 font-semibold border-b-2 border-black -mb-px"
                      : "text-neutral-400 hover:text-neutral-800 font-normal border-b-2 border-transparent"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActivePreviewTab("applications")}
                  className={`pb-2.5 text-xs sm:text-[13px] transition-colors cursor-pointer ${
                    activePreviewTab === "applications"
                      ? "text-neutral-900 font-semibold border-b-2 border-black -mb-px"
                      : "text-neutral-400 hover:text-neutral-800 font-normal border-b-2 border-transparent"
                  }`}
                >
                  Used in applications ({linkedApps.length})
                </button>
              </div>

              {/* Sub-tab Content Panel */}
              {activePreviewTab === "preview" ? (
                /* Light gray container with PDF viewer or parsed document */
                <div className="bg-[#f4f4f3] rounded-xl border border-neutral-200/70 p-3 sm:p-6 flex justify-center items-start min-h-[560px]">
                  {isPdf && pdfUrl ? (
                    <div className="w-full max-w-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-neutral-200/70 rounded-xl overflow-hidden p-2 sm:p-4">
                      <PdfViewer
                        url={pdfUrl}
                        filename={selectedResume.filename}
                        maxHeight="max-h-[760px]"
                        className="bg-transparent border-none p-0"
                      />
                    </div>
                  ) : (
                    <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-neutral-200/50 w-full max-w-xl p-8 sm:p-12 font-sans text-left">
                      {/* Centered Document Header */}
                      <div className="text-center mb-6">
                        <h3 className="text-xl sm:text-[22px] font-bold text-neutral-900 tracking-tight">
                          {parsedDoc.name}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1 font-normal">
                          {parsedDoc.subtitle}
                        </p>
                      </div>

                      {/* Resume Document Sections */}
                      <div className="space-y-5">
                        {parsedDoc.sections.map((sec, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <h4 className="text-[10px] font-semibold text-neutral-400 tracking-[0.16em] uppercase border-b border-neutral-100 pb-1">
                              {sec.title}
                            </h4>
                            <div className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line font-normal">
                              {sec.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Applications Tab Content */
                <div className="bg-[#f4f4f3] rounded-xl border border-neutral-200/70 p-6 sm:p-10 min-h-[360px] flex flex-col justify-center">
                  {linkedApps.length === 0 ? (
                    <div className="text-center max-w-sm mx-auto space-y-2">
                      <Building className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm font-bold text-neutral-800">No Linked Applications</p>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        You haven't tracked an application using this resume version yet.
                      </p>
                      <Button
                        size="sm"
                        asChild
                        variant="outline"
                        className="h-8 text-xs font-medium mt-3 border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                      >
                        <Link to="/applications">Go to Applications Tracker</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {linkedApps.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-xl border border-neutral-200/80 p-4 bg-white shadow-sm flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md inline-block">
                              {app.stage.toUpperCase()}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mt-1">
                              {app.company}
                            </h4>
                            <p className="text-xs text-neutral-500 truncate">{app.role}</p>
                          </div>

                          <div className="mt-4 border-t border-neutral-100 pt-2 flex items-center justify-between text-[10px] text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(app.createdAt || (app as any).created_at).toLocaleDateString()}
                            </span>
                            <Link 
                              to="/applications" 
                              className="text-neutral-900 hover:underline flex items-center gap-0.5 font-semibold"
                            >
                              View Tracker <ChevronRight className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#f4f4f3] rounded-xl border border-neutral-200/70 p-12 sm:p-20 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-12 h-12 rounded-full bg-neutral-200/80 flex items-center justify-center mb-3 text-neutral-400">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800">No resumes in vault</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Your vault is currently empty. Upload your resume to view and tailor it for job applications.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload your resume</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Upload Label Confirmation Modal */}
      <Dialog open={fileToUpload !== null} onOpenChange={(open) => !open && setFileToUpload(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-neutral-200 bg-white p-6 font-sans rounded-xl">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold text-neutral-900">Label New Resume Version</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 leading-relaxed">
              File uploaded: <span className="font-mono text-neutral-800 font-semibold">{fileToUpload?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <label className="text-xs font-semibold text-neutral-700 block">Resume Label</label>
            <input
              type="text"
              required
              placeholder="e.g. dotnet resume"
              className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-black text-neutral-900 shadow-sm placeholder:text-neutral-400"
              value={resumeLabel}
              onChange={(e) => setResumeLabel(e.target.value)}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end border-t border-neutral-100 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              className="border-neutral-200 text-xs font-medium h-9 rounded-lg hover:bg-neutral-50"
              onClick={() => setFileToUpload(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveResume}
              disabled={isSaving}
              className="bg-black hover:bg-neutral-800 text-white text-xs font-medium h-9 rounded-lg shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save to Vault"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Resume Label Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-neutral-200 bg-white p-6 font-sans rounded-xl">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-base font-bold text-neutral-900">Rename Resume Version</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 leading-relaxed">
              Update the label identifier for this resume version.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4 text-left">
            <label className="text-xs font-semibold text-neutral-700 block">Descriptive Label</label>
            <input
              type="text"
              required
              placeholder="e.g. dotnet resume"
              className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-medium outline-none focus:ring-1 focus:ring-black text-neutral-900 shadow-sm placeholder:text-neutral-400"
              value={editLabelText}
              onChange={(e) => setEditLabelText(e.target.value)}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end border-t border-neutral-100 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              className="border-neutral-200 text-xs font-medium h-9 rounded-lg hover:bg-neutral-50"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedResume && editLabelText.trim()) {
                  updateLabelMutation.mutate({
                    id: selectedResume.id,
                    label: editLabelText.trim()
                  });
                }
              }}
              disabled={updateLabelMutation.isPending || !editLabelText.trim()}
              className="bg-black hover:bg-neutral-800 text-white text-xs font-medium h-9 rounded-lg shadow-sm"
            >
              {updateLabelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Hidden file input for "+ Upload resume" */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

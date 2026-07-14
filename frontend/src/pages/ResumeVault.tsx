import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import DotLottieLoader from "@/components/DotLottieLoader";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Calendar,
  X,
  Loader2,
  Building,
  Briefcase,
  Copy,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  Check,
  FolderOpen,
  Lock,
  UploadCloud,
  Edit2,
  Download
} from "lucide-react";
import { FileUploadCard, UploadedFile } from "@/components/ui/file-upload-card";

export default function ResumeVaultPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"preview" | "applications">("preview");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // Upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [resumeLabel, setResumeLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const uploadedFiles: UploadedFile[] = fileToUpload
    ? [
        {
          id: "current-upload",
          file: fileToUpload,
          progress: isSaving ? 80 : 100,
          status: isSaving ? "uploading" : "completed",
        },
      ]
    : [];

  // Edit label state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLabelText, setEditLabelText] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const handleDownloadResume = async (resumeId: number, filename: string) => {
    try {
      setDownloadingId(resumeId);
      const url = api.resume.getFileUrl(resumeId);
      const token = localStorage.getItem("outly_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "Resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the resume file.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // Fetch resumes from vault
  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Fetch applications
  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
  });

  // Automatically select the default or first resume on load
  useEffect(() => {
    if (resumes.length > 0 && selectedResumeId === null) {
      const defaultRes = resumes.find(r => r.is_default === 1);
      setSelectedResumeId(defaultRes ? defaultRes.id : resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: api.resume.setDefault,
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
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: api.resume.delete,
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
    }
  });

  // Edit Label mutation
  const updateLabelMutation = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) =>
      api.resume.update(id, { label }),
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
    }
  });

  // File Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFilesSelect = (selectedFiles: File[]) => {
    const file = selectedFiles[0];
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
    }
  };

  // Find selected resume
  const selectedResume = resumes.find(r => r.id === selectedResumeId) || null;

  // Find linked applications
  const linkedApps = selectedResume
    ? applications.filter(app => String(app.resume_version_used) === String(selectedResume.id))
    : [];

  const handleCopyText = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Resume text copied to clipboard.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-4 sm:py-6 sm:px-8 space-y-6 sm:space-y-8 animate-fade-in pb-20">
      
      {/* Hero text header */}
      <div className="space-y-1.5 sm:space-y-3 text-left">
        <span className="text-[10px] md:text-xs font-extrabold tracking-[0.2em] text-outly-accent uppercase bg-outly-accent/5 px-2.5 py-1 rounded-full inline-block">
          RESUME MANAGEMENT
        </span>
        <h1 className="text-xl sm:text-4xl font-bold text-foreground leading-[1.1] tracking-tight">
          Resume Vault
        </h1>
        <p className="text-muted-foreground text-xs sm:text-[14px] leading-normal max-w-2xl">
          Store, organize and manage multiple versions of your resume for quick application tailored variants.
        </p>
      </div>

      {/* TWO COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-start">
        
        {/* ─── LEFT COLUMN: UPLOADER & STORED RESUMES LIST ─── */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">

          {/* Quick Uploader Dropzone */}
          <FileUploadCard
            files={uploadedFiles}
            onFilesChange={handleFilesSelect}
            onFileRemove={() => setFileToUpload(null)}
          />

          {/* Stored Versions List Card */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)] flex flex-col flex-1 min-h-[300px]">
            <h2 className="text-[13px] font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FolderOpen className="h-4.5 w-4.5 text-primary" />
              Stored Versions ({resumes.length})
            </h2>

            {resumesLoading ? (
              <DotLottieLoader size={140} minHeight="min-h-[200px]" />
            ) : resumes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-xl bg-secondary/10">
                <FileText className="h-7 w-7 text-muted-foreground/50 mb-2" />
                <p className="text-[12px] font-bold text-foreground">No Resumes Stored</p>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Upload a PDF or DOCX file above to track different versions in your Vault.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {resumes.map((resumeItem) => {
                  const isSelected = selectedResumeId === resumeItem.id;
                  const isDefault = resumeItem.is_default === 1;
                  const itemLinkedApps = applications.filter(
                    app => String(app.resume_version_used) === String(resumeItem.id)
                  );

                  return (
                    <div
                      key={resumeItem.id}
                      onClick={() => setSelectedResumeId(resumeItem.id)}
                      className={`group cursor-pointer rounded-xl border p-3 transition-all text-left relative ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-white hover:border-primary/40 hover:bg-secondary/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 pr-12">
                        <div className="min-w-0">
                          <h3 className="text-[12.5px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {resumeItem.label}
                          </h3>
                          <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                            {resumeItem.filename}
                          </p>
                        </div>
                      </div>

                      {/* Badges/Dates */}
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(resumeItem.createdAt || resumeItem.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {itemLinkedApps.length > 0 && (
                            <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-primary font-bold">
                              💼 {itemLinkedApps.length} {itemLinkedApps.length === 1 ? "app" : "apps"}
                            </span>
                          )}
                          {isDefault && (
                            <span className="rounded bg-success/15 border border-success/20 px-1.5 py-0.5 text-success font-bold flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" />
                              Default
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Default and Delete hover buttons */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isDefault && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-success hover:bg-success/10 rounded-md"
                            title="Set as Default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultMutation.mutate(resumeItem.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                          title="Delete Resume"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(resumeItem);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: THE MOCK BROWSER FRAME PREVIEW WORKSPACE ─── */}
        <div className="lg:col-span-7 relative flex items-center justify-center">
          
          <div className="absolute inset-0 bg-outly-accent/5 blur-[80px] rounded-full transform -translate-y-12 select-none pointer-events-none"></div>

          {/* Browser Frame Mockup Container */}
          <div className="relative bg-card border border-border/85 rounded-2xl shadow-[0_22px_70px_rgba(26,26,26,0.06)] w-full max-w-2xl overflow-hidden flex flex-col z-10 select-none h-auto sm:h-[620px]">
            
            {/* Browser Header Bar */}
            <div className="bg-secondary/40 border-b border-border/60 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-warning/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-success/80"></div>
              </div>
              <div className="bg-white border border-border/50 rounded-md text-[10px] font-bold text-muted-foreground/60 px-6 py-0.5 tracking-tight flex items-center gap-1.5 select-none">
                <Lock className="w-2.5 h-2.5 text-success shrink-0" />
                <span>vault.outly.online/cv/preview</span>
              </div>
              <div className="w-10"></div>
            </div>

            {/* Dynamic content area */}
            {selectedResume ? (
              <div className="flex-1 flex flex-col bg-white h-[calc(100%-44px)] p-5 text-left">
                
                {/* Header Action toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-3.5 mb-3.5">
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-bold text-foreground truncate flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{selectedResume.label}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-secondary rounded shrink-0 cursor-pointer"
                        title="Edit Label"
                        onClick={() => {
                          setEditLabelText(selectedResume.label);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Filename: <span className="font-mono text-foreground/80">{selectedResume.filename}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-bold gap-1 rounded-md border-border text-foreground hover:bg-secondary"
                      onClick={() => navigate("/ats-score")}
                    >
                      <Sparkles className="h-3 w-3 text-outly-accent" />
                      Check ATS
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-bold gap-1 rounded-md border-border text-foreground hover:bg-secondary"
                      onClick={() => handleCopyText(selectedResume.content)}
                    >
                      <Copy className="h-3 w-3" />
                      Copy Text
                    </Button>
                  </div>
                </div>

                {/* Sub-tabs inside preview workspace */}
                <div className="flex border-b border-border/60 mb-4 text-[11px] font-bold">
                  <button
                    onClick={() => setActivePreviewTab("preview")}
                    className={`pb-2 px-3 border-b-2 transition-all ${
                      activePreviewTab === "preview"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Document Preview
                  </button>
                  <button
                    onClick={() => setActivePreviewTab("applications")}
                    className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1 ${
                      activePreviewTab === "applications"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Used in Applications ({linkedApps.length})
                  </button>
                </div>

                {/* Sub-tab Content Panel */}
                <div className="flex-1 min-h-0 flex flex-col">
                  {activePreviewTab === "preview" ? (
                    selectedResume.filename.toLowerCase().endsWith(".pdf") ? (
                      <div className="flex-1 flex flex-col min-h-[260px] md:min-h-[420px] border border-border rounded-xl overflow-hidden bg-secondary/5">
                        <PdfViewer url={api.resume.getFileUrl(selectedResume.id)} />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto p-4 text-left border border-border rounded-xl bg-secondary/5 max-h-[300px] sm:max-h-none">
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/80">{selectedResume.content}</pre>
                      </div>
                    )
                  ) : (
                    /* Applications linked list */
                    <div className="flex-1 overflow-y-auto pr-1">
                      {linkedApps.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-secondary/5 border border-dashed border-border rounded-xl">
                          <Building className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-[12px] font-bold text-foreground">No Linked Applications</p>
                          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                            You haven't applied to any job with this resume version yet. Associate it inside the Applications Tracker details panel.
                          </p>
                          <Button size="sm" asChild variant="outline" className="h-7 text-[10px] font-semibold mt-3.5 border-border text-foreground hover:bg-secondary">
                            <Link to="/applications">Go to Applications</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {linkedApps.map((app) => (
                            <div
                              key={app.id}
                              className="rounded-xl border border-border p-3 bg-white shadow-sm flex flex-col justify-between hover:border-primary/20 transition duration-200"
                            >
                              <div className="space-y-1">
                                <span className="text-[8px] uppercase font-extrabold tracking-wider text-muted-foreground bg-secondary/70 px-1.5 py-0.5 rounded-md w-fit inline-block">
                                  {app.stage.toUpperCase()}
                                </span>
                                <h4 className="text-[12px] font-bold text-foreground line-clamp-1 mt-1">
                                  {app.company}
                                </h4>
                                <p className="text-[11px] text-muted-foreground truncate">{app.role}</p>
                              </div>

                              <div className="mt-4 border-t border-border/40 pt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                                <span className="flex items-center gap-1 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(app.createdAt || app.created_at).toLocaleDateString()}
                                </span>
                                <Link 
                                  to="/applications" 
                                  className="text-primary hover:underline flex items-center gap-0.5 font-bold"
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
                </div>

              </div>
            ) : (
              /* Empty state placeholder inside browser frame */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground/45" />
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-sm font-bold text-foreground">No Resume Selected</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Select a resume version from the left panel to preview its parsed plain text, audit history, and associated applications.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Upload Label Confirmation Modal - restyled to use premium Dialog */}
      <Dialog open={fileToUpload !== null} onOpenChange={(open) => !open && setFileToUpload(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-border bg-card p-6 font-sans">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <FileText className="w-6 h-6 shrink-0" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">Label New Resume Version</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              File uploaded: <span className="font-mono text-foreground font-semibold">{fileToUpload?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Descriptive Label *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Frontend Engineer (Pro v1)"
              className="w-full rounded-lg border border-border bg-white p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm placeholder:text-muted-foreground/55"
              value={resumeLabel}
              onChange={(e) => setResumeLabel(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
              Give this resume version a clear label to distinguish it when matching against job descriptions.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center border-t border-border/40 pt-4 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto border-border text-xs font-medium h-9 rounded-full hover:bg-secondary active:scale-[0.98] transition"
              onClick={() => setFileToUpload(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveResume}
              disabled={isSaving}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-medium h-9 rounded-full shadow-sm active:scale-[0.98] transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3 animate-spin" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[420px] border-border bg-card p-6 font-sans">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Edit2 className="w-5 h-5 shrink-0" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">Rename Resume Version</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Update the label identifier for this resume version.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Descriptive Label *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Frontend Engineer (Pro v1)"
              className="w-full rounded-lg border border-border bg-white p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm placeholder:text-muted-foreground/55"
              value={editLabelText}
              onChange={(e) => setEditLabelText(e.target.value)}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center border-t border-border/40 pt-4 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto border-border text-xs font-medium h-9 rounded-full hover:bg-secondary active:scale-[0.98] transition"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedResume && editLabelText.trim()) {
                  updateLabelMutation.mutate({
                    id: String(selectedResume.id),
                    label: editLabelText.trim()
                  });
                }
              }}
              disabled={updateLabelMutation.isPending || !editLabelText.trim()}
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-medium h-9 rounded-full shadow-sm active:scale-[0.98] transition-all"
            >
              {updateLabelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border bg-card max-w-[340px] p-5 rounded-2xl gap-0">
          <AlertDialogHeader className="pb-0 space-y-1">
            <AlertDialogTitle className="text-base font-bold text-foreground">Delete Resume Version?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">"{deleteTarget?.label}"</strong>? This will remove this version from your vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2.5 mt-5">
            <AlertDialogCancel className="flex-1 h-9 rounded-xl text-xs font-bold border-border text-foreground hover:bg-secondary cursor-pointer m-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-9 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer m-0"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ResumeVaultItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
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
  FolderOpen
} from "lucide-react";

export default function ResumeVaultPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"content" | "applications">("content");
  
  // Upload and Label modal state
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<{ filename: string; content: string } | null>(null);
  const [resumeLabel, setResumeLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch resumes from vault
  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Fetch applications to match and interconnect
  const { data: applications = [] } = useQuery({
    queryKey: ["applications"],
    queryFn: api.applications.list,
  });

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
      // Invalidate applications in case they reference deleted resume
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

  // Create/Add resume mutation
  const createMutation = useMutation({
    mutationFn: api.resume.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", "list"] });
      setParsedData(null);
      setResumeLabel("");
      toast({
        title: "Resume Saved",
        description: "New resume version successfully saved to the vault.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error Saving Resume",
        description: String(err),
      });
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  // File Upload parsing handler
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

    setIsUploading(true);
    try {
      const data = await api.ats.parseFile(file);
      setParsedData(data);
      // Auto-suggest a label from the filename
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setResumeLabel(baseName.split("_").join(" ").split("-").join(" "));
      toast({
        title: "Extraction Successful",
        description: "Extracted structure and text format from file.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to Parse File",
        description: String(err),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveResume = () => {
    if (!parsedData) return;
    if (!resumeLabel.trim()) {
      toast({
        variant: "destructive",
        title: "Label Required",
        description: "Please provide a name/label for this resume version.",
      });
      return;
    }

    setIsSaving(true);
    createMutation.mutate({
      filename: parsedData.filename,
      label: resumeLabel.trim(),
      content: parsedData.content,
      is_default: resumes.length === 0, // make it default if it is the first resume
    });
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
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[13px] font-medium text-primary uppercase tracking-wider font-semibold">Resume Management</p>
          <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-foreground">Resume Vault</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
            Store and manage different versions of your resume. Set a default resume, audit them for ATS compliance, and track which resume versions are used for which applications.
          </p>
        </div>
        
        {/* Upload Button */}
        <div>
          <Button
            onClick={() => document.getElementById("vault-upload")?.click()}
            disabled={isUploading || isSaving}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing File...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Upload Resume
              </>
            )}
          </Button>
          <input
            id="vault-upload"
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
            onClick={(e) => {
              // Reset target value to allow uploading the same file again
              (e.target as HTMLInputElement).value = "";
            }}
          />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Resumes List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-[15px] font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <FolderOpen className="h-4.5 w-4.5 text-primary" />
              Stored Versions ({resumes.length})
            </h2>

            {resumesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/10 px-4">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-[13px] font-medium text-foreground">No Resumes Stored</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-5">
                  Upload a PDF/Word resume to begin tracking different versions.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {resumes.map((resumeItem) => {
                  const isSelected = selectedResumeId === resumeItem.id;
                  const isDefault = resumeItem.is_default === 1;
                  const itemLinkedApps = applications.filter(
                    app => String(app.resume_version_used) === String(resumeItem.id)
                  );

                  return (
                    <div
                      key={resumeItem.id}
                      onClick={() => {
                        setSelectedResumeId(resumeItem.id);
                        setActivePreviewTab("content");
                      }}
                      className={`group cursor-pointer rounded-lg border p-3.5 transition-all text-left relative ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-white hover:border-primary/40 hover:bg-secondary/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 pr-8">
                        <div className="min-w-0">
                          <h3 className="text-[13.5px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {resumeItem.label}
                          </h3>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
                            {resumeItem.filename}
                          </p>
                        </div>
                      </div>

                      {/* Badges/Dates */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(resumeItem.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {itemLinkedApps.length > 0 && (
                            <span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-primary font-semibold">
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

                      {/* Default Toggle Pin and Delete Buttons - visible on hover */}
                      <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isDefault && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-success hover:bg-success/10"
                            title="Set as Default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultMutation.mutate(resumeItem.id);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Resume"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Are you sure you want to delete "${resumeItem.label}"? This will unlink it from any applications.`
                              )
                            ) {
                              deleteMutation.mutate(resumeItem.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Resume Detail / Preview Area */}
        <div className="lg:col-span-2 space-y-4">
          {selectedResume ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] min-h-[500px] flex flex-col">
              {/* Header stats of selected */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border/40 pb-4 mb-4">
                <div>
                  <h2 className="text-[17px] font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-primary" />
                    {selectedResume.label}
                  </h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>File: <strong>{selectedResume.filename}</strong></span>
                    <span>•</span>
                    <span>Uploaded: <strong>{new Date(selectedResume.created_at).toLocaleDateString()}</strong></span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[12px] gap-1.5"
                    onClick={() => {
                      // Navigate to ATS Checker page with this resume selected
                      navigate("/ats-score");
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Run ATS Audit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[12px] gap-1.5"
                    onClick={() => handleCopyText(selectedResume.content)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Text
                  </Button>
                </div>
              </div>

              {/* Tabs for selected resume detail view */}
              <div className="flex border-b border-border/60 mb-4 text-xs font-semibold">
                <button
                  onClick={() => setActivePreviewTab("content")}
                  className={`pb-2 px-3 border-b-2 transition-all ${
                    activePreviewTab === "content"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Parsed Document Text
                </button>
                <button
                  onClick={() => setActivePreviewTab("applications")}
                  className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    activePreviewTab === "applications"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Used in Applications ({linkedApps.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 flex flex-col min-h-0">
                {activePreviewTab === "content" ? (
                  <div className="flex-1 max-h-[460px] overflow-y-auto rounded-lg border border-border bg-secondary/30 p-4 min-h-[300px]">
                    <pre className="whitespace-pre-wrap font-sans text-[13px] leading-6 text-foreground">
                      {selectedResume.content || "Empty content / could not parse text."}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 space-y-3 max-h-[460px] overflow-y-auto min-h-[300px]">
                    {linkedApps.length === 0 ? (
                      <div className="text-center py-12 bg-secondary/10 border border-dashed border-border rounded-lg px-4">
                        <Building className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                        <p className="text-[13px] font-semibold text-foreground">No Linked Applications</p>
                        <p className="text-[12px] text-muted-foreground mt-1 max-w-sm mx-auto">
                          You haven't tracked any applications with this resume version yet. Associate it from the **Applications Tracker** details panel.
                        </p>
                        <div className="mt-4">
                          <Button size="sm" asChild variant="outline">
                            <Link to="/applications">Go to Applications Tracker</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {linkedApps.map((app) => (
                          <div
                            key={app.id}
                            className="rounded-lg border border-border p-3.5 bg-white shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded w-fit">
                                {app.stage.toUpperCase()}
                              </span>
                              <h4 className="text-[13.5px] font-bold text-foreground line-clamp-1 mt-1">
                                {app.company}
                              </h4>
                              <p className="text-[12px] text-muted-foreground truncate">{app.role}</p>
                            </div>

                            <div className="mt-4 border-t border-border/40 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/5 gap-0.5"
                                asChild
                              >
                                <Link to="/applications">
                                  View Tracker <ChevronRight className="h-3 w-3" />
                                </Link>
                              </Button>
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
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground min-h-[500px] flex flex-col items-center justify-center space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground/45" />
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">No Resume Selected</h3>
                <p className="text-[12px] text-muted-foreground max-w-sm mt-1.5 mx-auto">
                  Select a resume version from the list to preview its parsed plain text, audit history, and associated applications.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Label Confirmation Modal */}
      {parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-[16px] font-bold text-foreground">Label New Resume Version</h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setParsedData(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 text-[13px]">
              <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  File parsed successfully
                </div>
                <div className="text-[11px] text-muted-foreground font-mono truncate">
                  Filename: {parsedData.filename}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Descriptive Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineer (Senior v2)"
                  className="w-full rounded-lg border border-border bg-white p-2.5 outline-none focus:border-primary text-foreground"
                  value={resumeLabel}
                  onChange={(e) => setResumeLabel(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Give this resume version a clear label to distinguish it when matching against job descriptions.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button type="button" variant="ghost" onClick={() => setParsedData(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveResume}
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  {isSaving ? "Saving..." : "Save to Vault"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

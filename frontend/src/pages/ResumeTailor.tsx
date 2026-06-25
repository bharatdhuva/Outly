import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, X, FileText } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function ResumeTailorPage() {
  const { toast } = useToast();
  const [jobDesc, setJobDesc] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<string>("custom");
  const [loading, setLoading] = useState(false);
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
    if (idStr === "custom") {
      setResumeText(null);
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResumeText(found.content);
      }
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
          {/* Resume Header with Vault Selection Dropdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Resume source</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Upload a PDF/Word file or select from vault.</p>
            </div>
            {resumes.length > 0 && (
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

          {/* Upload Placeholder State (only if nothing loaded and not loading) */}
          {!resumeFile && selectedVaultId === "custom" && !loading && (
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

          {/* Document Preview Pane */}
          {(resumeFile || selectedVaultId !== "custom") && !loading && (
            <div className="min-h-0 flex-1 flex flex-col min-h-[300px]">
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
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>

              {/* Rendering logic */}
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

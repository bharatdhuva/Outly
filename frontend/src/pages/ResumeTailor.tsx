import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, X } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ResumeTailorPage() {
  const { toast } = useToast();
  const [jobDesc, setJobDesc] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
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
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold text-foreground">Resume source</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Upload a PDF, DOC, DOCX, or TXT file for preview.</p>
          </div>

          {!resumeFile && (
            <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-border bg-secondary p-8 text-center">
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

          {loading && (
            <div className="grid flex-1 place-items-center rounded-xl border border-border bg-secondary">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-[13px] font-medium text-muted-foreground">Loading your resume...</span>
              </div>
            </div>
          )}

          {resumeFile && !loading && (
            <div className="min-h-0 flex-1">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="truncate text-[13px] font-semibold text-foreground">{resumeFile.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-muted-foreground"
                  onClick={() => {
                    setResumeFile(null);
                    setResumeText(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
              {resumeFile.type === "application/pdf" ? (
                <div className="overflow-hidden rounded-lg border border-border bg-secondary">
                  <PdfViewer file={resumeFile} />
                </div>
              ) : resumeText ? (
                <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border bg-secondary p-4">
                  <pre className="whitespace-pre-wrap font-mono text-[12px] leading-5 text-foreground">{resumeText}</pre>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

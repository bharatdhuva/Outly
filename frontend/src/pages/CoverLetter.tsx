import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UploadCloud, Copy, FileText, Download, RefreshCw } from "lucide-react";

export default function CoverLetterPage() {
  const { toast } = useToast();
  const [resume, setResume] = useState("");
  const [selectedVaultId, setSelectedVaultId] = useState<string>("custom");
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Fetch resumes from vault
  const { data: resumes = [] } = useQuery({
    queryKey: ["resume", "list"],
    queryFn: api.resume.list,
  });

  // Automatically load default resume if present
  useEffect(() => {
    if (resumes.length > 0 && !resume) {
      const defaultResume = resumes.find(r => r.is_default === 1);
      if (defaultResume && defaultResume.content) {
        setResume(defaultResume.content);
        setSelectedVaultId(String(defaultResume.id));
      }
    }
  }, [resumes]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      toast({
        variant: "destructive",
        title: "Unsupported File",
        description: "Please upload a .txt file, or copy-paste your resume directly.",
      });
      return;
    }

    try {
      const text = await file.text();
      setResume(text);
      setSelectedVaultId("custom");
      toast({
        title: "Resume Loaded",
        description: "Successfully read text from file.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error Reading File",
        description: String(err),
      });
    }
  };

  const handleVaultSelect = (idStr: string) => {
    setSelectedVaultId(idStr);
    if (idStr === "custom") {
      setResume("");
    } else {
      const found = resumes.find(r => String(r.id) === idStr);
      if (found && found.content) {
        setResume(found.content);
      }
    }
  };

  const generateCoverLetter = async () => {
    if (!resume.trim()) {
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please paste your resume text or upload a file.",
      });
      return;
    }
    if (!jd.trim()) {
      toast({
        variant: "destructive",
        title: "Job Description Required",
        description: "Please paste the job description.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.coverletter.generate(resume, jd, tone);
      setCoverLetter(res.coverLetter);
      toast({
        title: "Cover Letter Generated",
        description: `Successfully generated cover letter with ${tone} tone.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    toast({
      title: "Copied!",
      description: "Cover letter copied to clipboard.",
    });
  };

  const downloadPdf = () => {
    if (!coverLetter) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Download Blocked",
        description: "Popups are blocked by your browser. Please allow popups to download.",
      });
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              line-height: 1.6;
              margin: 50px 60px;
              color: #1a1a1a;
              font-size: 11pt;
            }
            .content {
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="content">${coverLetter}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast({
      title: "PDF Dialog Opened",
      description: "Review and save your document.",
    });
  };

  const getWordCount = () => {
    return coverLetter.trim().split(/\s+/).filter(Boolean).length;
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <div>
        <p className="text-[13px] font-medium text-primary">Workspace</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">Cover Letter Generator</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Instantly craft a personalized cover letter matching your target role. Choose a tone and generate a tailored pitch in seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">1. Paste Resume</h2>
              <p className="text-[13px] text-muted-foreground mb-2">Paste raw text or upload a .txt file.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-[12px] h-8"
                  onClick={() => document.getElementById("resume-upload-cl")?.click()}
                >
                  <UploadCloud className="h-4.5 w-4.5" />
                  Upload .txt
                </Button>
                <input
                  id="resume-upload-cl"
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <Textarea
              className="min-h-[180px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              placeholder="Paste resume details, experience, and skills..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">2. Paste Job Description</h2>
              <p className="text-[13px] text-muted-foreground mb-2">Include role specifics and qualification requirements.</p>
            </div>
            <Textarea
              className="min-h-[180px] resize-y rounded-lg border-border bg-white text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              placeholder="Paste job description details..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </section>

          {/* Tone Selector */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-3">
            <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/60">
              3. Select Letter Tone
            </span>
            <div className="flex border border-border rounded-lg overflow-hidden bg-secondary/50">
              {["Professional", "Conversational", "Enthusiastic"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`flex-1 py-2 text-center text-xs font-semibold border-r border-border last:border-r-0 transition-all ${
                    tone === t ? "bg-white text-primary" : "text-muted-foreground hover:bg-secondary/40"
                  }`}
                  onClick={() => setTone(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <div className="flex justify-center">
            <Button
              onClick={generateCoverLetter}
              disabled={loading}
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Cover Letter...
                </>
              ) : (
                "Generate Cover Letter"
              )}
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <div className="h-full flex flex-col">
          <section className="flex-1 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Generated Pitch
                </h2>
                <p className="text-[11px] text-muted-foreground">Directly edit the generated content below if needed.</p>
              </div>
              {coverLetter && (
                <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                  {getWordCount()} words
                </span>
              )}
            </div>

            {coverLetter ? (
              <div className="flex-1 flex flex-col space-y-4">
                <Textarea
                  className="flex-1 min-h-[460px] resize-none rounded-lg border-border bg-white text-[14px] leading-relaxed text-foreground font-sans focus-visible:ring-primary overflow-y-auto"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCopy} className="gap-2 text-[12px]">
                    <Copy className="h-4 w-4" />
                    Copy Text
                  </Button>
                  <Button variant="outline" onClick={downloadPdf} className="gap-2 text-[12px]">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-lg p-12 text-center text-muted-foreground bg-muted/10 min-h-[460px]">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-[13px] font-medium">No Pitch Generated Yet</p>
                <p className="text-[11px] text-muted-foreground/60 max-w-[240px] mt-1">
                  Fill in your resume, target job details, select a tone and click generate to view output.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";

export default function ResumeTailorPage() {
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
    if (file.type === "application/pdf") {
      setTimeout(() => {
        setResumeText(null);
        setLoading(false);
      }, 900);
    } else {
      const text = await file.text();
      setTimeout(() => {
        setResumeText(text);
        setLoading(false);
      }, 1200);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto py-10">
      {/* Left: Job Description Paste */}
      <div className="flex-1 bg-white/80 rounded-xl shadow p-6 border border-blue-100">
        <h2 className="text-lg font-semibold mb-2 text-blue-700">Paste Job Description</h2>
        <Textarea
          className="min-h-[220px] resize-vertical border-blue-200 focus:ring-blue-400"
          placeholder="Paste the job description here..."
          value={jobDesc}
          onChange={e => setJobDesc(e.target.value)}
        />
      </div>
      {/* Right: Resume Upload & Preview */}
      <div className="flex-1 bg-white/80 rounded-xl shadow p-6 border border-blue-100 flex flex-col items-center justify-center min-h-[320px]">
        {!resumeFile && (
          <>
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="w-10 h-10 text-blue-400" />
              <p className="text-blue-700 font-medium">Drag & drop or upload your resume</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Resume
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="text-xs text-gray-400">PDF, DOC, DOCX, or TXT</span>
            </div>
          </>
        )}
        {loading && (
          <div className="flex flex-col items-center gap-2 mt-6">
            <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
            <span className="text-blue-500 text-sm">Loading your resume...</span>
          </div>
        )}
        {resumeFile && !loading && (
          <div className="w-full mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-blue-700">{resumeFile.name}</span>
              <Button size="xs" variant="ghost" onClick={() => { setResumeFile(null); setResumeText(null); }}>Remove</Button>
            </div>
            {resumeFile.type === "application/pdf" ? (
              <PdfViewer file={resumeFile} />
            ) : resumeText ? (
              <div className="max-h-[340px] overflow-y-auto bg-blue-50 rounded p-4 border border-blue-100">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono">{resumeText}</pre>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

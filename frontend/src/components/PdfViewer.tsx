import { useState } from "react";
import { Download, FileText, Sparkles, Loader2 } from "lucide-react";

export default function PdfViewer({ 
  file, 
  url, 
  content, 
  filename 
}: { 
  file?: File | null; 
  url?: string | null; 
  content?: string | null;
  filename?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (file) {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type || "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || file.name || "Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else if (url) {
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
      } else if (content) {
        const blob = new Blob([content], { type: "text/plain" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename ? filename.replace(/\.(pdf|docx)$/i, ".txt") : "Resume.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center bg-card rounded-xl p-8 min-h-[400px] w-full border border-border/60 shadow-xs text-center overflow-hidden">
      
      {/* Soft Background Accent Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Center Icon Circle */}
      <div className="relative mb-5 flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-xs">
        <FileText className="h-8 w-8 stroke-[1.75]" />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* Heading & Subtitle requested by user */}
      <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
        Currently Working on Direct Resume Preview
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        Till now, download your resume to view the exact original document cleanly on your device.
      </p>

      {/* Download Resume Now Action Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 stroke-[2.2]" />
            <span>Download Resume Now</span>
          </>
        )}
      </button>

      {filename && (
        <span className="mt-4 text-xs text-muted-foreground/80 font-mono">
          File: {filename}
        </span>
      )}
    </div>
  );
}

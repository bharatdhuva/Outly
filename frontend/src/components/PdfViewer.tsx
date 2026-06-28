import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, AlertCircle } from "lucide-react";

const loadPdfJs = () => {
  return new Promise<any>((resolve) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    document.body.appendChild(script);
  });
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    let active = true;
    
    // If we have plain text content, we don't need to load pdf.js
    if (content) {
      setLoading(false);
      setError(null);
      return;
    }

    if (!file && !url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const renderPdf = async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        let loadingTask;
        if (file) {
          const arrayBuffer = await file.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else if (url) {
          const token = localStorage.getItem("outly_token");
          const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        } else {
          return;
        }
        const pdf = await loadingTask.promise;

        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        // Clear container first
        container.innerHTML = "";

        const containerWidth = container.clientWidth > 0 ? container.clientWidth - 24 : 500;

        // Render each page vertically onto dynamic canvases
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1.0 });
          const calculatedScale = containerWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale: Math.min(Math.max(calculatedScale, 0.75), 1.1) });

          const canvas = document.createElement("canvas");
          canvas.className = "max-w-full h-auto shadow-md border border-border/60 rounded-md bg-white mb-4 transition-all hover:shadow-lg";
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          container.appendChild(canvas);

          const context = canvas.getContext("2d");
          if (context) {
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            await page.render(renderContext).promise;
          }
        }

        if (active) setLoading(false);
      } catch (err) {
        console.error("PDF rendering error", err);
        if (active) {
          setError("Failed to render PDF preview. Please download the file to view.");
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      active = false;
    };
  }, [file, url, content]);

  // Render plain text content if provided
  if (content) {
    return (
      <div className="w-full bg-slate-50 border border-border rounded-xl p-6 overflow-auto max-h-[600px] text-left font-mono text-xs text-slate-700 whitespace-pre-wrap shadow-inner">
        {content}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[380px] bg-secondary/15 rounded-xl border border-border/60 p-2 overflow-hidden">
      {loading && (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground mt-2">Loading PDF preview...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
          <div className="relative mb-5 flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">{error}</h3>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Download File</span>
          </button>
        </div>
      )}

      {/* The actual PDF container */}
      <div
        ref={containerRef}
        className={`w-full flex-1 flex flex-col items-center overflow-y-auto max-h-[520px] custom-scrollbar p-2 ${
          loading || error ? "hidden" : "block"
        }`}
      />
    </div>
  );
}

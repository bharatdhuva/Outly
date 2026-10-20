import { useEffect, useRef, useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";

let cachedPdfJsPromise: Promise<any> | null = null;

const loadPdfJs = () => {
  if (cachedPdfJsPromise) return cachedPdfJsPromise;

  cachedPdfJsPromise = new Promise<any>((resolve, reject) => {
    const existingLib = (window as any).pdfjsLib;
    if (existingLib && existingLib.version && existingLib.version.startsWith("3.")) {
      resolve(existingLib);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = async () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        try {
          // Fetch worker text and create same-origin Blob URL to bypass Worker CORS restrictions
          const workerRes = await fetch("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");
          const workerText = await workerRes.text();
          const workerBlob = new Blob([workerText], { type: "text/javascript" });
          pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
        } catch (e) {
          console.warn("Could not inline pdf worker blob, using direct URL", e);
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
      }
      resolve(pdfjsLib);
    };
    script.onerror = (e) => reject(new Error("Failed to load PDF.js script"));
    document.body.appendChild(script);
  });

  return cachedPdfJsPromise;
};

export default function PdfViewer({
  file,
  url,
  content,
  filename,
  className,
  maxHeight,
}: {
  file?: File | null;
  url?: string | null;
  content?: string | null;
  filename?: string;
  className?: string;
  maxHeight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<"canvas" | "native">("canvas");

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (blobUrl) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      if (file) {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type || "application/pdf" });
        const bUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = bUrl;
        a.download = filename || file.name || "Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(bUrl), 1000);
      } else if (url) {
        const token = localStorage.getItem("outly_token");
        const headers: Record<string, string> = token && !url.startsWith("/") ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch(url, { headers });
        const blob = await res.blob();
        const bUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = bUrl;
        a.download = filename || "Resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(bUrl), 1000);
      } else if (content) {
        const blob = new Blob([content], { type: "text/plain" });
        const bUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = bUrl;
        a.download = filename ? filename.replace(/\.(pdf|docx)$/i, ".txt") : "Resume.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(bUrl), 1000);
      }
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let active = true;

    // Plain text content fallback only when no file or url provided
    if (!file && !url && content) {
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
      let currentBlobUrl = "";
      let pdfData: ArrayBuffer;

      try {
        if (file) {
          pdfData = await file.arrayBuffer();
          currentBlobUrl = URL.createObjectURL(file);
        } else if (url) {
          const token = localStorage.getItem("outly_token");
          const headers: Record<string, string> =
            token && !url.startsWith("/") ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(url, { headers });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          pdfData = await res.arrayBuffer();
          const pdfBlob = new Blob([pdfData], { type: "application/pdf" });
          currentBlobUrl = URL.createObjectURL(pdfBlob);
        } else {
          return;
        }

        if (!active) return;
        setBlobUrl(currentBlobUrl);

        // Primary: Try PDF.js Canvas Rendering with same-origin worker
        try {
          const pdfjsLib = await loadPdfJs();
          const loadingTask = pdfjsLib.getDocument({ data: pdfData.slice(0) });
          const pdf = await loadingTask.promise;

          if (!active) return;

          const container = containerRef.current;
          if (!container) return;

          container.innerHTML = "";
          const containerWidth = container.clientWidth > 0 ? container.clientWidth - 24 : 560;

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const calculatedScale = containerWidth / unscaledViewport.width;
            const viewport = page.getViewport({
              scale: Math.min(Math.max(calculatedScale, 0.75), 1.25),
            });

            const canvas = document.createElement("canvas");
            canvas.className =
              "max-w-full h-auto shadow-md border border-neutral-200/80 rounded-md bg-white mb-4 transition-all hover:shadow-lg";
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            container.appendChild(canvas);

            const context = canvas.getContext("2d");
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
            }
          }

          if (active) {
            setRenderMode("canvas");
            setLoading(false);
          }
        } catch (canvasErr) {
          console.warn("PDF.js canvas rendering fallback to native embed", canvasErr);
          if (active) {
            // Gracefully switch to native browser PDF embed without showing an error
            setRenderMode("native");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("PDF load error", err);
        if (active) {
          setError("Failed to load PDF preview. Please download the file to view.");
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      active = false;
    };
  }, [file, url, content]);

  // Render plain text content only if provided and no file or url
  if (!file && !url && content) {
    return (
      <div className="w-full bg-slate-50 border border-border rounded-xl p-6 overflow-auto max-h-[600px] text-left font-mono text-xs text-slate-700 whitespace-pre-wrap shadow-inner">
        {content}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-secondary/15 rounded-xl border border-border/60 p-2 overflow-hidden ${
        className || ""
      }`}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground mt-2">
            Loading PDF preview...
          </span>
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
            className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Download File</span>
          </button>
        </div>
      )}

      {/* Native Browser PDF Embed Fallback (rock-solid, zero worker dependency) */}
      {renderMode === "native" && blobUrl && !loading && !error && (
        <iframe
          src={`${blobUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full min-h-[720px] rounded-lg border-0 bg-white"
          title={filename || "PDF Preview"}
        />
      )}

      {/* Dynamic Canvas PDF Container */}
      <div
        ref={containerRef}
        className={`w-full flex-1 flex flex-col items-center overflow-y-auto ${
          maxHeight || "max-h-[760px]"
        } custom-scrollbar p-2 ${
          loading || error || renderMode !== "canvas"
            ? "hidden"
            : "flex flex-col items-center"
        }`}
      />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, FileText, Monitor, Layers, FileCode } from "lucide-react";

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

export default function PdfViewer({ file, url, content }: { file?: File | null; url?: string | null; content?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "native" | "text">("canvas");

  useEffect(() => {
    let active = true;
    
    // If explicit content string is passed directly, use text view mode immediately
    if (content && !file && !url) {
      setFallbackText(content);
      setViewMode("text");
      setLoading(false);
      return;
    }

    if (!file && !url) {
      if (content) {
        setFallbackText(content);
        setViewMode("text");
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setFallbackText(null);

    const renderPdf = async () => {
      try {
        let buffer: ArrayBuffer;

        if (file) {
          buffer = await file.arrayBuffer();
        } else if (url) {
          const token = localStorage.getItem("outly_token");
          const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
          const response = await fetch(url, { headers });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          buffer = await response.arrayBuffer();
        } else {
          return;
        }

        // Check if buffer starts with %PDF magic bytes (%PDF- -> 0x25, 0x50, 0x44, 0x46)
        const bytes = new Uint8Array(buffer, 0, 4);
        const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

        if (!isPdf) {
          // It's not a binary PDF (e.g. text fallback, docx text, or plain text resume)
          const decodedText = new TextDecoder("utf-8").decode(buffer);
          if (active) {
            setFallbackText(decodedText || content || "No text preview available.");
            setViewMode("text");
            setLoading(false);
          }
          return;
        }

        // It's a valid PDF! Create blob and render with pdf.js
        const blob = new Blob([buffer], { type: "application/pdf" });
        if (active) setPdfBlobUrl(URL.createObjectURL(blob));

        const pdfjsLib = await loadPdfJs();
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.25 });
          
          const canvas = document.createElement("canvas");
          canvas.className = "max-w-full h-auto shadow-md border border-border/60 rounded-md bg-white mb-4 transition-all hover:shadow-lg";
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          container.appendChild(canvas);

          const context = canvas.getContext("2d");
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }
        }

        if (active) {
          setViewMode("canvas");
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF rendering error", err);
        if (active) {
          if (content) {
            setFallbackText(content);
            setViewMode("text");
            setError(null);
          } else {
            setError("Failed to render PDF preview. Please download the file to view.");
          }
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      active = false;
    };
  }, [file, url, content]);

  return (
    <div className="relative flex flex-col items-center bg-secondary/15 rounded-lg p-3.5 overflow-hidden min-h-[420px] w-full border border-border/50">
      
      {/* View Mode Toggle Bar */}
      <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-border/40 text-xs shrink-0">
        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" /> Document Preview
        </span>
        
        {!loading && !error && (
          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-md border border-border/60 shadow-xs">
            {fallbackText ? (
              <button 
                type="button"
                onClick={() => setViewMode("text")} 
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-primary text-primary-foreground shadow-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <FileCode className="h-3 w-3" /> Text Content View
              </button>
            ) : (
              <>
                <button 
                  type="button"
                  onClick={() => setViewMode("canvas")} 
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "canvas" 
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Layers className="h-3 w-3" /> Clean View
                </button>
                <button 
                  type="button"
                  onClick={() => setViewMode("native")} 
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "native" 
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Monitor className="h-3 w-3" /> Default PDF Viewer
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <span className="text-[12px] text-muted-foreground font-semibold">Generating document preview...</span>
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-destructive space-y-2">
          <AlertCircle className="h-6 w-6" />
          <p className="text-[13px] font-semibold">{error}</p>
        </div>
      )}

      {/* Mode 1: Dynamic Canvases */}
      <div 
        ref={containerRef} 
        className="w-full flex flex-col items-center overflow-y-auto max-h-[460px] pr-1" 
        style={{ display: !loading && !error && viewMode === "canvas" ? "flex" : "none" }}
      />

      {/* Mode 2: Native Default Browser PDF Viewer Iframe */}
      {!loading && !error && viewMode === "native" && pdfBlobUrl && (
        <div className="w-full h-[460px] rounded-md overflow-hidden border border-border/60 bg-white">
          <iframe 
            src={pdfBlobUrl} 
            className="w-full h-full border-0" 
            title="Native PDF Viewer"
          />
        </div>
      )}

      {/* Mode 3: Clean Fallback Text Reader */}
      {!loading && !error && viewMode === "text" && fallbackText && (
        <div className="w-full h-[460px] rounded-md overflow-y-auto border border-border/60 bg-background p-4 text-xs leading-relaxed text-foreground font-mono whitespace-pre-wrap shadow-inner">
          {fallbackText}
        </div>
      )}
    </div>
  );
}

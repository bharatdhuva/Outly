import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

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

export default function PdfViewer({ file }: { file: File }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!file) return;

    setLoading(true);
    setError(null);

    const renderPdf = async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        // Clear container first
        container.innerHTML = "";

        // Render each page vertically onto dynamic canvases
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          
          // Set scale. 1.25 is perfect for SDE resumes inside side panels
          const viewport = page.getViewport({ scale: 1.25 });
          
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
  }, [file]);

  return (
    <div className="relative flex flex-col items-center bg-secondary/15 rounded-lg p-4 overflow-y-auto max-h-[480px] min-h-[380px] w-full border border-border/50">
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
      <div 
        ref={containerRef} 
        className="w-full flex flex-col items-center" 
        style={{ display: loading || error ? "none" : "flex" }}
      />
    </div>
  );
}

import { useEffect, useRef } from "react";

export default function PdfViewer({ file }: { file: File }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const iframe = iframeRef.current;
    if (iframe) iframe.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <iframe
      ref={iframeRef}
      title="Resume PDF Preview"
      className="w-full h-[480px] rounded border border-blue-200 bg-white shadow"
      style={{ minHeight: 320 }}
    />
  );
}

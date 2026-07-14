import * as React from "react";
import { UploadCloud, X, File as FileIcon, CheckCircle2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Define the structure for a file being uploaded
export interface UploadedFile {
  id: string;
  file: File;
  progress: number; // 0-100
  status: "uploading" | "completed" | "error";
}

// Define the props for the component
interface FileUploadCardProps extends React.HTMLAttributes<HTMLDivElement> {
  files: UploadedFile[];
  onFilesChange: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onClose?: () => void;
}

export const FileUploadCard = React.forwardRef<HTMLDivElement, FileUploadCardProps>(
  ({ className, files = [], onFilesChange, onFileRemove, onClose, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Handler for drag enter event
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    // Handler for drag leave event
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    // Handler for drag over event
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handler for drop event
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles && droppedFiles.length > 0) {
        onFilesChange(droppedFiles);
      }
    };

    // Handler for file input change
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesChange(selectedFiles);
      }
    };

    // Trigger file input click
    const triggerFileSelect = () => fileInputRef.current?.click();

    // Format file size for display
    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 KB";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
    
    // Animation variants for Framer Motion
    const cardVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };
    
    const fileItemVariants = {
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0 },
    };

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.25 }}
        className={cn(
          "w-full bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden",
          className
        )}
        {...props}
      >
        <div className="p-5 sm:p-6 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UploadCloud className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Upload Resume</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select and upload your CV versions to the Vault
                </p>
              </div>
            </div>
            {onClose && (
               <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 cursor-pointer" onClick={onClose}>
                 <X className="w-4 h-4 text-muted-foreground" />
               </Button>
            )}
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={cn(
              "mt-5 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors duration-200 cursor-pointer select-none",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-zinc-400/80 hover:border-primary/50 hover:bg-secondary/10"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <UploadCloud className="w-8 h-8 text-primary/70 mb-3" />
            <p className="text-[12px] font-bold text-foreground">Choose a file or drag & drop it here.</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              PDF, DOCX, and TXT formats, up to 5 MB.
            </p>
            <Button variant="outline" size="sm" className="mt-3.5 h-8 text-xs font-bold border-border hover:bg-secondary">
              Browse File
            </Button>
          </div>
        </div>
        
        {files.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-border/60 bg-secondary/5">
            <ul className="space-y-3.5">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.li
                    key={file.id}
                    variants={fileItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    className="flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 text-[10px] font-extrabold text-primary shrink-0">
                        {file.file.name.split(".").pop()?.toUpperCase() || "FILE"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-foreground truncate">{file.file.name}</p>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          {file.status === "uploading" && (
                            <span>{formatFileSize((file.file.size * file.progress) / 100)} of {formatFileSize(file.file.size)}</span>
                          )}
                          {file.status === "completed" && (
                            <span>{formatFileSize(file.file.size)}</span>
                          )}
                          <span>•</span>
                          <span className={cn(
                             {"text-primary font-bold": file.status === 'uploading'},
                             {"text-emerald-500 font-bold": file.status === 'completed'},
                             {"text-destructive font-bold": file.status === 'error'},
                          )}>
                            {file.status === 'uploading' ? `Uploading...` : file.status === 'completed' ? 'Completed' : 'Error'}
                          </span>
                        </div>
                        {file.status === 'uploading' && <Progress value={file.progress} className="h-1 mt-1.5 bg-primary/10" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {file.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-lg w-7 h-7 hover:bg-destructive/10 hover:text-destructive cursor-pointer text-muted-foreground" 
                        onClick={() => onFileRemove(file.id)}
                      >
                         {file.status === 'completed' ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </motion.div>
    );
  }
);
FileUploadCard.displayName = "FileUploadCard";

"use client";

import { useRef, useState } from "react";
import { FileImage, Upload } from "lucide-react";

type UploadZoneProps = {
  onFile: (file: File) => void;
  accept?: string;
  allowedLabel?: string;
  fileName: string | null;
};

/**
 * Styled drag-and-drop upload zone. Clicking anywhere in the dashed area
 * opens the file picker; files can also be dropped onto it.
 */
export default function UploadZone({
  onFile,
  accept = "image/*",
  allowedLabel = "PNG, JPG, or WebP",
  fileName,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
        isDragging
          ? "border-violet-400 bg-violet-500/10"
          : "border-white/15 bg-slate-950 hover:border-violet-400/50 hover:bg-white/[0.03]",
        fileName ? "border-solid" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />

      {fileName ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20">
            <FileImage className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white">{fileName}</p>
          <p className="mt-1 text-xs text-slate-500">
            Click to choose a different image
          </p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white">
            Click to choose image
          </p>
          <p className="mt-1 text-xs text-slate-500">
            or drag &amp; drop here
          </p>
        </>
      )}

      <p className="mt-4 text-xs text-slate-500">Allowed: {allowedLabel}</p>
    </div>
  );
}

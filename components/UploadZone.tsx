"use client";

import { useRef, useState } from "react";
import { FileImage, Upload } from "lucide-react";

type UploadZoneProps = {
  onFile: (file: File) => void;
  accept?: string;
  allowedLabel?: string;
  fileName: string | null;
};

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
        "apple-glass flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200",
        isDragging
          ? "border-sky-400 bg-sky-500/15 scale-[1.01]"
          : "border-white/15 light:border-slate-900/15 hover:border-sky-400/50 hover:bg-white/[0.06]",
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10">
            <FileImage className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white light:text-slate-900">{fileName}</p>
          <p className="mt-1 text-xs text-slate-500">
            Click to choose a different image
          </p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/20 shadow-md shadow-sky-500/10">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white light:text-slate-900">
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

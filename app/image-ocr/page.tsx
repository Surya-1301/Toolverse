import { FileText, ScanText } from "lucide-react";
import { Container } from "@/components/Container";

export default function ImageOcrPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
          <ScanText className="h-8 w-8" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Image OCR
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-400">
          Upload an image and extract text from it. This page is prepared for a
          future OCR backend or browser-based OCR model.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-200">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-amber-100">
              OCR backend integration required
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              This page is ready for the Image OCR tool, but text extraction
              still needs an OCR engine. You can connect this to the same backend
              used for PDF OCR later.
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-100/80">
              <li>Use a Python backend with Tesseract OCR</li>
              <li>Use an external OCR API</li>
              <li>Use a browser-based WASM OCR library</li>
              <li>Return extracted text for copy/download</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-white">
          Suggested implementation
        </h2>

        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-400">
          <p>
            Add a backend route such as:
          </p>

          <pre className="overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs text-slate-300">
            <code>{`POST /api/image/ocr`}</code>
          </pre>

          <p>
            The frontend can upload an image to this endpoint, the backend can
            extract text, and the response can be shown in a text area with copy
            and download buttons.
          </p>
        </div>
      </div>
    </Container>
  );
}
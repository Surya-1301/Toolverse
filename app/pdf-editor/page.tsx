import type { Metadata } from "next";
import { ExternalRedirect } from "@/components/ExternalRedirect";

const PDFVERSE_URL = "https://pdfverse.pages.dev/";

export const metadata: Metadata = {
  title: "PDF Editor - Edit PDFs Online Free",
  description:
    "The PDF editor has moved to PDFVerse — merge, split, extract, remove, scan, edit, convert, compress, and secure PDFs in one place.",
  openGraph: {
    title: "PDF Editor - Edit PDFs Online Free",
    description:
      "The PDF editor has moved to PDFVerse — merge, split, extract, remove, scan, edit, convert, compress, and secure PDFs in one place.",
  },
  alternates: {
    canonical: PDFVERSE_URL,
  },
};

export default function PdfEditorRedirectPage() {
  return (
    <ExternalRedirect
      url={PDFVERSE_URL}
      title="PDF Editor has moved"
      description="The Toolverse PDF editor now lives on PDFVerse. You are being redirected automatically."
    />
  );
}

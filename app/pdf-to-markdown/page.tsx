import type { Metadata } from "next";
import { ExternalRedirect } from "@/components/ExternalRedirect";

const PDFVERSE_URL = "https://pdfverse.pages.dev/";

export const metadata: Metadata = {
  title: "PDF to Markdown Converter - Convert PDF Online",
  description:
    "The PDF to Markdown converter has moved to PDFVerse — convert PDF files to clean Markdown with tables, lists, and code blocks preserved.",
  openGraph: {
    title: "PDF to Markdown Converter - Convert PDF Online",
    description:
      "The PDF to Markdown converter has moved to PDFVerse — convert PDF files to clean Markdown with tables, lists, and code blocks preserved.",
  },
  alternates: {
    canonical: PDFVERSE_URL,
  },
};

export default function PdfToMarkdownRedirectPage() {
  return (
    <ExternalRedirect
      url={PDFVERSE_URL}
      title="PDF to Markdown has moved"
      description="The Toolverse PDF to Markdown converter now lives on PDFVerse. You are being redirected automatically."
    />
  );
}
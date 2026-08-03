import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Merge PDF Online Free | ToolverseX",
  description:
    "Merge multiple PDF files into one PDF online for free with ToolverseX.",
};

export default function MergePdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Merge PDF Online
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          Combine multiple PDFs into a single document. Upload your PDF files,
          arrange them, and download one merged PDF.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=merge"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Merge PDFs Now
          </Link>
        </div>
      </div>
    </Container>
  );
}
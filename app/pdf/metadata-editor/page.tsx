import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Edit PDF Metadata Online Free | ToolverseX",
  description:
    "Edit or remove PDF metadata including title, author, subject, keywords, creator, and producer.",
};

export default function MetadataEditorPdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Edit PDF Metadata
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          View, edit, or remove hidden PDF metadata such as title, author,
          subject, keywords, creator, and producer.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=metadata-editor"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Edit PDF Metadata
          </Link>
        </div>
      </div>
    </Container>
  );
}
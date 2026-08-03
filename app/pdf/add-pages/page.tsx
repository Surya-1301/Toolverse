import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Add Pages to PDF Online Free | ToolverseX",
  description:
    "Insert pages from another PDF into an existing PDF online for free with ToolverseX.",
};

export default function AddPagesPdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Add Pages to PDF Online
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          Insert pages from one PDF into another PDF. Upload your main PDF,
          choose another PDF to insert, pick the position, and download the
          updated document.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=add-pages"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Add Pages to PDF
          </Link>
        </div>
      </div>
    </Container>
  );
}

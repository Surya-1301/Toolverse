import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Add Header and Footer to PDF Online | Toolverse",
  description:
    "Add headers, footers, page numbers, dates, and filenames to PDF files online.",
};

export default function HeaderFooterPdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Add Header & Footer to PDF
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          Add custom headers, footers, page numbers, dates, and filenames to
          every page of your PDF document.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=header-footer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Add Header & Footer
          </Link>
        </div>
      </div>
    </Container>
  );
}
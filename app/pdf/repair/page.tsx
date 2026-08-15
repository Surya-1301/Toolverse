import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Repair PDF Online Free | Toolverse",
  description:
    "Repair damaged or corrupted PDF files online with Toolverse.",
};

export default function RepairPdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Repair PDF Online
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          Try to rebuild damaged or corrupted PDF files. Upload your PDF and
          download a repaired version when recovery is possible.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=repair-pdf"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Repair PDF Now
          </Link>
        </div>
      </div>
    </Container>
  );
}
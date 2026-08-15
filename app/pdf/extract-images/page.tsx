import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Extract Images from PDF Online | Toolverse",
  description:
    "Extract embedded images from PDF files and download them as a ZIP file.",
};

export default function ExtractImagesPdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Extract Images from PDF
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          Extract embedded images from PDF files and download all images in a
          ZIP file.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=extract-images"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Extract Images Now
          </Link>
        </div>
      </div>
    </Container>
  );
}
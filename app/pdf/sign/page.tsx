import Link from "next/link";
import { Container } from "../../../components/Container";

export const metadata = {
  title: "Sign PDF Online Free | ToolverseX",
  description:
    "Sign PDF files online using typed signatures, uploaded signature images, or drawn signatures.",
};

export default function SignPdfPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-300">
          Free PDF Tool
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Sign PDF Online
        </h1>

        <p className="mt-5 text-base leading-8 text-slate-400">
          Add a signature to your PDF using typed text, an uploaded signature
          image, or a drawn signature. Download your signed PDF instantly.
        </p>

        <div className="mt-8">
          <Link
            href="/pdf-editor?tool=sign-pdf"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Sign PDF Now
          </Link>
        </div>
      </div>
    </Container>
  );
}
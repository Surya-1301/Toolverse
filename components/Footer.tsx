import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/50">
      <Container className="flex flex-col gap-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-300">
            © {new Date().getFullYear()} ToolverseX
          </p>
          <p className="mt-1 text-xs">
            Fast, free, privacy-friendly online tools.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <Link href="/report-abuse" className="hover:text-white">
          Report abuse
           </Link>
        </div>
      </Container>
    </footer>
  );
}
import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Read the Toolverse Terms of Use for using our free online tools.",
};

export default function TermsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
          Legal
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Terms of Use
        </h1>

        <p className="mt-4 text-slate-400">
          Last updated: July 31, 2026
        </p>

        <div className="mt-10 space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Acceptance of terms
            </h2>
            <p className="mt-3 leading-7">
              By using Toolverse, you agree to these Terms of Use. If you do not
              agree, please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Use of tools
            </h2>
            <p className="mt-3 leading-7">
              Toolverse provides free online utilities for personal, educational,
              and professional use. You are responsible for the content you enter
              into or generate with these tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Prohibited use
            </h2>
            <p className="mt-3 leading-7">
              You may not use Toolverse to upload, share, create, or distribute
              illegal, harmful, abusive, infringing, or malicious content. You
              may not attempt to disrupt the service, abuse storage features, or
              bypass security limits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. No warranty
            </h2>
            <p className="mt-3 leading-7">
              Toolverse is provided “as is” without warranties of any kind. We do
              not guarantee that every tool will always be available, error-free,
              or suitable for every purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Future hosted features
            </h2>
            <p className="mt-3 leading-7">
              Features such as paste sharing, image hosting, file sharing, and
              URL shortening may store user-submitted content. Additional limits,
              abuse prevention, expiration rules, and removal processes may apply
              to those features when launched.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              6. Contact
            </h2>
            <p className="mt-3 leading-7">
              For questions about these Terms, contact{" "}
              <a
                href="mailto:support@toolverse.dev"
                className="text-violet-300 hover:text-violet-200"
              >
                support@toolverse.dev
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
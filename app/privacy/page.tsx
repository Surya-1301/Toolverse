import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the Toolverse Privacy Policy and learn how our browser-first tools handle your data.",
};

export default function PrivacyPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
          Legal
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>

        <p className="mt-4 text-slate-400">
          Last updated: July 31, 2026
        </p>

        <div className="mt-10 space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              1. Overview
            </h2>
            <p className="mt-3 leading-7">
              Toolverse provides simple online tools for formatting, generating,
              compressing, and converting content. We aim to keep our tools fast,
              useful, and privacy-friendly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              2. Browser-first tools
            </h2>
            <p className="mt-3 leading-7">
              Some Toolverse tools run directly in your browser. For example,
              JSON formatting, QR generation, and image compression can work
              locally on your device. When a tool runs locally, your input is not
              uploaded to our servers for that processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              3. Information you provide
            </h2>
            <p className="mt-3 leading-7">
              If you use future features such as paste sharing, image hosting,
              file sharing, or URL shortening, the content you submit may need to
              be stored so the service can work. These features will clearly
              explain when content is stored or shared.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              4. Analytics and logs
            </h2>
            <p className="mt-3 leading-7">
              We may use basic analytics or server logs to understand site
              performance, fix errors, prevent abuse, and improve Toolverse.
              These logs may include technical information such as browser type,
              device type, referring page, approximate location, and pages
              visited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              5. Cookies
            </h2>
            <p className="mt-3 leading-7">
              Toolverse may use essential cookies or local storage for preferences
              and basic functionality. If analytics or advertising cookies are
              added in the future, this policy should be updated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              6. Contact
            </h2>
            <p className="mt-3 leading-7">
              If you have questions about this Privacy Policy, contact us at{" "}
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
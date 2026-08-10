"use client";

import { AlertTriangle, Mail } from "lucide-react";

const SUPPORT_EMAIL = "support.toolversee@gmail.com";

const reportTypes = [
  "Phishing or scams",
  "Malware or harmful files",
  "Illegal or harmful content",
  "Private information",
  "Copyright or ownership",
  "Impersonation or deception",
];

export default function ReportAbuseForm() {
  const handleSubmit = () => {
    const emailInput = document.getElementById(
      "reporter-email"
    ) as HTMLInputElement | null;

    const typeInput = document.getElementById(
      "report-type"
    ) as HTMLSelectElement | null;

    const urlInput = document.getElementById(
      "reported-url"
    ) as HTMLInputElement | null;

    const subjectInput = document.getElementById(
      "report-subject"
    ) as HTMLInputElement | null;

    const descriptionInput = document.getElementById(
      "report-description"
    ) as HTMLTextAreaElement | null;

    const evidenceInput = document.getElementById(
      "report-evidence"
    ) as HTMLTextAreaElement | null;

    const email = emailInput?.value.trim() || "";
    const reportType = typeInput?.value.trim() || "";
    const reportedUrl = urlInput?.value.trim() || "";
    const subject = subjectInput?.value.trim() || "";
    const description = descriptionInput?.value.trim() || "";
    const evidence = evidenceInput?.value.trim() || "";

    // ------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------

    if (!email) {
      alert("Please enter your email address.");
      emailInput?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      emailInput?.focus();
      return;
    }

    if (!reportType) {
      alert("Please select a report type.");
      typeInput?.focus();
      return;
    }

    if (!reportedUrl) {
      alert("Please provide the Toolverse URL or content ID.");
      urlInput?.focus();
      return;
    }

    if (!subject) {
      alert("Please enter a subject.");
      subjectInput?.focus();
      return;
    }

    if (!description) {
      alert("Please explain the reason for the report.");
      descriptionInput?.focus();
      return;
    }

    // ------------------------------------------------------------
    // Email content
    // ------------------------------------------------------------

    const body = `
Toolverse Abuse Report
======================

REPORTER INFORMATION
--------------------
Email: ${email}

REPORT TYPE
-----------
${reportType}

REPORTED TOOLVERSE RESOURCE
---------------------------
${reportedUrl}

SUBJECT
-------
${subject}

REASON FOR REPORT
-----------------
${description}

SUPPORTING CONTEXT
------------------
${evidence || "No additional supporting context provided."}

IMPORTANT
---------
This report was submitted through the Toolverse Report Abuse page.

The information above has been provided by the reporter for the
purpose of reviewing a potentially harmful, unsafe, illegal,
deceptive, abusive, or policy-violating resource.

Please review the reported resource and take appropriate action
where necessary.
`.trim();

    // ------------------------------------------------------------
    // Open user's email application
    // ------------------------------------------------------------

    const mailto =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(
        `Toolverse Abuse Report - ${subject}`
      )}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  };

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      
      {/* Header */}

      <div className="mb-6 flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-red-300 ring-1 ring-white/10">
          <Mail className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Prepare your report
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Enter the details below and your email application will open
            with the report prepared.
          </p>
        </div>

      </div>

      {/* Form */}

      <div className="grid gap-5 md:grid-cols-2">

        {/* Email */}

        <div>
          <label
            htmlFor="reporter-email"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Your email address
          </label>

          <input
            id="reporter-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/40 focus:ring-2 focus:ring-red-400/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            We may use this address if additional information is required.
          </p>
        </div>

        {/* Report Type */}

        <div>
          <label
            htmlFor="report-type"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Report type
          </label>

          <select
            id="report-type"
            defaultValue=""
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/40 focus:ring-2 focus:ring-red-400/10"
          >
            <option value="" disabled>
              Select report type
            </option>

            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* URL */}

        <div className="md:col-span-2">
          <label
            htmlFor="reported-url"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Toolverse URL or content ID
          </label>

          <input
            id="reported-url"
            type="url"
            placeholder="https://toolverse.example/..."
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/40 focus:ring-2 focus:ring-red-400/10"
          />

          <p className="mt-2 text-xs text-slate-500">
            Provide the exact page, file, image, paste, upload, or other
            Toolverse resource involved.
          </p>
        </div>

        {/* Subject */}

        <div className="md:col-span-2">
          <label
            htmlFor="report-subject"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Subject
          </label>

          <input
            id="report-subject"
            type="text"
            placeholder="Briefly describe the issue"
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/40 focus:ring-2 focus:ring-red-400/10"
          />
        </div>

        {/* Reason */}

        <div className="md:col-span-2">
          <label
            htmlFor="report-description"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Reason for the report
          </label>

          <textarea
            id="report-description"
            rows={7}
            placeholder="Explain what is wrong, why you believe it is harmful or abusive, and whether immediate action is needed."
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/40 focus:ring-2 focus:ring-red-400/10"
          />
        </div>

        {/* Supporting Context */}

        <div className="md:col-span-2">
          <label
            htmlFor="report-evidence"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Supporting context

            <span className="ml-2 text-xs font-normal text-slate-500">
              Optional
            </span>
          </label>

          <textarea
            id="report-evidence"
            rows={5}
            placeholder="Add screenshots, ownership details, timestamps, legal context, identifiers, or other useful evidence."
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/40 focus:ring-2 focus:ring-red-400/10"
          />
        </div>

      </div>

      {/* Security notice */}

      <div className="mt-6 rounded-2xl border border-amber-400/10 bg-amber-500/[0.04] p-4">

        <div className="flex items-start gap-3">

          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

          <div>
            <p className="text-sm font-semibold text-white">
              Do not include sensitive credentials
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Never include passwords, authentication codes, private keys,
              payment information, or other credentials in your report.
            </p>
          </div>

        </div>

      </div>

      {/* Submit */}

      <div className="mt-6">

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5 hover:bg-red-400 hover:shadow-red-500/30 sm:w-auto"
        >
          <Mail className="h-4 w-4" />
          Email abuse report
        </button>

      </div>
    </section>
  );
}
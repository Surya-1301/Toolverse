type HowToUseStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

type HowToUseProps = {
  title?: string;
  subtitle?: string;
  steps: HowToUseStep[];
};

export function HowToUse({
  title = "How to use",
  subtitle = "Follow these simple steps to use this tool.",
  steps,
}: HowToUseProps) {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description: subtitle,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.description,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    <section className="mx-auto mt-16 max-w-6xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl light:text-slate-900">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base light:text-slate-600">
          {subtitle}
        </p>
      </div>

      {/* Desktop: responsive grid */}
      <div className="mt-8 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/50 hover:bg-white/[0.05] light:border-slate-900/10 light:bg-white light:hover:bg-slate-100"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>

            <h3 className="text-sm font-semibold text-white light:text-slate-900">
              {step.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-600">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: stacked horizontal cards with desktop-matching styles */}
      <div className="mt-8 grid gap-4 sm:hidden">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/50 hover:bg-white/[0.05] light:border-slate-900/10 light:bg-white light:hover:bg-slate-100"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white light:text-slate-900">
                {step.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400 light:text-slate-600">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
    </>
  );
}
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
  return (
    <section className="mx-auto mt-16 max-w-6xl">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
          {subtitle}
        </p>
      </div>

      {/* Desktop: responsive grid */}
      <div className="mt-8 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/50 hover:bg-white/[0.05]"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              {step.icon}
            </div>

            <h3 className="text-sm font-semibold text-white">
              {step.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: stacked cyan cards (matches per-tool sections) */}
      <div className="mt-6 grid gap-3 sm:hidden">
        {steps.map((step) => (
          <div
            key={step.title}
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-[#071522] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-[#092B40] text-[#63E5F7] shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold leading-5 text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-400">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
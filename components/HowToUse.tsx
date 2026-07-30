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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
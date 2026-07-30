type PageHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({
  icon,
  title,
  description,
  badge = "Runs in your browser",
}: PageHeaderProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300 ring-1 ring-violet-400/20">
        {icon}
      </div>

      <div className="mb-4 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
        {badge}
      </div>

      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h1>

      <p className="mt-4 text-base leading-7 text-slate-400">{description}</p>
    </div>
  );
}
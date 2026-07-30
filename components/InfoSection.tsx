type FaqItem = {
  question: string;
  answer: string;
};

type InfoSectionProps = {
  howTo: string[];
  faq: FaqItem[];
};

export function InfoSection({ howTo, faq }: InfoSectionProps) {
  return (
    <>
      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">How to use</h2>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-400">
          {howTo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">FAQ</h2>

        <div className="mt-4 space-y-4">
          {faq.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
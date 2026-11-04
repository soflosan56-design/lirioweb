import { Check, Sparkles, Star } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';

const PLAN_STYLES = [
  { tilt: '-rotate-1', tint: 'bg-paper-50', highlighted: false },
  { tilt: 'rotate-1', tint: 'bg-pink-500', highlighted: true },
  { tilt: '-rotate-2', tint: 'bg-yellow-400', highlighted: false },
];

type SubscriptionsPageProps = {
  content: SiteSettings['subscriptions'];
};

export default function SubscriptionsPage({ content }: SubscriptionsPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
      <header className="relative mb-14 max-w-3xl">
        <span className="sticker-label -rotate-2 bg-yellow-400 text-ink-900">
          <Sparkles className="mr-1 inline h-4 w-4" /> Suscripciones
        </span>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">{content.title}</h1>
        <p className="mt-6 text-lg text-ink-800">{content.intro}</p>
        <p className="mt-4 font-hand text-xl text-pink-700">{content.note}</p>
      </header>

      <div className="grid gap-10 md:grid-cols-3 md:gap-8">
        {content.plans.map((plan, index) => {
          const style = PLAN_STYLES[index] ?? PLAN_STYLES[0];
          return (
            <article
              key={`${plan.name}-${index}`}
              className={`relative flex flex-col border-4 border-ink-900 p-6 shadow-hard transition-transform duration-200 hover:-translate-y-1 ${style.tint} ${style.tilt}`}
            >
              {style.highlighted && (
                <span className="tape -top-3 left-1/2 w-24 -translate-x-1/2 rotate-2" />
              )}
              {style.highlighted && (
                <span className="absolute -right-3 -top-4 flex -rotate-12 items-center gap-1 border-2 border-ink-900 bg-ink-900 px-2 py-1 font-display text-sm uppercase text-yellow-400">
                  <Star className="h-3 w-3" /> Popular
                </span>
              )}
              <h2 className="font-display text-4xl uppercase">{plan.name}</h2>
              <p className="mt-1 font-hand text-lg text-ink-800">{plan.tagline}</p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl">{plan.price}</span>
                <span className="text-sm font-bold uppercase text-ink-700">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={`${feature}-${featureIndex}`} className="flex items-start gap-2 text-base text-ink-900">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className="scrap-button mt-8 w-full cursor-not-allowed bg-paper-50 px-5 py-3 text-lg text-ink-500 opacity-80"
              >
                Próximamente
              </button>
            </article>
          );
        })}
      </div>

      <section className="mt-16 grid gap-6 border-t-4 border-ink-900 pt-10 md:grid-cols-2">
        {content.faq.map((item, index) => (
          <div key={`${item.question}-${index}`} className="border-2 border-ink-900 bg-white p-5 shadow-hard-sm">
            <h3 className="font-display text-2xl uppercase">{item.question}</h3>
            <p className="mt-2 text-ink-800">{item.answer}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

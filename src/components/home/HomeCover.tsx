import { ArrowRight, CornerDownRight, Repeat, Newspaper, Store } from 'lucide-react';
import HomeBlocks from '@/components/home/HomeBlocks';
import type { DestinationId, Section, SiteSettings } from '@/lib/types';

const DESTINATION_META: {
  id: DestinationId;
  title: string;
  icon: typeof Repeat;
  tint: string;
  rotate: string;
}[] = [
  { id: 'swap', title: 'Swap', icon: Repeat, tint: 'bg-yellow-400', rotate: '-rotate-2' },
  { id: 'showroom', title: 'Showroom', icon: Store, tint: 'bg-pink-500', rotate: 'rotate-1' },
  { id: 'contenidos', title: 'Contenidos', icon: Newspaper, tint: 'bg-pink-300', rotate: '-rotate-1' },
];

type HomeCoverProps = {
  content: SiteSettings['home'];
  onNavigate: (section: Section) => void;
};

export default function HomeCover({ content, onNavigate }: HomeCoverProps) {
  return (
    <div className="pb-16">
      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:pt-12">
        <div className="relative z-10 flex flex-col justify-center lg:col-span-7">
          <h1 className="mt-4 font-display text-[clamp(5rem,20vw,13rem)] uppercase leading-[0.85] tracking-tight text-ink-900">
            <span className="block [text-shadow:4px_4px_0_rgb(var(--c-primary))]">Lirio</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-800 sm:text-xl">{content.intro}</p>
          <p className="mt-6 flex items-start gap-2 font-hand text-xl text-pink-700">
            <CornerDownRight className="mt-1 h-6 w-6 shrink-0" />
            ¡Empieza por lo que te pida el cuerpo!
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => onNavigate('contenidos')}
              className="scrap-button bg-pink-500 px-6 py-3 text-xl text-ink-900 hover:bg-pink-300"
            >
              Ver contenidos
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('swap')}
              className="scrap-button bg-paper-50 px-6 py-3 text-xl text-ink-900 hover:bg-yellow-300"
            >
              Hacer swap
            </button>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative mx-auto w-full max-w-md rotate-3 transition-transform duration-500 hover:rotate-1">
            <div className="torn-edges bg-ink-900 p-2 shadow-hard-pink">
              <img
                src={content.coverImageUrl}
                alt="Portada de Lirio"
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
            <span className="tape -left-6 -top-3 -rotate-12" />
            <span className="tape -right-8 bottom-10 rotate-6" />
            <div className="absolute -bottom-6 -left-6 hidden w-36 -rotate-6 border-4 border-ink-900 bg-paper-50 p-2 shadow-hard sm:block">
              <img
                src={content.polaroidImageUrl}
                alt="Foto destacada de la edición"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <p className="mt-1 text-center font-hand text-sm text-ink-900">rojo, lazo, drama</p>
            </div>
          </div>
          <div className="absolute -right-2 top-4 flex h-28 w-28 -rotate-12 items-center justify-center rounded-full border-4 border-ink-900 bg-yellow-400 text-center shadow-hard sm:-right-6 animate-wiggle">
            <span className="font-display text-xl uppercase leading-none text-ink-900">
              Contenido
              <br />
              nuevo
              <br />
              cada semana
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink-900 pb-3">
          <h2 className="font-display text-4xl uppercase tracking-wide sm:text-5xl">Dentro de la edición</h2>
          <p className="font-hand text-lg text-pink-700">tres formas de entrar</p>
        </div>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {DESTINATION_META.map((item) => {
            const Icon = item.icon;
            const destination = content.destinations[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`group relative block bg-paper-50 p-4 text-left border-2 border-ink-900 shadow-hard transition-all duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#0B0B0B] ${item.rotate}`}
              >
                <span className="tape -top-3 left-1/2 w-20 -translate-x-1/2 rotate-3" />
                <img
                  src={destination.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 border-2 border-ink-900 px-3 py-1 font-display text-2xl uppercase ${item.tint}`}>
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </span>
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-3 text-base text-ink-800">{destination.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      <HomeBlocks blocks={content.blocks} />
    </div>
  );
}

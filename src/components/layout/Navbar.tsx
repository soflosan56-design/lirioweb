import { Scissors, ShieldCheck, ShoppingBag, User } from 'lucide-react';
import type { Section } from '@/lib/types';

const LINKS: { id: Section; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'swap', label: 'Swap' },
  { id: 'showroom', label: 'Showroom' },
  { id: 'armarios', label: 'Armarios' },
  { id: 'contenidos', label: 'Contenidos' },
  { id: 'suscripciones', label: 'Suscripciones' },
  { id: 'contacto', label: 'Contacto' },
];

type NavbarProps = {
  section: Section;
  onNavigate: (section: Section) => void;
  cartCount: number;
  profileName: string | null;
  logoUrl: string;
  isAdmin: boolean;
  onOpenCart: () => void;
  onOpenProfile: () => void;
};

export default function Navbar({
  section,
  onNavigate,
  cartCount,
  profileName,
  logoUrl,
  isAdmin,
  onOpenCart,
  onOpenProfile,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-ink-900 bg-paper-50/95 backdrop-blur">
      <div className="overflow-hidden border-b-2 border-ink-900 bg-ink-900 py-1.5 text-neon-500">
        <div className="flex w-max animate-marquee whitespace-nowrap font-display text-sm uppercase tracking-[0.2em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="pr-8">
              Swap abierto · Showroom de diseñadores independientes · Contenido nuevo cada semana ·
              Denim reparado a mano ·
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('inicio')}
          className="group flex items-center gap-3"
          aria-label="Ir al inicio"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-11 w-auto max-w-[9rem] -rotate-3 border-2 border-ink-900 bg-white object-contain shadow-hard-sm transition-transform group-hover:rotate-2"
            />
          ) : (
            <span className="flex h-11 w-11 -rotate-6 items-center justify-center border-2 border-ink-900 bg-pink-500 shadow-hard-sm transition-transform group-hover:rotate-3">
              <Scissors className="h-5 w-5 text-ink-900" />
            </span>
          )}
          <span className="flex flex-col text-left leading-none">
            <span className="font-display text-3xl tracking-wide">LIRIO</span>
            <span className="font-hand text-xs text-pink-700">fanzine de moda</span>
          </span>
        </button>

        <nav aria-label="Principal" className="order-3 -mx-4 w-full overflow-x-auto px-4 sm:order-none sm:mx-0 sm:w-auto sm:overflow-visible sm:px-0">
          <ul className="flex items-center gap-2 whitespace-nowrap">
            {LINKS.map((link) => {
              const active = link.id === section;
              return (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`border-2 px-3 py-1.5 font-display text-lg uppercase tracking-wide transition-all duration-150 ${
                      active
                        ? '-rotate-2 border-ink-900 bg-pink-500 text-ink-900 shadow-hard-sm'
                        : 'border-transparent text-ink-900 hover:border-ink-900 hover:bg-neon-300'
                    }`}
                  >
                    {link.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              aria-current={section === 'admin' ? 'page' : undefined}
              className={`scrap-button px-3 py-2 text-base text-ink-900 ${
                section === 'admin' ? 'bg-pink-500' : 'bg-yellow-300 hover:bg-yellow-500'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenProfile}
            className="scrap-button bg-paper-50 px-3 py-2 text-base text-ink-900 hover:bg-neon-300"
            aria-label={profileName ? 'Abrir perfil' : 'Iniciar sesión'}
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{profileName ?? 'Entrar'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="scrap-button relative bg-neon-500 px-3 py-2 text-base text-ink-900 hover:bg-neon-300"
            aria-label={`Abrir carrito, ${cartCount} artículos`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 min-w-[1.5rem] items-center justify-center border-2 border-ink-900 bg-pink-500 px-1 font-display text-sm text-ink-900">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

import { Check, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ShareMenuProps = {
  title: string;
  url: string;
};

export default function ShareMenu({ title, url }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: 'Instagram', href: 'https://www.instagram.com/', hint: 'Copia el enlace y compártelo en tu historia o bio' },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* usuario canceló */
      }
    }
    setOpen((prev) => !prev);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={nativeShare}
        title="Compartir"
        className="scrap-button flex items-center gap-2 bg-neon-500 px-4 py-2 text-base text-ink-900 hover:bg-neon-300"
      >
        <Share2 className="h-4 w-4" />
        Compartir
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 border-2 border-ink-900 bg-paper-50 p-2 shadow-hard">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  title={link.hint}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 font-display text-sm uppercase tracking-wide text-ink-900 hover:bg-neon-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={copyLink}
                className="flex w-full items-center gap-2 px-2 py-1.5 font-display text-sm uppercase tracking-wide text-ink-900 hover:bg-neon-300"
              >
                {copied && <Check className="h-4 w-4 text-pink-700" />}
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

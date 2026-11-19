import { useState } from 'react';
import { Instagram, Loader2 } from 'lucide-react';

type InstagramStoryButtonProps = {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  url: string;
};

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function InstagramStoryButton({ title, subtitle, imageUrl, url }: InstagramStoryButtonProps) {
  const [busy, setBusy] = useState(false);

  async function shareToStory() {
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = STORY_WIDTH;
      canvas.height = STORY_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');

      // Fondo papel con marco rosa
      ctx.fillStyle = '#FFF0F7';
      ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
      ctx.fillStyle = '#C4006A';
      ctx.fillRect(0, 0, STORY_WIDTH, 24);
      ctx.fillRect(0, STORY_HEIGHT - 24, STORY_WIDTH, 24);

      // Foto del artículo
      let photoBottom = 340;
      if (imageUrl) {
        try {
          const img = await loadImage(imageUrl);
          const boxW = STORY_WIDTH - 120;
          const boxH = 900;
          const scale = Math.max(boxW / img.width, boxH / img.height);
          const cropW = boxW / scale;
          const cropH = boxH / scale;
          ctx.save();
          ctx.translate(60, 300);
          ctx.rotate(-0.015);
          ctx.fillStyle = '#1A1A1A';
          ctx.fillRect(-10, -10, boxW + 20, boxH + 20);
          ctx.drawImage(img, (img.width - cropW) / 2, (img.height - cropH) / 2, cropW, cropH, 0, 0, boxW, boxH);
          ctx.restore();
          photoBottom = 300 + boxH + 60;
        } catch {
          photoBottom = 340;
        }
      }

      // Titular
      ctx.fillStyle = '#1A1A1A';
      let titleSize = 96;
      ctx.textAlign = 'left';
      let lines: string[] = [];
      do {
        ctx.font = `900 ${titleSize}px var(--font-display, sans-serif)`;
        lines = wrapText(ctx, title.toUpperCase(), STORY_WIDTH - 160);
        if (lines.length > 5) titleSize -= 10;
      } while (lines.length > 5 && titleSize > 56);
      let y = photoBottom + titleSize;
      for (const line of lines.slice(0, 5)) {
        ctx.fillText(line, 80, y);
        y += titleSize * 1.05;
      }

      // Subtítulo
      if (subtitle) {
        ctx.fillStyle = '#C4006A';
        ctx.font = `500 48px var(--font-hand, cursive)`;
        const subLines = wrapText(ctx, subtitle, STORY_WIDTH - 160).slice(0, 2);
        for (const line of subLines) {
          ctx.fillText(line, 80, y + 10);
          y += 56;
        }
      }

      // Enlace
      ctx.fillStyle = '#6B0038';
      ctx.font = `700 36px var(--font-body, sans-serif)`;
      ctx.fillText('Lee el artículo completo en LIRIO', 80, STORY_HEIGHT - 140);
      ctx.fillStyle = '#1A1A1A';
      ctx.font = `500 32px var(--font-body, sans-serif)`;
      ctx.fillText(url.replace(/^https?:\/\//, '').slice(0, 60), 80, STORY_HEIGHT - 90);

      // A portapapeles
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      window.open('https://www.instagram.com/', '_blank');
      window.alert(
        'Imagen de la historia copiada. Abre Instagram, crea una historia nueva y pega la imagen (mantén pulsado y pega, o toca "Pegar" si aparece).'
      );
    } catch {
      window.alert(
        'No se pudo copiar la imagen automáticamente. Tu navegador o dispositivo puede bloquearlo: haz una captura de pantalla del artículo y compártela en tu historia.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={shareToStory}
      disabled={busy}
      title="Publicar en la historia de Instagram"
      className="scrap-button flex items-center gap-2 bg-pink-500 px-4 py-2 text-base text-ink-900 hover:bg-pink-300 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
      Historia
    </button>
  );
}

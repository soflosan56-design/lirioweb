export function contentShareUrl(slug: string): string {
  return `${window.location.origin}${window.location.pathname}#/contenido/${encodeURIComponent(slug)}`;
}

export function parseContentHash(hash: string): string | null {
  const match = /^#\/contenido\/(.+)$/.exec(hash);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

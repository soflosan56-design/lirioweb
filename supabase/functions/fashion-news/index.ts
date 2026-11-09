const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const NEWS_LIMIT = 6;

type RawArticle = {
  uuid?: unknown;
  title?: unknown;
  publisher?: unknown;
  published_at?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FREENEWSAPI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "Las noticias todavía no están configuradas." }, 503);
    }

    const url = new URL("https://api.freenewsapi.io/v1/news");
    url.searchParams.set("q", "fashion");
    url.searchParams.set("language", "en");
    url.searchParams.set("order_by", "archive");

    let newsRes: Response;
    try {
      newsRes = await fetch(url, {
        headers: { "x-api-key": apiKey },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return jsonResponse({ error: "Las noticias tardaron demasiado en cargar." }, 504);
    }

    if (!newsRes.ok) {
      return jsonResponse({ error: "No se pudieron cargar las noticias en este momento." }, 502);
    }

    const payload = (await newsRes.json().catch(() => null)) as { data?: unknown } | null;
    if (!payload || !Array.isArray(payload.data)) {
      return jsonResponse({ error: "Las noticias llegaron en un formato no válido." }, 502);
    }

    const articles = (payload.data as RawArticle[])
      .filter((entry) => typeof entry?.uuid === "string" && typeof entry?.title === "string")
      .slice(0, NEWS_LIMIT)
      .map((entry) => ({
        id: entry.uuid as string,
        title: (entry.title as string).slice(0, 200),
        publisher: typeof entry.publisher === "string" ? entry.publisher : null,
        publishedAt: typeof entry.published_at === "string" ? entry.published_at : null,
      }));

    return jsonResponse({ articles }, 200);
  } catch (_err) {
    return jsonResponse({ error: "Error inesperado al cargar las noticias." }, 500);
  }
});

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_QUERY_LENGTH = 200;
const MAX_RESULTS = 5;

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Tienes que iniciar sesión." }, 401);
    }

    const tavilyKey = Deno.env.get("TAVILY_API_KEY");
    if (!tavilyKey) {
      return jsonResponse({ error: "La búsqueda todavía no está configurada. Avisa a la administración." }, 503);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const db = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await db.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Tu sesión ha caducado. Vuelve a entrar." }, 401);
    }

    const body = await req.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim().slice(0, MAX_QUERY_LENGTH) : "";
    if (!query) {
      return jsonResponse({ error: "Escribe qué quieres buscar." }, 400);
    }

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${tavilyKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results: MAX_RESULTS, search_depth: "basic" }),
    });
    if (!tavilyRes.ok) {
      return jsonResponse({ error: "La búsqueda no pudo completarse en este momento." }, 502);
    }

    const payload = await tavilyRes.json().catch(() => null);
    const raw = Array.isArray(payload?.results) ? payload.results : [];
    const results = raw
      .filter((item: { title?: unknown; url?: unknown }) => typeof item?.title === "string" && typeof item?.url === "string")
      .map((item: { title: string; url: string; content?: unknown }) => ({
        title: item.title,
        url: item.url,
        snippet: typeof item.content === "string" ? item.content : "",
      }));

    return jsonResponse({ results }, 200);
  } catch (_err) {
    return jsonResponse({ error: "Error inesperado al buscar." }, 500);
  }
});

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_RECOMMENDATIONS = 5;
const MAX_WARDROBE_ITEMS = 60;
const MAX_SWAP_CANDIDATES = 40;
const MAX_REQUEST_LENGTH = 300;

type WardrobeRow = {
  id: string;
  name: string;
  image_url: string;
  brand: string | null;
  size: string | null;
  condition: string | null;
  material: string | null;
  description: string | null;
};

type SwapRow = {
  id: string;
  title: string;
  image_urls: string[];
  brand: string | null;
  size: string | null;
  condition: string | null;
  material: string | null;
  description: string | null;
};

type RawRecommendation = {
  title?: unknown;
  reason?: unknown;
  wardrobeItemIds?: unknown;
  swapListingIds?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function garmentSummary(row: WardrobeRow | SwapRow) {
  return {
    id: row.id,
    name: "name" in row ? row.name : row.title,
    brand: row.brand,
    size: row.size,
    condition: row.condition,
    material: row.material,
    description: row.description,
  };
}

function stringList(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && allowed.has(id)))];
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

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "El recomendador todavía no está configurado. Avisa a la administración." }, 503);
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
    const callerId = userData.user.id;

    const body = await req.json().catch(() => null);
    const request = typeof body?.request === "string" ? body.request.trim().slice(0, MAX_REQUEST_LENGTH) : "";

    const [profileRes, wardrobeRes, favoritesRes, candidatesRes, settingsRes] = await Promise.all([
      db.from("profiles").select("display_name, city, style").eq("id", callerId).maybeSingle(),
      db
        .from("wardrobe_items")
        .select("id, name, image_url, brand, size, condition, material, description")
        .eq("owner_id", callerId)
        .order("created_at", { ascending: false })
        .limit(MAX_WARDROBE_ITEMS),
      db
        .from("swap_favorites")
        .select("swap_listings(id, title, image_urls, brand, size, condition, material, description)")
        .eq("user_id", callerId)
        .limit(MAX_SWAP_CANDIDATES),
      db
        .from("swap_listings")
        .select("id, title, image_urls, brand, size, condition, material, description")
        .neq("owner_id", callerId)
        .order("created_at", { ascending: false })
        .limit(MAX_SWAP_CANDIDATES),
      db.from("ai_settings").select("model, instructions").eq("id", 1).maybeSingle(),
    ]);

    const loadError = [profileRes, wardrobeRes, favoritesRes, candidatesRes, settingsRes].find((res) => res.error);
    if (loadError) {
      return jsonResponse({ error: "No se pudieron cargar tus datos para la recomendación." }, 500);
    }

    const wardrobe = (wardrobeRes.data ?? []) as WardrobeRow[];
    const favorites = ((favoritesRes.data ?? []) as { swap_listings: SwapRow | null }[])
      .map((row) => row.swap_listings)
      .filter((row): row is SwapRow => row !== null);
    const candidates = (candidatesRes.data ?? []) as SwapRow[];
    const settings = settingsRes.data as { model: string; instructions: string } | null;
    const model = settings?.model ?? "gpt-4o-mini";
    const instructions = settings?.instructions ?? "";

    if (wardrobe.length === 0 && favorites.length === 0) {
      return jsonResponse({ error: "Añade prendas a tu armario o guarda favoritos de Swap para recibir recomendaciones." }, 400);
    }

    const wardrobeIds = new Set(wardrobe.map((item) => item.id));
    const swapIds = new Set(candidates.map((item) => item.id));
    const wardrobeById = new Map(wardrobe.map((item) => [item.id, item]));
    const swapById = new Map(candidates.map((item) => [item.id, item]));

    const context = {
      profile: profileRes.data ?? null,
      request: request || null,
      wardrobe: wardrobe.map(garmentSummary),
      favorites: favorites.map(garmentSummary),
      swapAvailable: candidates.map(garmentSummary),
    };

    const systemPrompt = [
      instructions,
      `Devuelve SOLO un objeto JSON con la clave "recommendations": una lista de hasta ${MAX_RECOMMENDATIONS} elementos.`,
      'Cada elemento tiene: "title" (texto corto), "reason" (una o dos frases en español sobre por qué encaja con el estilo del usuario), "wardrobeItemIds" (ids del armario que forman el conjunto) y "swapListingIds" (ids de Swap sugeridos).',
      "Usa solo ids que aparezcan en los datos. Si no hay una prenda adecuada, deja la lista vacía.",
    ].join("\n");

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(context) },
        ],
      }),
    });

    if (!openAiRes.ok) {
      return jsonResponse({ error: "El recomendador no pudo responder en este momento. Inténtalo de nuevo." }, 502);
    }

    const completion = await openAiRes.json().catch(() => null);
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return jsonResponse({ error: "El recomendador devolvió una respuesta vacía." }, 502);
    }

    let parsed: { recommendations?: unknown };
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ error: "El recomendador devolvió una respuesta no válida." }, 502);
    }

    const raw = Array.isArray(parsed.recommendations) ? (parsed.recommendations as RawRecommendation[]) : [];
    const recommendations = raw
      .filter((entry) => typeof entry?.title === "string" && typeof entry?.reason === "string")
      .slice(0, MAX_RECOMMENDATIONS)
      .map((entry) => {
        const wardrobeIdsForEntry = stringList(entry.wardrobeItemIds, wardrobeIds);
        const swapIdsForEntry = stringList(entry.swapListingIds, swapIds);
        return {
          title: (entry.title as string).slice(0, 120),
          reason: (entry.reason as string).slice(0, 600),
          wardrobeItems: wardrobeIdsForEntry.map((id) => {
            const item = wardrobeById.get(id)!;
            return { id: item.id, name: item.name, image_url: item.image_url };
          }),
          swapListings: swapIdsForEntry.map((id) => {
            const listing = swapById.get(id)!;
            return { id: listing.id, title: listing.title, image_url: listing.image_urls[0] ?? null };
          }),
        };
      });

    return jsonResponse({ recommendations }, 200);
  } catch (_err) {
    return jsonResponse({ error: "Error inesperado al preparar tus recomendaciones." }, 500);
  }
});

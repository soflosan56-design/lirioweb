import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 800;
const MAX_REPLY_LENGTH = 2000;

const SYSTEM_PROMPT = [
  "Eres el asistente de LIRIO, un fanzine de moda independiente con una comunidad de intercambio de ropa (Swap), un showroom de diseñadores independientes, armarios personales de los usuarios, contenidos (artículos, vídeos y podcast) y suscripciones.",
  "Ayudas a los usuarios con dudas sobre moda: combinar prendas, estilos, cuidado de tejidos, tallas, moda sostenible y tendencias.",
  "También respondes preguntas sobre cómo usar la web: el Swap para intercambiar o publicar prendas, el armario personal, el showroom, los contenidos y las suscripciones.",
  "Si la pregunta no tiene relación con la moda ni con la web, explica amablemente que solo puedes ayudar con esos temas.",
  "Responde siempre en español, con un tono cercano y claro, en respuestas breves (como mucho unos pocos párrafos cortos).",
  "No inventes precios, stock, fechas ni políticas concretas: si no lo sabes, indica que lo consulten en la sección de contacto.",
].join("\n");

type ChatMessage = { role: "user" | "assistant"; content: string };

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) return null;
  const messages: ChatMessage[] = [];
  for (const entry of value.slice(-MAX_MESSAGES)) {
    if (!entry || typeof entry !== "object") return null;
    const { role, content } = entry as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed) return null;
    messages.push({ role, content: trimmed });
  }
  return messages.length > 0 && messages[messages.length - 1].role === "user" ? messages : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Tienes que iniciar sesión para usar el chat." }, 401);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "El chat todavía no está configurado. Avisa a la administración." }, 503);
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
    const messages = parseMessages(body?.messages);
    if (!messages) {
      return jsonResponse({ error: "Escribe un mensaje para continuar." }, 400);
    }

    const { data: settings, error: settingsError } = await db
      .from("ai_settings")
      .select("model")
      .eq("id", 1)
      .maybeSingle();
    if (settingsError) {
      return jsonResponse({ error: "No se pudo preparar el chat. Inténtalo de nuevo." }, 500);
    }
    const model = (settings as { model: string } | null)?.model ?? "gemini-2.5-flash";

    let aiRes: Response;
    try {
      aiRes = await fetch(GEMINI_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch {
      return jsonResponse({ error: "El chat tardó demasiado en responder. Inténtalo de nuevo." }, 504);
    }

    if (!aiRes.ok) {
      return jsonResponse({ error: "El chat no pudo responder en este momento. Inténtalo de nuevo." }, 502);
    }

    const completion = await aiRes.json().catch(() => null);
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      return jsonResponse({ error: "El chat devolvió una respuesta vacía. Inténtalo de nuevo." }, 502);
    }

    return jsonResponse({ reply: content.trim().slice(0, MAX_REPLY_LENGTH) }, 200);
  } catch (_err) {
    return jsonResponse({ error: "Error inesperado en el chat." }, 500);
  }
});

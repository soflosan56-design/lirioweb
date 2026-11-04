import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Tu sesión ha caducado. Vuelve a entrar." }, 401);
    }
    const callerId = userData.user.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRow, error: adminError } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (adminError) {
      return jsonResponse({ error: "No se pudo comprobar tu acceso." }, 500);
    }
    if (!adminRow) {
      return jsonResponse({ error: "Solo la cuenta administradora puede eliminar perfiles." }, 403);
    }

    const body = await req.json().catch(() => null);
    const profileId = typeof body?.profileId === "string" ? body.profileId : "";
    if (!UUID_PATTERN.test(profileId)) {
      return jsonResponse({ error: "El perfil indicado no es válido." }, 400);
    }
    if (profileId === callerId) {
      return jsonResponse({ error: "No puedes eliminar tu propia cuenta de administración." }, 400);
    }

    const { data: targetAdmin, error: targetAdminError } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", profileId)
      .maybeSingle();
    if (targetAdminError) {
      return jsonResponse({ error: "No se pudo comprobar el perfil." }, 500);
    }
    if (targetAdmin) {
      return jsonResponse({ error: "No se puede eliminar una cuenta administradora." }, 400);
    }

    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", profileId);
    if (profileError) {
      return jsonResponse({ error: "No se pudo eliminar el perfil." }, 500);
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(profileId);
    if (authError) {
      return jsonResponse({ error: "El perfil se eliminó, pero no su cuenta de acceso." }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (_err) {
    return jsonResponse({ error: "Error inesperado al eliminar el perfil." }, 500);
  }
});

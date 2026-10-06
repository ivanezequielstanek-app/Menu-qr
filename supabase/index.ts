// Invita a un dueño por email y le da acceso a su local.
// Solo puede usarla un administrador de la plataforma.
// Deploy: supabase functions deploy invite-owner
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user }, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !user) return json({ error: "Sesión inválida, volvé a ingresar." }, 401);

    const { data: isAdmin } = await admin.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!isAdmin) return json({ error: "Solo el administrador puede invitar dueños." }, 403);

    const { email, restaurant_id, redirect_to } = await req.json();
    const clean = String(email ?? "").trim().toLowerCase();
    if (!clean || !restaurant_id) return json({ error: "Faltan el email o el local." }, 400);

    let userId: string | null = null;
    let invited = false;
    const { data: inv } = await admin.auth.admin.inviteUserByEmail(clean, { redirectTo: redirect_to });
    if (inv?.user) {
      userId = inv.user.id;
      invited = true;
    } else {
      // Ya tenía cuenta: lo buscamos
      for (let page = 1; !userId && page <= 50; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        userId = data.users.find((u) => u.email?.toLowerCase() === clean)?.id ?? null;
        if (data.users.length < 200) break;
      }
      if (!userId) return json({ error: "No se pudo enviar la invitación. Revisá el email." }, 400);
    }

    const { error: mErr } = await admin.from("restaurant_members")
      .upsert({ restaurant_id, user_id: userId, role: "owner" });
    if (mErr) throw mErr;

    return json({ ok: true, invited });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

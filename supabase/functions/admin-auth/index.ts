// Admin auth edge function — only callable by admin or super_admin
// Actions: createUser, deleteUser, updateUserPassword
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "super_admin" | "admin" | "operario";

interface RequestBody {
  action: "createUser" | "deleteUser" | "updateUserPassword";
  payload: Record<string, unknown>;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No autorizado" }, 401);

    // Verify the caller is a super_admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sesión inválida" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profErr || !profile || !["admin", "super_admin"].includes(profile.role)) {
      return json({ error: "Acceso denegado: solo admin o super_admin" }, 403);
    }

    const body = (await req.json()) as RequestBody;
    const { action, payload } = body;

    if (action === "createUser") {
      const { email, password, role, fullName } = payload as {
        email: string;
        password: string;
        role: Role;
        fullName?: string;
      };
      if (!email || !password || !role) return json({ error: "Datos incompletos" }, 400);
      if (!/^\d{6}$/.test(password)) {
        return json({ error: "El PIN debe tener exactamente 6 dígitos" }, 400);
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) {
        return json({ error: createErr?.message ?? "No se pudo crear el usuario" }, 400);
      }

      // Upsert profile with role (in case a trigger already created a default profile)
      const { error: upsertErr } = await admin
        .from("profiles")
        .upsert({ id: created.user.id, email, role, full_name: fullName ?? null }, { onConflict: "id" });
      if (upsertErr) {
        // Best effort rollback
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: upsertErr.message }, 400);
      }

      return json({ success: true, userId: created.user.id });
    }

    if (action === "deleteUser") {
      const { userId } = payload as { userId: string };
      if (!userId) return json({ error: "userId requerido" }, 400);
      if (userId === userData.user.id) {
        return json({ error: "No puedes eliminarte a ti mismo" }, 400);
      }

      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) return json({ error: delErr.message }, 400);

      // Cleanup profile (in case no FK cascade)
      await admin.from("profiles").delete().eq("id", userId);

      return json({ success: true });
    }

    if (action === "updateUserPassword") {
      const { userId, password } = payload as { userId: string; password: string };
      if (!userId || !password) return json({ error: "Datos incompletos" }, 400);
      if (!/^\d{6}$/.test(password)) {
        return json({ error: "El PIN debe tener exactamente 6 dígitos" }, 400);
      }

      const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
      if (updErr) return json({ error: updErr.message }, 400);

      return json({ success: true });
    }

    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno";
    return json({ error: msg }, 500);
  }
});

// Feitiva Clinic — adicionar pessoa à equipe da clínica
// ---------------------------------------------------------------------------
// POST { clinic_id, email, role }  (Authorization: Bearer <sessão do administrador>)
// - Só um administrador da própria clínica consegue usar.
// - Se o e-mail ainda não tem conta, cria a conta com uma senha provisória gerada
//   aqui e devolve essa senha UMA vez, para o administrador repassar à pessoa.
//   (Não depende de envio de e-mail.)
// - Se a conta já existe, apenas vincula à clínica.
// - A chave service_role fica só no ambiente da função, nunca no navegador.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

const url = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function temporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function findUserByEmail(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: caller, error: callerError } = await admin.auth.getUser(token);
    if (callerError || !caller?.user) return json({ error: "Faça login novamente." }, 401);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Dados inválidos." }, 400);
    }
    const clinicId = String(body.clinic_id || "");
    const email = String(body.email || "").trim().toLowerCase().slice(0, 160);
    const role = body.role === "admin" ? "admin" : "staff";
    if (!UUID_RE.test(clinicId)) return json({ error: "Clínica inválida." }, 400);
    if (!EMAIL_RE.test(email)) return json({ error: "Informe um e-mail válido." }, 422);

    const { data: me } = await admin
      .from("clinic_members").select("role")
      .eq("clinic_id", clinicId).eq("user_id", caller.user.id).maybeSingle();
    if (!me || me.role !== "admin") {
      return json({ error: "Somente administradores podem adicionar pessoas à equipe." }, 403);
    }

    let user = await findUserByEmail(email);
    let password: string | null = null;
    if (!user) {
      password = temporaryPassword();
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      user = data.user;
    }

    const { data: existing } = await admin
      .from("clinic_members").select("id")
      .eq("clinic_id", clinicId).eq("user_id", user!.id).maybeSingle();
    if (existing) return json({ error: "Esta pessoa já faz parte da equipe." }, 409);

    const { error: insertError } = await admin
      .from("clinic_members").insert({ clinic_id: clinicId, user_id: user!.id, role });
    if (insertError) throw insertError;

    return json({ ok: true, email, role, temporary_password: password }, 201);
  } catch (err) {
    console.error("team-add-member error:", err);
    return json({ error: "Não foi possível adicionar a pessoa agora. Tente novamente." }, 500);
  }
});

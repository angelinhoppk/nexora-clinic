// Feitiva Clinic — Edge Function pública de agendamento
// ---------------------------------------------------------------------------
// GET  ?clinic=<slug>  → dados públicos da clínica (nome, especialidades, profissionais)
// POST { clinic, name, email, phone, specialty_id, preferred_date, message } → cria solicitação
//
// Segurança:
// - O visitante nunca acessa o banco diretamente: só esta função grava, com validação no servidor.
// - A chave service_role existe apenas no ambiente da função (variável automática do Supabase),
//   nunca no navegador.
// - A clínica é identificada pelo slug e toda checagem (especialidade, limite de envios)
//   é feita dentro dessa clínica — uma clínica nunca recebe dados de outra.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SLUG_RE = /^[a-z0-9-]{3,60}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REQUESTS_PER_PHONE_24H = 3;

// Data de hoje no fuso de São Paulo, no formato AAAA-MM-DD
function todaySaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Padroniza telefones brasileiros: (11) 99999-9999 / (11) 3000-0000
function formatPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return null;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

async function findClinic(slug: unknown) {
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) return null;
  const { data, error } = await db.from("clinics").select("id, name").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

async function handleGet(url: URL) {
  const clinic = await findClinic(url.searchParams.get("clinic"));
  if (!clinic) return json({ error: "Clínica não encontrada." }, 404);

  const [specialties, professionals] = await Promise.all([
    db.from("specialties").select("id, name, description").eq("clinic_id", clinic.id).order("name"),
    db.from("professionals").select("id, name, specialty_id").eq("clinic_id", clinic.id).order("name"),
  ]);
  if (specialties.error) throw specialties.error;
  if (professionals.error) throw professionals.error;

  return json({
    clinic: { name: clinic.name },
    specialties: specialties.data ?? [],
    professionals: professionals.data ?? [],
  });
}

async function handlePost(req: Request) {
  const length = Number(req.headers.get("content-length") || "0");
  if (length > 10_000) return json({ error: "Solicitação muito grande." }, 413);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }

  // Campo-armadilha invisível: só robôs preenchem. Respondemos "ok" sem gravar nada.
  if (cleanText(body.website, 200)) return json({ ok: true }, 201);

  const clinic = await findClinic(body.clinic);
  if (!clinic) return json({ error: "Clínica não encontrada." }, 404);

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = formatPhone(cleanText(body.phone, 30));
  const specialtyId = cleanText(body.specialty_id, 36);
  const preferredDate = cleanText(body.preferred_date, 10);
  const message = cleanText(body.message, 500);

  const errors: string[] = [];
  if (name.length < 3) errors.push("Informe seu nome completo.");
  if (!EMAIL_RE.test(email)) errors.push("Informe um e-mail válido.");
  if (!phone) errors.push("Informe um telefone com DDD.");
  if (!UUID_RE.test(specialtyId)) errors.push("Selecione uma especialidade.");

  const today = todaySaoPaulo();
  if (!DATE_RE.test(preferredDate) || preferredDate < today || preferredDate > addDays(today, 365)) {
    errors.push("Escolha uma data a partir de hoje, em até 12 meses.");
  }
  if (errors.length) return json({ error: errors[0], errors }, 422);

  // A especialidade precisa pertencer a esta clínica
  const { data: specialty, error: specError } = await db
    .from("specialties").select("id").eq("id", specialtyId).eq("clinic_id", clinic.id).maybeSingle();
  if (specError) throw specError;
  if (!specialty) return json({ error: "Especialidade indisponível nesta clínica." }, 422);

  // Limite simples contra envios repetidos do mesmo telefone
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from("appointments").select("id", { count: "exact", head: true })
    .eq("clinic_id", clinic.id).eq("patient_phone", phone).gte("created_at", since);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_REQUESTS_PER_PHONE_24H) {
    return json({ error: "Recebemos várias solicitações deste telefone hoje. Nossa equipe entrará em contato." }, 429);
  }

  const { error: insertError } = await db.from("appointments").insert({
    clinic_id: clinic.id,
    patient_name: name,
    patient_email: email,
    patient_phone: phone,
    specialty_id: specialtyId,
    preferred_date: preferredDate,
    message: message || null,
    status: "pending",
  });
  if (insertError) throw insertError;

  return json({ ok: true }, 201);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method === "GET") return await handleGet(new URL(req.url));
    if (req.method === "POST") return await handlePost(req);
    return json({ error: "Método não permitido." }, 405);
  } catch (err) {
    console.error("public-booking error:", err);
    return json({ error: "Não foi possível processar a solicitação agora. Tente novamente em instantes." }, 500);
  }
});

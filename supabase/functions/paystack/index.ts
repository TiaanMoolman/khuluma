// Khuluma AAC – Paystack payments (Supabase Edge Function "paystack").
// Deploy with "Verify JWT" switched OFF: Paystack's webhook has no Supabase login. The app's own calls are checked below.
// Secrets (Edge Functions › Secrets): PAYSTACK_SECRET_KEY. Optional: PAYSTACK_PLAN_MONTH, PAYSTACK_PLAN_YEAR, SITE_URL.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const PS_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SITE = Deno.env.get("SITE_URL") ?? "https://khuluma-phi.vercel.app/";
const PLAN_CODE: Record<string, string> = {
  family_month: Deno.env.get("PAYSTACK_PLAN_MONTH") ?? "PLN_6mjgakzeqmutpix",
  family_year: Deno.env.get("PAYSTACK_PLAN_YEAR") ?? "PLN_d23ax74x30eqppf",
};
const CARD_CHECK_CENTS = 100; // R1 card check when the free trial starts; refunded straight away
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function ps(path: string, method = "GET", body?: unknown) {
  const r = await fetch("https://api.paystack.co" + path, { method, headers: { Authorization: "Bearer " + PS_KEY, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!j.status) throw new Error(j.message || "Paystack error");
  return j.data;
}
async function hmac512(key: string, text: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const planIdOf = (code: string) => Object.keys(PLAN_CODE).find((k) => PLAN_CODE[k] === code);
async function planRow(id: string) { const { data } = await db.from("plans").select("*").eq("id", id).maybeSingle(); return data; }
async function addMonths(cid: string, months: number, planId: string, extra: Record<string, unknown> = {}) {
  const { data: l } = await db.from("licences").select("paid_until").eq("child_id", cid).maybeSingle();
  const base = Math.max(Date.now(), l?.paid_until ? new Date(l.paid_until).getTime() : 0);
  const d = new Date(base); d.setMonth(d.getMonth() + months);
  await db.from("licences").update({ status: "active", plan_id: planId, paid_until: d.toISOString(), provider: "paystack", updated_at: new Date().toISOString(), ...extra }).eq("child_id", cid);
}
// returns false when this payment was already handled
async function logPayment(cid: string | null, planId: string | null, cents: number, ref: string) {
  const { error } = await db.from("payments").insert({ child_id: cid, plan_id: planId, amount_cents: cents, method: "paystack", reference: ref });
  if (error) return false;
  await db.from("plan_requests").update({ handled_at: new Date().toISOString() }).eq("child_id", cid).is("handled_at", null);
  return true;
}

// a successful card payment (from the webhook or when the parent comes back to Khuluma)
async function handleCharge(t: any) {
  let meta = t.metadata || {}; if (typeof meta === "string") { try { meta = JSON.parse(meta); } catch { meta = {}; } }
  const cid = meta.child_id, planId = meta.plan_id, kind = meta.kind;
  if (!cid || !kind) return "ignored";
  if (!(await logPayment(cid, planId, t.amount, t.reference))) return "already handled";
  const cust = t.customer?.customer_code, auth = t.authorization?.authorization_code;
  if (kind === "once") {
    await db.from("licences").update({ status: "lifetime", plan_id: planId, paid_until: null, provider: "paystack", paystack_customer: cust, updated_at: new Date().toISOString() }).eq("child_id", cid);
  } else if (kind === "plan_now") {
    const p = await planRow(planId);
    await addMonths(cid, p?.months ?? 1, planId, { paystack_customer: cust, card_on_file: true });
  } else if (kind === "trial_card") {
    try { await ps("/refund", "POST", { transaction: t.reference }); } catch (_) { /* refund can be done by hand in Paystack */ }
    const { data: l } = await db.from("licences").select("trial_ends").eq("child_id", cid).maybeSingle();
    const start = l?.trial_ends && new Date(l.trial_ends) > new Date() ? l.trial_ends : new Date(Date.now() + 3600000).toISOString();
    const sub = await ps("/subscription", "POST", { customer: cust, plan: PLAN_CODE[planId], authorization: auth, start_date: start });
    await db.from("licences").update({ plan_id: planId, provider: "paystack", paystack_customer: cust, paystack_sub: sub.subscription_code, paystack_token: sub.email_token, card_on_file: true, updated_at: new Date().toISOString() }).eq("child_id", cid);
  }
  return "ok";
}

async function userFrom(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  return data.user ?? null;
}
async function isParent(uid: string, cid: string) {
  const { data } = await db.from("child_members").select("role").eq("child_id", cid).eq("user_id", uid).maybeSingle();
  return data?.role === "parent";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!PS_KEY) return json({ error: "PAYSTACK_SECRET_KEY is not set" }, 500);
  const raw = await req.text();

  // ---------- Paystack webhook ----------
  const sig = req.headers.get("x-paystack-signature");
  if (sig) {
    if ((await hmac512(PS_KEY, raw)) !== sig) return json({ error: "bad signature" }, 401);
    const ev = JSON.parse(raw), d = ev.data || {};
    try {
      if (ev.event === "charge.success") await handleCharge(d);
      if (ev.event === "subscription.create") {
        const planId = planIdOf(d.plan?.plan_code);
        await db.from("licences").update({ paystack_sub: d.subscription_code, paystack_token: d.email_token, card_on_file: true })
          .eq("paystack_customer", d.customer?.customer_code).eq("plan_id", planId).is("paystack_sub", null);
      }
      if (ev.event === "invoice.update" && (d.paid === true || d.status === "success")) {   // monthly / yearly renewals
        const code = d.subscription?.subscription_code;
        const { data: l } = await db.from("licences").select("child_id, plan_id").eq("paystack_sub", code).maybeSingle();
        if (l && await logPayment(l.child_id, l.plan_id, d.amount ?? 0, d.transaction?.reference || d.invoice_code)) {
          const p = await planRow(l.plan_id); await addMonths(l.child_id, p?.months ?? 1, l.plan_id);
        }
      }
      if (ev.event === "subscription.disable" || ev.event === "subscription.not_renew") {
        await db.from("licences").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("paystack_sub", d.subscription_code);
      }
    } catch (e) { console.error(ev.event, e); }
    return json({ received: true });
  }

  // ---------- calls from the Khuluma app ----------
  const user = await userFrom(req);
  if (!user) return json({ error: "Please sign in again." }, 401);
  let body: any = {}; try { body = JSON.parse(raw || "{}"); } catch { /* empty */ }
  try {
    if (body.action === "start") {
      const { child_id: cid, plan_id: planId, mode } = body;
      if (!(await isParent(user.id, cid))) return json({ error: "Only the child's parent can pay for the plan." }, 403);
      const p = await planRow(planId); if (!p) return json({ error: "Unknown plan" }, 400);
      const { data: l } = await db.from("licences").select("*").eq("child_id", cid).maybeSingle();
      const back = SITE + (SITE.includes("?") ? "&" : "?") + "paid=1";
      let init: Record<string, unknown>;
      if (p.period === "lifetime") init = { amount: p.price_cents, metadata: { child_id: cid, plan_id: planId, kind: "once" } };
      else if (mode === "trial" && l?.status === "trial" && new Date(l.trial_ends) > new Date())
        init = { amount: CARD_CHECK_CENTS, channels: ["card"], metadata: { child_id: cid, plan_id: planId, kind: "trial_card" } };
      else init = { amount: p.price_cents, plan: PLAN_CODE[planId], metadata: { child_id: cid, plan_id: planId, kind: "plan_now" } };
      const t = await ps("/transaction/initialize", "POST", { email: user.email, currency: "ZAR", callback_url: back, ...init });
      return json({ url: t.authorization_url, reference: t.reference });
    }
    if (body.action === "verify") {
      const t = await ps("/transaction/verify/" + encodeURIComponent(body.reference));
      if (t.status !== "success") return json({ status: t.status });
      return json({ status: "success", result: await handleCharge(t) });
    }
    if (body.action === "cancel") {
      const cid = body.child_id;
      if (!(await isParent(user.id, cid))) return json({ error: "Only the child's parent can cancel." }, 403);
      const { data: l } = await db.from("licences").select("*").eq("child_id", cid).maybeSingle();
      if (l?.paystack_sub) {
        let token = l.paystack_token; if (!token) token = (await ps("/subscription/" + l.paystack_sub)).email_token;
        await ps("/subscription/disable", "POST", { code: l.paystack_sub, token });
      }
      await db.from("licences").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("child_id", cid);
      return json({ ok: true });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

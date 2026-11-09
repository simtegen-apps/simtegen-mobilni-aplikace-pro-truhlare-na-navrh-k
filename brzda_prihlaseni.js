// Brake on login links, in front of the template's one. Lives outside
// functions/ for the same reason as spolecne.js.
//
// The template's functions/api/_middleware.js counts POST /api/prihlaseni
// per whole address (an IPv6 caller has a /64 of them) and in one hourly
// ceiling for the whole product (LIMIT_PRIHLASENI_HODINA, 200) shared by new
// addresses and existing customers. A script with random addresses — each
// passes the three-per-mailbox limit — fills that ceiling and every customer
// gets 429 for the rest of the hour, hour after hour. prihlaseni.js keeps the
// two apart precisely so that cannot happen; the shared ceiling undid it.
//
// functions/_middleware.js (the product's) runs BEFORE the template's, so
// what this stops never reaches its counters:
//   - per network (IPv6 by its /64, sit.js) LIMIT_PRIHLASENI_IP an hour;
//   - links to addresses with NO account share at most half of the product
//     ceiling. Past it the answer looks exactly like a sent link (and takes
//     about as long), as in prihlaseni.js — a different one would tell a
//     stranger which addresses have an account. Existing customers keep the
//     other half to themselves.

import { json } from "./spolecne.js";
import { vLimitu } from "./ochrana.js";
import { sitKlienta } from "./sit.js";

const HODINA_S = 3600;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,}$/;
// This answer does not pass through the template's middleware, which adds
// these to every /api/ answer.
const HLAVICKY = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function cislo(hodnota, vychozi) {
  const n = Number.parseInt(String(hodnota ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : vychozi;
}

/** null = let the request through; otherwise the answer to give. */
export async function brzdaPrihlaseni(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/api/prihlaseni") return null;
  // A foreign page's POST is refused by the template (403); counting it here
  // would only let that page spend its visitors' limits.
  const puvod = request.headers.get("Origin");
  if (puvod && puvod !== url.origin) return null;

  if (!(await vLimitu(env, "prihlaseni_sit", sitKlienta(request, env),
    cislo(env.LIMIT_PRIHLASENI_IP, 10), HODINA_S))) {
    return json({ chyba: "Příliš mnoho pokusů. Zkuste to prosím za hodinu." }, 429,
      { ...HLAVICKY, "Retry-After": String(HODINA_S) });
  }

  let email = "";
  try {
    email = String((await request.clone().json()).email || "").trim().toLowerCase();
  } catch {
    return null; // the handler answers a body that is not JSON
  }
  if (!EMAIL.test(email)) return null; // the handler refuses it; nothing goes out

  const ucet = await env.DB.prepare("SELECT 1 AS ano FROM uzivatele WHERE email = ?")
    .bind(email).first();
  if (ucet) return null;

  const strop = Math.max(1, Math.floor(cislo(env.LIMIT_PRIHLASENI_HODINA, 200) / 2));
  if (await vLimitu(env, "prihlaseni_nove", "vse", strop, HODINA_S)) return null;
  console.warn("prihlaseni: hodinový strop odkazů na nové adresy je plný");
  await new Promise((hotovo) => setTimeout(hotovo, 300 + Math.floor(Math.random() * 600)));
  return json({ stav: "odeslano" }, 200, HLAVICKY);
}

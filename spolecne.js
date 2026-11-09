// Shared helpers for the Pages Functions. Lives OUTSIDE functions/ on
// purpose: everything under functions/ is a route candidate, and a helper
// module that suddenly answers HTTP requests is a bug nobody looks for.

import { vyvoj } from "./ochrana.js";

const KODOVAC = new TextEncoder();

export async function otisk(token) {
  // Tokens are stored only as SHA-256 digests — a leaked database must not
  // be a bag of valid logins.
  const digest = await crypto.subtle.digest("SHA-256", KODOVAC.encode(token));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function novyToken() {
  const bajty = new Uint8Array(32);
  crypto.getRandomValues(bajty);
  return [...bajty].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function ted() {
  // Unix seconds, matching the INTEGER columns in db/migrace.
  return Math.floor(Date.now() / 1000);
}

export function json(telo, status = 200, hlavicky = {}) {
  return new Response(JSON.stringify(telo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...hlavicky },
  });
}

export function ctiCookie(request, nazev) {
  const cookies = request.headers.get("Cookie") || "";
  for (const kus of cookies.split(";")) {
    const [k, ...v] = kus.trim().split("=");
    if (k === nazev) return v.join("=");
  }
  return null;
}

// The session cookie carries the __Host- prefix: the browser then accepts it
// only from this exact host (Secure, Path=/, no Domain). Every SimteGen
// product lives under simtegen.com, and a plain "relace" could be planted by
// any sibling subdomain with Domain=.simtegen.com — the customer would
// silently work inside the planter's account (session fixation). A plain
// "relace" is therefore NEVER accepted as a login: not read here, so the
// template middleware never sees a user for it and never moves it to the new
// name (it only clears it). Sessions from before the prefix end once; the
// customer asks for a new link.
//
// The one exception is a local `wrangler pages dev` over http in
// development mode, where a browser would refuse a __Host- cookie.
export const RELACE_COOKIE = "__Host-relace";
const RELACE_MISTNI = "relace";
export const RELACE_TRVANI = 30 * 24 * 3600; // matches manifest: 30 days
export const ODKAZ_TRVANI = 3600; // link valid 1 hour; rows purged after 24 h

export function jmenoRelace(request, env) {
  if (request && vyvoj(env) && new URL(request.url).protocol === "http:") return RELACE_MISTNI;
  return RELACE_COOKIE;
}

export function cookieHlavicka(token, maxAge, request, env) {
  // HttpOnly: the frontend never reads the session token — it only asks
  // /api/ja who it is. SameSite=Lax also blanks the cookie on cross-site
  // POSTs, which is the v1 CSRF story.
  return (
    `${jmenoRelace(request, env)}=${token}; HttpOnly; Secure; SameSite=Lax; ` +
    `Path=/; Max-Age=${maxAge}`
  );
}

export async function nactiUzivatele(request, env) {
  const token = ctiCookie(request, jmenoRelace(request, env));
  if (!token) return null;
  const radek = await env.DB.prepare(
    "SELECT u.id, u.email FROM relace r JOIN uzivatele u ON u.id = r.uzivatel_id " +
    "WHERE r.otisk_tokenu = ? AND r.expirace > ?"
  ).bind(await otisk(token), ted()).first();
  return radek || null;
}

export async function tabulkySUzivatelem(env) {
  // Every app table carries uzivatel_id (CI enforces it), so export and
  // deletion can be generic: introspect instead of maintaining a list that
  // would drift the first time a builder adds a table.
  const tabulky = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' " +
    "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' " +
    "AND name != 'd1_migrations'"
  ).all();
  const vysledek = [];
  for (const { name } of tabulky.results) {
    const sloupce = await env.DB.prepare(`PRAGMA table_info("${name}")`).all();
    if (sloupce.results.some((s) => s.name === "uzivatel_id")) {
      vysledek.push(name);
    }
  }
  return vysledek;
}

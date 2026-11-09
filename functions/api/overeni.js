// /api/overeni — the link from the email.
//
//   GET  ?token=...  → only the confirmation page (ochrana.js). Mail
//                      scanners and link previews open links with GET; a GET
//                      that logged in would spend the customer's link first.
//   POST {token}     → the page's button (urlencoded) or a script (JSON):
//                      verifies the token, creates the account on first
//                      login, opens a session, redirects home.
//
// With a POST handler here, functions/api/_middleware.js leaves both
// methods to this file (it only bridges products that log in on GET).

import {
  cookieHlavicka, novyToken, otisk, ted, RELACE_TRVANI,
} from "../../spolecne.js";
import { potvrzeniPrihlaseni, tokenZPotvrzeni } from "../../ochrana.js";

const TOKEN = /^[0-9a-f]{64}$/;

function chybova() {
  return new Response(
    "Přihlašovací odkaz je neplatný nebo vypršel. Nechte si prosím poslat nový.",
    { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}

export async function onRequestGet(context) {
  const token = new URL(context.request.url).searchParams.get("token") || "";
  if (!TOKEN.test(token)) return chybova();
  return potvrzeniPrihlaseni(token);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = await tokenZPotvrzeni(request);
  const domu = new URL("/", request.url).toString();

  if (!TOKEN.test(token)) return chybova();

  const digest = await otisk(token);
  const odkaz = await env.DB.prepare(
    "SELECT id, email FROM prihlasovaci_odkazy " +
    "WHERE otisk_tokenu = ? AND pouzito = 0 AND expirace > ?"
  ).bind(digest, ted()).first();
  if (!odkaz) return chybova();

  // Single-use before anything else: a replayed link must find it spent.
  await env.DB.prepare(
    "UPDATE prihlasovaci_odkazy SET pouzito = 1 WHERE id = ?"
  ).bind(odkaz.id).run();

  await env.DB.prepare(
    "INSERT INTO uzivatele (email) VALUES (?) ON CONFLICT(email) DO NOTHING"
  ).bind(odkaz.email).run();
  const uzivatel = await env.DB.prepare(
    "SELECT id FROM uzivatele WHERE email = ?"
  ).bind(odkaz.email).first();

  const relaceToken = novyToken();
  await env.DB.prepare(
    "INSERT INTO relace (otisk_tokenu, uzivatel_id, expirace) VALUES (?, ?, ?)"
  ).bind(await otisk(relaceToken), uzivatel.id, ted() + RELACE_TRVANI).run();

  // Login is the housekeeping moment: cheap, and guarantees the retention
  // promises in the policy without needing any scheduler.
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM prihlasovaci_odkazy WHERE expirace < ? OR pouzito = 1"
    ).bind(ted() - 23 * 3600),
    env.DB.prepare("DELETE FROM relace WHERE expirace < ?").bind(ted()),
  ]);

  return new Response(null, {
    status: 303,
    headers: {
      Location: domu,
      "Set-Cookie": cookieHlavicka(relaceToken, RELACE_TRVANI),
    },
  });
}

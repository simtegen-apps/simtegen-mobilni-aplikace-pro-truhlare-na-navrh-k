// POST /api/navsteva {stranka} — one anonymous page view.
//
// Counts only. No cookie, no IP, no account: the row is (day, page, count),
// so the review can see how many people reached the landing screen versus
// how many created an account, and the privacy policy stays true — this
// is not tracking, it is a tally mark. Unauthenticated on purpose: the
// visitors we care about are the ones without an account yet. Bots
// inflate it; a product with real customers does not decide on this
// number alone.
//
// Where the visit came from (zdroje_navstev) is written by the template's
// _middleware.js after this handler, from the Referer's utm_source /
// utm_campaign, and only when this handler answers 2xx. A script can put any
// labels into Referer, so past MAX_ZDROJU (source, campaign) pairs a day a
// NEW pair is not added: the visit itself is still counted here, and the
// answer is 429 so the middleware leaves the source out. Known pairs keep
// counting — a flood can inflate a number, never grow the table.
//
// Per network at most LIMIT_SIT visits an hour (like chyba-stranky.js): a
// visitor sends one per page load, a script sending thousands would inflate
// the numbers the owner decides on and cost D1 writes. Over the limit the
// answer is 429 before anything is written, so the middleware writes no
// source either. IPv6 counts by its /64 (sit.js).

import { json } from "../../spolecne.js";
import { vLimitu } from "../../ochrana.js";
import { sitKlienta } from "../../sit.js";

const STRANKY = new Set(["uvod", "cenik", "prihlaseni"]);
const MAX_ZDROJU = 100;
const LIMIT_SIT = 60;

// The same label the middleware stores (its stitek / zdrojZ), so "is this
// pair already there" asks about the very row it would write.
const ZNAK = /[^a-z0-9._-]/g;

function stitek(hodnota) {
  const s = String(hodnota || "").trim().toLowerCase().replace(ZNAK, "-").replace(/-+/g, "-").slice(0, 40);
  return s.replace(/^-|-$/g, "");
}

function zdrojZ(referer) {
  try {
    const parametry = new URL(referer).searchParams;
    const zdroj = stitek(parametry.get("utm_source"));
    return zdroj ? { zdroj, kampan: stitek(parametry.get("utm_campaign")) } : null;
  } catch {
    return null;
  }
}

async function novyZdrojNadStrop(env, den, z) {
  try {
    const znamy = await env.DB.prepare(
      "SELECT 1 AS ano FROM zdroje_navstev WHERE den = ? AND zdroj = ? AND kampan = ?"
    ).bind(den, z.zdroj, z.kampan).first();
    if (znamy) return false;
    const radku = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM zdroje_navstev WHERE den = ?"
    ).bind(den).first();
    return !radku || radku.n >= MAX_ZDROJU;
  } catch {
    // No table yet (before 0910_zdroje): the middleware's write fails anyway.
    return false;
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let telo;
  try {
    telo = await request.json();
  } catch {
    return json({ chyba: "Neplatný požadavek." }, 400);
  }
  const stranka = String((telo && telo.stranka) || "uvod");
  if (!STRANKY.has(stranka)) return json({ chyba: "Neznámá stránka." }, 422);
  if (!(await vLimitu(env, "navsteva_sit", sitKlienta(request, env), LIMIT_SIT, 3600))) {
    return json({ chyba: "Příliš mnoho požadavků." }, 429);
  }
  const den = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    "INSERT INTO navstevy (den, stranka, pocet) VALUES (?, ?, 1) " +
    "ON CONFLICT(den, stranka) DO UPDATE SET pocet = pocet + 1"
  ).bind(den, stranka).run();
  const z = zdrojZ(request.headers.get("Referer"));
  if (z && await novyZdrojNadStrop(env, den, z)) {
    return json({ ok: true, zdroj: "nezapsan" }, 429);
  }
  return json({ ok: true });
}

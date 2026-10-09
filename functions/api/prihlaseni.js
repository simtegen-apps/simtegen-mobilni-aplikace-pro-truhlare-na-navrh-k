// POST /api/prihlaseni {email} — request a one-time login link.
//
// No passwords anywhere in the product: the email inbox is the identity.
//
// Development mode (the link in the response body instead of an e-mail)
// exists so the flow is testable with no mail infrastructure — but it is
// an open door: whoever can call the endpoint gets a working link for ANY
// address, which is the whole account. It is therefore allowed ONLY when
// the request arrives on a loopback address, i.e. a local
// `wrangler pages dev`. A deployed URL is public, so a missing key must
// never be the thing that unlocks it: production and preview without mail
// configured refuse to issue a link at all.
//
// Loopback is deliberately not a switch anybody can flip. A variable or an
// env flag could be set on production by mistake, and the hole would be
// back — the address the request came in on cannot.

import { json, novyToken, otisk, ted, ODKAZ_TRVANI } from "../../spolecne.js";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,}$/;
const MISTNI = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export async function onRequestPost(context) {
  const { request, env } = context;
  let telo;
  try {
    telo = await request.json();
  } catch {
    return json({ chyba: "Tělo požadavku musí být JSON." }, 400);
  }
  const email = String(telo.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return json({ chyba: "Zadejte prosím platnou e-mailovou adresu." }, 422);
  }

  // Rozhoduje se dřív, než vznikne token: na nasazené adrese bez nastavené
  // pošty nemá smysl zakládat odkaz, který se nemá jak doručit (a zabíral
  // by zákazníkovi limit tří pokusů za hodinu).
  const adresa = new URL(request.url);
  const posilameEmail = Boolean(env.RESEND_API_KEY && env.EMAIL_ODESILATEL);
  if (!posilameEmail && !MISTNI.has(adresa.hostname)) {
    // Zákazníkovi se neříká, že chybí konfigurace — to je informace pro
    // provozovatele, ne pro toho, kdo zkouší, co se dá.
    return json({ chyba: "Přihlašovací odkaz teď nejde odeslat. Zkuste to prosím "
      + "za chvíli znovu." }, 503);
  }

  // Three links per hour per address: enough for a confused customer,
  // useless for turning us into someone's spam cannon.
  const pocet = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM prihlasovaci_odkazy WHERE email = ? AND vytvoreno > ?"
  ).bind(email, ted() - 3600).first();
  if (pocet.n >= 3) {
    return json({ chyba: "Příliš mnoho pokusů. Zkuste to prosím za hodinu." }, 429);
  }

  const token = novyToken();
  await env.DB.prepare(
    "INSERT INTO prihlasovaci_odkazy (otisk_tokenu, email, expirace) VALUES (?, ?, ?)"
  ).bind(await otisk(token), email, ted() + ODKAZ_TRVANI).run();

  const odkaz = `${adresa.origin}/api/overeni?token=${token}`;

  if (!posilameEmail) {
    // Sem se dá dostat jen z místního serveru — viz kontrola výš.
    return json({
      stav: "vyvojovy_rezim",
      odkaz,
      upozorneni: "Odesílání e-mailů není nastavené a běžíte místně — odkaz je "
        + "v odpovědi. Takto spuštěná aplikace neslouží jako skutečné přihlášení.",
    });
  }

  const odpoved = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_ODESILATEL,
      to: [email],
      subject: "Váš přihlašovací odkaz",
      text:
        "Dobrý den,\n\npro přihlášení otevřete tento odkaz (platí 1 hodinu):\n"
        + `${odkaz}\n\nPokud jste o přihlášení nežádali, e-mail ignorujte.\n`,
    }),
  });
  if (!odpoved.ok) {
    return json({ chyba: "Odeslání e-mailu se nepodařilo. Zkuste to prosím znovu." }, 502);
  }
  return json({ stav: "odeslano" });
}

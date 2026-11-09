// Session middleware: resolve the cookie once, hand the user to every
// handler via context.data.uzivatel. Handlers stay one-purpose files.
//
// The subscription state rides along (context.data.predplatne): one extra
// query per API call, so a product route can gate with vyzadujPredplatne()
// and /api/ja can show it, without either re-deriving the rules.
//
// It also runs before the template's functions/api/_middleware.js, so the
// brake on login links (brzda_prihlaseni.js) sits here: what it stops never
// reaches the template's shared counters.

import { nactiUzivatele } from "../spolecne.js";
import { stavPredplatneho } from "../predplatne.js";
import { brzdaPrihlaseni } from "../brzda_prihlaseni.js";

export async function onRequest(context) {
  const zastaveno = await brzdaPrihlaseni(context);
  if (zastaveno) return zastaveno;
  const uzivatel = await nactiUzivatele(context.request, context.env);
  context.data.uzivatel = uzivatel;
  context.data.predplatne = uzivatel
    ? await stavPredplatneho(context.env, uzivatel)
    : null;
  return context.next();
}

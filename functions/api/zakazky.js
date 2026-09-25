// /api/zakazky — seznam zakázek a založení nové.
//
// GET  → zakázky přihlášeného truhláře, naposledy měněné nahoře, s počtem
//        dílů z posledního vygenerovaného kusovníku (to je číslo, podle
//        kterého zakázku v seznamu pozná).
// POST → {nazev, oznaceni_zakaznika, poznamka} → id nové zakázky.

import { json, ted } from "../../spolecne.js";
import { vyzadujPredplatne } from "../../predplatne.js";
import { ocistiText } from "../../zakazky_data.js";

const MAX_ZAKAZEK = 300;

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const radky = await env.DB.prepare(
    "SELECT z.id, z.nazev, z.oznaceni_zakaznika, z.stav, z.vytvoreno, z.zmeneno, "
    + "(SELECT k.pocet_dilu FROM kusovniky k WHERE k.zakazka_id = z.id "
    + " AND k.uzivatel_id = z.uzivatel_id ORDER BY k.id DESC LIMIT 1) AS pocet_dilu "
    + "FROM zakazky z WHERE z.uzivatel_id = ? ORDER BY z.zmeneno DESC LIMIT 200"
  ).bind(data.uzivatel.id).all();
  return json({ zakazky: radky.results || [] });
}

export async function onRequestPost(context) {
  const { env, data, request } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  let telo;
  try {
    telo = await request.json();
  } catch {
    return json({ chyba: "Neplatný požadavek." }, 400);
  }

  const nazev = ocistiText(telo?.nazev, 120);
  if (nazev.length < 2) {
    return json({ chyba: "Napište prosím název zakázky (aspoň dva znaky)." }, 422);
  }

  const pocet = await env.DB.prepare("SELECT COUNT(*) AS n FROM zakazky WHERE uzivatel_id = ?")
    .bind(data.uzivatel.id).first();
  if (pocet && pocet.n >= MAX_ZAKAZEK) {
    return json({ chyba: `Máte uloženo ${MAX_ZAKAZEK} zakázek — část starších prosím smažte.` }, 422);
  }

  const vlozena = await env.DB.prepare(
    "INSERT INTO zakazky (uzivatel_id, nazev, oznaceni_zakaznika, poznamka, vytvoreno, zmeneno) "
    + "VALUES (?, ?, ?, ?, ?, ?) RETURNING id"
  ).bind(data.uzivatel.id, nazev, ocistiText(telo?.oznaceni_zakaznika, 120),
    ocistiText(telo?.poznamka, 1000), ted(), ted()).first();

  return json({ id: vlozena.id, nazev });
}

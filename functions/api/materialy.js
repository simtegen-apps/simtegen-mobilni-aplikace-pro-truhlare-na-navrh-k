// /api/materialy — desky a dekory, které truhlář používá.
//
// Druhá věc, kterou si zákazník v nástroji buduje a kvůli které se vrací:
// jeho vlastní seznam materiálů. Skříňka na něj odkazuje a kusovník podle
// něj seskupuje díly a řeší směr vlákna.
//
// GET    → seznam
// POST   → {nazev, dekor_kod, tloustka_mm, vlakno, hrana_dekor}
// DELETE → ?id=… ; skříňky, které materiál používaly, spadnou na výchozí

import { json } from "../../spolecne.js";
import { vyzadujPredplatne } from "../../predplatne.js";
import { nactiMaterialy, ocistiText, celeCislo } from "../../zakazky_data.js";

const MAX_MATERIALU = 60;

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;
  return json({ materialy: await nactiMaterialy(env, data.uzivatel.id) });
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
  const nazev = ocistiText(telo?.nazev, 80);
  if (nazev.length < 2) {
    return json({ chyba: "Napište prosím název materiálu (aspoň dva znaky)." }, 422);
  }

  const pocet = await env.DB.prepare("SELECT COUNT(*) AS n FROM materialy WHERE uzivatel_id = ?")
    .bind(data.uzivatel.id).first();
  if (pocet && pocet.n >= MAX_MATERIALU) {
    return json({ chyba: `Materiálů už máte ${MAX_MATERIALU} — část prosím smažte.` }, 422);
  }

  const tloustka = Math.min(60, Math.max(3, celeCislo(telo?.tloustka_mm, 18)));
  const vlozeny = await env.DB.prepare(
    "INSERT INTO materialy (uzivatel_id, nazev, dekor_kod, tloustka_mm, vlakno, hrana_dekor) "
    + "VALUES (?, ?, ?, ?, ?, ?) RETURNING id"
  ).bind(data.uzivatel.id, nazev, ocistiText(telo?.dekor_kod, 40), tloustka,
    telo?.vlakno ? 1 : 0, ocistiText(telo?.hrana_dekor, 40)).first();

  return json({ id: vlozeny.id });
}

export async function onRequestDelete(context) {
  const { env, data, request } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return json({ chyba: "Neplatný požadavek." }, 400);

  await env.DB.batch([
    env.DB.prepare("UPDATE skrinky SET material_id = NULL WHERE uzivatel_id = ? AND material_id = ?")
      .bind(data.uzivatel.id, id),
    env.DB.prepare("DELETE FROM materialy WHERE uzivatel_id = ? AND id = ?")
      .bind(data.uzivatel.id, id),
  ]);
  return json({ smazano: true });
}

// /api/zakazky/:id/kopie — starší zakázka jako šablona pro novou.
//
// Tohle je funkce, kvůli které se truhlář vrací: druhá kuchyň bývá skoro
// jako první, jen o kus kratší stěna. Kopíruje se návrh (stěny a skříňky),
// NE označení koncového zákazníka ani poznámka — ty patří k té staré
// zakázce a do nové by se nasypaly cizí údaje.

import { json, ted } from "../../../../spolecne.js";
import { vyzadujPredplatne } from "../../../../predplatne.js";
import { nactiDokument, ulozDokument, ocistiText } from "../../../../zakazky_data.js";

export async function onRequestPost(context) {
  const { env, data, request } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ chyba: "Neplatný požadavek." }, 400);

  const zdroj = await nactiDokument(env, data.uzivatel.id, id);
  if (!zdroj) return json({ chyba: "Zakázku jsme nenašli." }, 404);

  let telo = {};
  try {
    telo = await request.json();
  } catch {
    telo = {};
  }
  const nazev = ocistiText(telo?.nazev, 120) || `${zdroj.zakazka.nazev} (kopie)`;

  const nova = await env.DB.prepare(
    "INSERT INTO zakazky (uzivatel_id, nazev, vytvoreno, zmeneno) VALUES (?, ?, ?, ?) "
    + "RETURNING id"
  ).bind(data.uzivatel.id, nazev.slice(0, 120), ted(), ted()).first();

  await ulozDokument(env, data.uzivatel.id, nova.id, zdroj);

  return json({ id: nova.id, nazev: nazev.slice(0, 120) });
}

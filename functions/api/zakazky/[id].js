// /api/zakazky/:id — jedna zakázka jako celý dokument.
//
// GET    → {zakazka, steny:[{…, skrinky:[…]}]}
// PUT    → tentýž tvar zpátky; stěny a skříňky se přepíšou celé (viz
//          zakazky_data.js — telefon u zákazníka drží celý dokument).
// DELETE → smaže zakázku; stěny, skříňky i kusovníky jdou s ní (CASCADE).

import { json, ted } from "../../../spolecne.js";
import { vyzadujPredplatne } from "../../../predplatne.js";
import { nactiDokument, ulozDokument, ocistiText } from "../../../zakazky_data.js";

function cisloZakazky(context) {
  const id = Number(context.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = cisloZakazky(context);
  if (!id) return json({ chyba: "Neplatný požadavek." }, 400);
  const dokument = await nactiDokument(env, data.uzivatel.id, id);
  if (!dokument) return json({ chyba: "Zakázku jsme nenašli." }, 404);
  return json(dokument);
}

export async function onRequestPut(context) {
  const { env, data, request } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = cisloZakazky(context);
  if (!id) return json({ chyba: "Neplatný požadavek." }, 400);

  let telo;
  try {
    telo = await request.json();
  } catch {
    return json({ chyba: "Neplatný požadavek." }, 400);
  }

  const stavajici = await env.DB.prepare(
    "SELECT id FROM zakazky WHERE id = ? AND uzivatel_id = ?"
  ).bind(id, data.uzivatel.id).first();
  if (!stavajici) return json({ chyba: "Zakázku jsme nenašli." }, 404);

  const nazev = ocistiText(telo?.zakazka?.nazev, 120);
  if (nazev.length < 2) {
    return json({ chyba: "Napište prosím název zakázky (aspoň dva znaky)." }, 422);
  }
  const stav = telo?.zakazka?.stav === "hotova" ? "hotova" : "rozpracovana";

  await env.DB.prepare(
    "UPDATE zakazky SET nazev = ?, oznaceni_zakaznika = ?, poznamka = ?, stav = ?, "
    + "zmeneno = ? WHERE id = ? AND uzivatel_id = ?"
  ).bind(nazev, ocistiText(telo?.zakazka?.oznaceni_zakaznika, 120),
    ocistiText(telo?.zakazka?.poznamka, 1000), stav, ted(), id, data.uzivatel.id).run();

  await ulozDokument(env, data.uzivatel.id, id, telo);

  const dokument = await nactiDokument(env, data.uzivatel.id, id);
  return json(dokument);
}

export async function onRequestDelete(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = cisloZakazky(context);
  if (!id) return json({ chyba: "Neplatný požadavek." }, 400);

  // Cizí klíče v D1 nemusí být zapnuté, tak mažeme výslovně — osiřelé
  // řádky by při exportu účtu vypadaly jako data, která tam nepatří.
  await env.DB.batch([
    env.DB.prepare("DELETE FROM skrinky WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(data.uzivatel.id, id),
    env.DB.prepare("DELETE FROM steny WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(data.uzivatel.id, id),
    env.DB.prepare("DELETE FROM kusovniky WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(data.uzivatel.id, id),
    env.DB.prepare("DELETE FROM zakazky WHERE uzivatel_id = ? AND id = ?")
      .bind(data.uzivatel.id, id),
  ]);
  return json({ smazano: true });
}

// /api/standard — konstrukční standard dílny.
//
// Jeden na účet. Tohle je ta část produktu, kvůli které se zákazník
// vrací: nastaví se jednou a každý další kusovník z něj vypadne
// v rozměrech, ve kterých staví jeho dílna.
//
// GET → standard (výchozí se založí při prvním čtení) a ukázka rozpadu,
//       ať je na obrazovce hned vidět, co parametry dělají.
// PUT → uložení; hodnoty se ořežou do mezí, ne odmítnou — truhlář u
//       zákazníka nemá řešit validační hlášky kvůli překlepu o jednotku.

import { json, ted } from "../../spolecne.js";
import { vyzadujPredplatne } from "../../predplatne.js";
import { normalizujStandard, ukazkaStandardu, VYCHOZI_STANDARD } from "../../rozpad.js";
import { zajistiStandard } from "../../zakazky_data.js";

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const standard = await zajistiStandard(env, data.uzivatel.id);
  return json({ standard, ukazka: ukazkaStandardu(standard), vychozi: VYCHOZI_STANDARD });
}

export async function onRequestPut(context) {
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

  await zajistiStandard(env, data.uzivatel.id);
  const s = normalizujStandard(telo);
  s.nazev = (s.nazev || "Můj standard").slice(0, 60);

  await env.DB.prepare(
    "UPDATE standardy SET nazev = ?, tloustka_mm = ?, zada_tloustka_mm = ?, zada_typ = ?, "
    + "drazka_hloubka_mm = ?, drazka_odsazeni_mm = ?, odskok_police_mm = ?, "
    + "spara_okraj_desetiny = ?, spara_mezi_desetiny = ?, traverzy_spodni = ?, "
    + "traverza_sirka_mm = ?, sokl_mm = ?, vyska_horni_mm = ?, "
    + "hrana_pohledova_desetiny = ?, hrana_ostatni_desetiny = ?, rozmer_s_olepenim = ?, "
    + "prorez_mm = ?, deska_x_mm = ?, deska_y_mm = ?, zmeneno = ? WHERE uzivatel_id = ?"
  ).bind(
    s.nazev, s.tloustka_mm, s.zada_tloustka_mm, s.zada_typ,
    s.drazka_hloubka_mm, s.drazka_odsazeni_mm, s.odskok_police_mm,
    s.spara_okraj_desetiny, s.spara_mezi_desetiny, s.traverzy_spodni,
    s.traverza_sirka_mm, s.sokl_mm, s.vyska_horni_mm,
    s.hrana_pohledova_desetiny, s.hrana_ostatni_desetiny, s.rozmer_s_olepenim,
    s.prorez_mm, s.deska_x_mm, s.deska_y_mm, ted(), data.uzivatel.id
  ).run();

  return json({ standard: s, ukazka: ukazkaStandardu(s) });
}

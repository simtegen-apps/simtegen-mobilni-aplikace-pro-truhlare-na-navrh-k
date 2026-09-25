// /api/kusovnik — vygeneruje kusovník ze zakázky a uloží ho.
//
// Počítá se TADY, na serveru, ne v prohlížeči: je to placená funkce a
// výsledek se musí uložit i se snímkem konstrukčního standardu. Když si
// truhlář za měsíc změní v dílně tloušťku hrany, starý kusovník se tím
// nesmí přepsat — jinak se nedá dohledat, co poslal do nářezového centra.
//
// Vstupem je uložená zakázka z databáze, ne tělo požadavku: kusovník musí
// odpovídat tomu, co je uložené, ne tomu, co zrovna leží v telefonu.

import { json } from "../../spolecne.js";
import { vyzadujPredplatne } from "../../predplatne.js";
import { kusovnikZakazky } from "../../rozpad.js";
import { nactiDokument, nactiMaterialy, zajistiStandard } from "../../zakazky_data.js";

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
  const zakazkaId = Number(telo?.zakazka_id);
  if (!Number.isInteger(zakazkaId) || zakazkaId <= 0) {
    return json({ chyba: "Neplatný požadavek." }, 400);
  }

  const dokument = await nactiDokument(env, data.uzivatel.id, zakazkaId);
  if (!dokument) return json({ chyba: "Zakázku jsme nenašli." }, 404);

  const maSkrinku = (dokument.steny || []).some((s) => (s.skrinky || []).length > 0);
  if (!maSkrinku) {
    return json({ chyba: "Zakázka zatím nemá žádnou skříňku — nejdřív nějakou přidejte." }, 422);
  }

  const standard = await zajistiStandard(env, data.uzivatel.id);
  const materialy = await nactiMaterialy(env, data.uzivatel.id);
  const kusovnik = kusovnikZakazky(dokument, standard, materialy);

  const vlozeny = await env.DB.prepare(
    "INSERT INTO kusovniky (uzivatel_id, zakazka_id, nazev_zakazky, standard_snapshot_json, "
    + "polozky_json, varovani_json, pocet_dilu, plocha_cm2, odhad_desek) "
    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, vytvoreno"
  ).bind(
    data.uzivatel.id, zakazkaId, dokument.zakazka.nazev,
    JSON.stringify(standard), JSON.stringify(kusovnik.polozky),
    JSON.stringify(kusovnik.varovani), kusovnik.souhrn.pocet_dilu,
    kusovnik.souhrn.plocha_cm2, kusovnik.souhrn.odhad_desek
  ).first();

  // Staré kusovníky téže zakázky necháváme (historie), ale ne donekonečna.
  await env.DB.prepare(
    "DELETE FROM kusovniky WHERE uzivatel_id = ? AND zakazka_id = ? AND id NOT IN "
    + "(SELECT id FROM kusovniky WHERE uzivatel_id = ? AND zakazka_id = ? "
    + " ORDER BY id DESC LIMIT 20)"
  ).bind(data.uzivatel.id, zakazkaId, data.uzivatel.id, zakazkaId).run();

  return json({
    id: vlozeny.id,
    vytvoreno: vlozeny.vytvoreno,
    zakazka: { id: zakazkaId, nazev: dokument.zakazka.nazev },
    standard,
    ...kusovnik,
  });
}

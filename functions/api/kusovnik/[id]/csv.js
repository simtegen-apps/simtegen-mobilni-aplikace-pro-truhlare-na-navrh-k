// /api/kusovnik/:id/csv — kusovník ve tvaru, který se dá poslat do
// nářezového centra.
//
// Formát je jeden a obecný: středník jako oddělovač a BOM na začátku, aby
// se soubor v českém Excelu otevřel rovnou ve sloupcích a s háčky. Každé
// centrum chce sloupce trochu jinak — až bude první zákazník, vezme se
// jeho šablona; do té doby je lepší jeden čitelný formát než pět polovičních.

import { json } from "../../../../spolecne.js";
import { vyzadujPredplatne } from "../../../../predplatne.js";
import { nactiKusovnik } from "../../../../zakazky_data.js";
import { csvKusovniku } from "../../../../rozpad.js";

function bezpecnyNazev(nazev) {
  // Do hlavičky Content-Disposition patří ASCII; háčky a mezery ať se
  // nepřetlučou o parser prohlížeče.
  const zaklad = String(nazev || "kusovnik")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return zaklad || "kusovnik";
}

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ chyba: "Neplatný požadavek." }, 400);

  const kusovnik = await nactiKusovnik(env, data.uzivatel.id, id);
  if (!kusovnik) return json({ chyba: "Kusovník jsme nenašli." }, 404);

  const csv = csvKusovniku(kusovnik, kusovnik.zakazka, kusovnik.standard);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        `attachment; filename="kusovnik-${bezpecnyNazev(kusovnik.zakazka.nazev)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

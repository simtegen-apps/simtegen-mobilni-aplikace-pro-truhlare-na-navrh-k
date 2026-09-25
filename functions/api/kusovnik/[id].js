// /api/kusovnik/:id — uložený kusovník i s parametry, podle kterých vznikl.

import { json } from "../../../spolecne.js";
import { vyzadujPredplatne } from "../../../predplatne.js";
import { nactiKusovnik } from "../../../zakazky_data.js";

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ chyba: "Neplatný požadavek." }, 400);

  const kusovnik = await nactiKusovnik(env, data.uzivatel.id, id);
  if (!kusovnik) return json({ chyba: "Kusovník jsme nenašli." }, 404);
  return json(kusovnik);
}

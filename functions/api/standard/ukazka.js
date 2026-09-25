// /api/standard/ukazka — co dané parametry udělají se vzorovou skříňkou
// 600 × 720 × 510.
//
// Existuje proto, aby obrazovka Standard ukazovala živý příklad, a přitom
// vzorce zůstaly na JEDNOM místě. Kdyby si je frontend počítal sám, měli
// bychom dvě implementace rozpadu — a ta, podle které truhlář objedná
// desky, by nemusela být ta, kterou vidí na displeji.
//
// Nic neukládá; jen počítá z toho, co přijde v těle požadavku.

import { json } from "../../../spolecne.js";
import { vyzadujPredplatne } from "../../../predplatne.js";
import { normalizujStandard, ukazkaStandardu } from "../../../rozpad.js";

export async function onRequestPost(context) {
  const { data, request } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const stop = vyzadujPredplatne(context);
  if (stop) return stop;

  let telo;
  try {
    telo = await request.json();
  } catch {
    return json({ chyba: "Neplatný požadavek." }, 400);
  }
  const standard = normalizujStandard(telo);
  return json({ standard, ukazka: ukazkaStandardu(standard) });
}

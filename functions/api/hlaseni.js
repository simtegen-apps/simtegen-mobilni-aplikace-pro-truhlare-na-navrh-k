// /api/hlaseni — schránka produktu pro PŘIHLÁŠENÉHO zákazníka.
//
// GET  → vlastní hlášení zákazníka, nejnovější nahoře, i s odpovědí firmy.
// POST → {text, kontext}: hlášení se uloží k účtu (aby zákazník viděl
//        odpověď v aplikaci) a zrcadlí se jako issue v repozitáři produktu.
//
// Repozitáře produktů jsou veřejné, takže text NIKDY neodchází čitelný:
// zrcadlení dělá zrcadliHlaseni() ze schranka_sifra.js, která ho zašifruje
// veřejným klíčem SimteGenu. Do issue nejde nic o účtu — jen číslo hlášení
// a šifrovaný blok. Bezpečnostní kontrola hlídá, že issue se štítkem
// „hlaseni“ nevzniká nikde jinde.
//
// Formulář na straně aplikace řídí web/simtegen.js (tlačítko .nahlasit-chybu),
// proto sem chodí i `kontext` — technika, která pomůže chybu najít: verze,
// obrazovka, velikost okna, prohlížeč a posledních pět chyb skriptu.
// Nic o člověku.
//
// Nehlídá se předplatným: nahlásit problém je právo, ne funkce. Omezeno
// na účet, aby zaseklé opakování nezaplavilo schránku.

import { json, ted } from "../../spolecne.js";
import { ocistiKontext, zrcadliHlaseni, MIN_DELKA, MAX_DELKA } from "../../schranka_sifra.js";

const MAX_ZA_HODINU = 5;

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);
  const radky = await env.DB.prepare(
    "SELECT id, text, stav, odpoved, vytvoreno, zmeneno FROM hlaseni " +
    "WHERE uzivatel_id = ? ORDER BY id DESC LIMIT 50"
  ).bind(data.uzivatel.id).all();
  return json({ hlaseni: radky.results });
}

export async function onRequestPost(context) {
  const { env, data, request } = context;
  if (!data.uzivatel) return json({ chyba: "Nejste přihlášeni." }, 401);

  let telo;
  try {
    telo = await request.json();
  } catch {
    return json({ chyba: "Neplatný požadavek." }, 400);
  }
  const text = String((telo && telo.text) || "").trim();
  if (text.length < MIN_DELKA) return json({ chyba: "Napište nám prosím, o co jde." }, 422);
  if (text.length > MAX_DELKA) {
    return json({ chyba: `Zpráva je moc dlouhá (max ${MAX_DELKA} znaků).` }, 422);
  }

  const nedavno = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM hlaseni WHERE uzivatel_id = ? AND vytvoreno > ?"
  ).bind(data.uzivatel.id, ted() - 3600).first();
  if (nedavno && nedavno.n >= MAX_ZA_HODINU) {
    return json({ chyba: "Za poslední hodinu jste poslali hodně zpráv — zkuste to prosím později." }, 429);
  }

  const vlozeno = await env.DB.prepare(
    "INSERT INTO hlaseni (uzivatel_id, text) VALUES (?, ?) RETURNING id, vytvoreno"
  ).bind(data.uzivatel.id, text).first();

  const cislo = await zrcadliHlaseni(env, `Hlášení #${vlozeno.id}`, {
    zdroj: "aplikace",
    hlaseni_id: vlozeno.id,
    text,
    kontext: ocistiKontext(telo.kontext),
  });
  if (cislo) {
    await env.DB.prepare(
      "UPDATE hlaseni SET issue_cislo = ? WHERE uzivatel_id = ? AND id = ?"
    ).bind(cislo, data.uzivatel.id, vlozeno.id).run();
  }
  return json({ id: vlozeno.id, stav: "nove", zrcadlo: Boolean(cislo) });
}

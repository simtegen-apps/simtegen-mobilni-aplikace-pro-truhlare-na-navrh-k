// Čtení a zápis zakázky jako JEDNOHO dokumentu (zakázka → místnosti,
// stěny → skříňky).
//
// Žije mimo functions/ jako spolecne.js a rozpad.js — pomocný modul pod
// functions/ by se stal routou.
//
// Proč dokument a ne dílčí endpointy: truhlář měří u zákazníka, kde signál
// bývá mizerný. Aplikace si drží celou zakázku v telefonu a ukládá ji
// najednou; částečné PATCH požadavky by znamenaly půlku zakázky na serveru
// a půlku v kapse. Uložení je proto „smaž a zapiš znovu“ celého dokumentu —
// nejde o velká data (kuchyň je pár desítek řádků). Zápis jde po dávkách
// (místnosti, stěny, skříňky) a atomický není: kdyby spadl uprostřed,
// telefon si zakázku drží celou a příští uložení ji přepíše znovu celou.

import { ted } from "./spolecne.js";
import { MEZE, VYCHOZI_STANDARD, normalizujStandard } from "./rozpad.js";
import { TYPY_SKRINEK } from "./web/kolize.js";

const TYPY = Object.keys(TYPY_SKRINEK);
const TYPY_OTVORU = ["okno", "dvere"];

export const MAX_STEN = 40;
export const MAX_MISTNOSTI = 8;
const MEZ_POLOHY_MM = 50000;
// D1 přijme v jedné dávce i stovky příkazů, ale menší dávky drží každý
// požadavek krátký a chyba v jednom řádku nespadne na celou kuchyň.
const VELIKOST_DAVKY = 50;

function cele(hodnota, vychozi) {
  const n = Math.round(Number(hodnota));
  return Number.isFinite(n) ? n : vychozi;
}

function vMezich(hodnota, klic, vychozi) {
  const n = cele(hodnota, vychozi);
  const mez = MEZE[klic];
  if (!mez) return n;
  return Math.min(mez[1], Math.max(mez[0], n));
}

function text(hodnota, maxDelka) {
  return String(hodnota ?? "").trim().slice(0, maxDelka);
}

export function ocistiOtvor(vstup) {
  return {
    typ: TYPY_OTVORU.includes(vstup?.typ) ? vstup.typ : "okno",
    odsazeni_mm: Math.max(0, cele(vstup?.odsazeni_mm, 0)),
    sirka_mm: Math.max(50, cele(vstup?.sirka_mm, 1000)),
    vyska_mm: Math.max(50, cele(vstup?.vyska_mm, 1400)),
    parapet_mm: Math.max(0, cele(vstup?.parapet_mm, 900)),
  };
}

export function ocistiMistnost(vstup, poradi) {
  const poloha = (hodnota) => Math.min(MEZ_POLOHY_MM, Math.max(-MEZ_POLOHY_MM, cele(hodnota, 0)));
  const otoceni = Math.round(cele(vstup?.otoceni, 0) / 90) * 90;
  return {
    poradi,
    nazev: text(vstup?.nazev, 60) || `Místnost ${poradi + 1}`,
    x_mm: poloha(vstup?.x_mm),
    y_mm: poloha(vstup?.y_mm),
    otoceni: ((otoceni % 360) + 360) % 360,
  };
}

export function ocistiStenu(vstup, poradi, pocetMistnosti = 1) {
  const otvory = Array.isArray(vstup?.otvory) ? vstup.otvory.slice(0, 20) : [];
  return {
    poradi,
    nazev: text(vstup?.nazev, 60) || `Stěna ${poradi + 1}`,
    delka_mm: vMezich(vstup?.delka_mm, "stena_delka_mm", 3600),
    vyska_mm: vMezich(vstup?.vyska_mm, "stena_vyska_mm", 2600),
    roh_vlevo: vstup?.roh_vlevo ? 1 : 0,
    roh_vpravo: vstup?.roh_vpravo ? 1 : 0,
    mistnost: Math.min(Math.max(1, pocetMistnosti) - 1, Math.max(0, cele(vstup?.mistnost, 0))),
    zatoceni: vstup?.zatoceni === "ven" ? "ven" : "dovnitr",
    otvory: otvory.map(ocistiOtvor),
  };
}

export function ocistiSkrinku(vstup, poradi) {
  return {
    poradi,
    typ: TYPY.includes(vstup?.typ) ? vstup.typ : "spodni",
    odsazeni_mm: Math.max(0, cele(vstup?.odsazeni_mm, 0)),
    sirka_mm: vMezich(vstup?.sirka_mm, "skrinka_sirka_mm", 600),
    vyska_mm: vMezich(vstup?.vyska_mm, "skrinka_vyska_mm", 720),
    hloubka_mm: vMezich(vstup?.hloubka_mm, "skrinka_hloubka_mm", 510),
    pocet_polic: Math.min(12, Math.max(0, cele(vstup?.pocet_polic, 0))),
    pocet_dvirek: Math.min(4, Math.max(0, cele(vstup?.pocet_dvirek, 0))),
    pocet_zasuvek: Math.min(8, Math.max(0, cele(vstup?.pocet_zasuvek, 0))),
    zasuvka_vyska_mm: vMezich(vstup?.zasuvka_vyska_mm, "zasuvka_vyska_mm", 140),
    zada_typ_prepis: vstup?.zada_typ_prepis === "drazka" || vstup?.zada_typ_prepis === "nasazena"
      ? vstup.zada_typ_prepis : "",
    material_id: vstup?.material_id ? cele(vstup.material_id, null) : null,
    poznamka: text(vstup?.poznamka, 300),
  };
}

/** Standard účtu; když ho zákazník ještě nemá, založí se výchozí. */
export async function zajistiStandard(env, uzivatelId) {
  const radek = await env.DB.prepare("SELECT * FROM standardy WHERE uzivatel_id = ?")
    .bind(uzivatelId).first();
  if (radek) return normalizujStandard(radek);
  // OR IGNORE: na účtu je unikátní index a dva souběžné požadavky (třeba
  // zakázka a materiály při startu) by se jinak přetahovaly o první zápis.
  await env.DB.prepare("INSERT OR IGNORE INTO standardy (uzivatel_id) VALUES (?)")
    .bind(uzivatelId).run();
  return normalizujStandard({ ...VYCHOZI_STANDARD });
}

export async function nactiMaterialy(env, uzivatelId) {
  const radky = await env.DB.prepare(
    "SELECT id, nazev, dekor_kod, tloustka_mm, vlakno, hrana_dekor FROM materialy "
    + "WHERE uzivatel_id = ? ORDER BY id"
  ).bind(uzivatelId).all();
  return radky.results || [];
}

/** Celá zakázka i se stěnami a skříňkami, nebo null, když patří někomu jinému. */
export async function nactiDokument(env, uzivatelId, zakazkaId) {
  const zakazka = await env.DB.prepare(
    "SELECT id, nazev, oznaceni_zakaznika, poznamka, stav, vytvoreno, zmeneno "
    + "FROM zakazky WHERE id = ? AND uzivatel_id = ?"
  ).bind(zakazkaId, uzivatelId).first();
  if (!zakazka) return null;

  const mistnosti = await nactiMistnosti(env, uzivatelId, zakazkaId);
  const indexMistnosti = new Map(mistnosti.map((m, i) => [m.id, i]));

  const steny = await env.DB.prepare(
    "SELECT id, poradi, nazev, delka_mm, vyska_mm, roh_vlevo, roh_vpravo, otvory_json, "
    + "mistnost_id, zatoceni FROM steny WHERE uzivatel_id = ? AND zakazka_id = ? "
    + "ORDER BY poradi, id"
  ).bind(uzivatelId, zakazkaId).all();
  const skrinky = await env.DB.prepare(
    "SELECT id, stena_id, poradi, typ, odsazeni_mm, sirka_mm, vyska_mm, hloubka_mm, "
    + "pocet_polic, pocet_dvirek, pocet_zasuvek, zasuvka_vyska_mm, zada_typ_prepis, "
    + "material_id, poznamka FROM skrinky WHERE uzivatel_id = ? AND zakazka_id = ? "
    + "ORDER BY poradi, id"
  ).bind(uzivatelId, zakazkaId).all();

  const podleSteny = new Map();
  for (const s of skrinky.results || []) {
    if (!podleSteny.has(s.stena_id)) podleSteny.set(s.stena_id, []);
    podleSteny.get(s.stena_id).push(s);
  }

  // Poslední kusovník: podle něj obrazovka zakázky pozná, jestli je číslo
  // dílů ještě platné, nebo jestli se zakázka od té doby změnila.
  const posledni = await env.DB.prepare(
    "SELECT id, pocet_dilu, odhad_desek, vytvoreno FROM kusovniky "
    + "WHERE uzivatel_id = ? AND zakazka_id = ? ORDER BY id DESC LIMIT 1"
  ).bind(uzivatelId, zakazkaId).first();

  return {
    zakazka,
    posledni_kusovnik: posledni || null,
    // Zakázka ještě bez stěn nemá místnost v databázi; aplikace ale vždy
    // pracuje aspoň s jednou, a ta se zapíše s prvním uložením.
    mistnosti: mistnosti.length ? mistnosti
      : [{ id: null, poradi: 0, nazev: "Místnost 1", x_mm: 0, y_mm: 0, otoceni: 0 }],
    steny: (steny.results || []).map((radek) => {
      const { mistnost_id: mistnostId, otvory_json: otvoryJson, ...stena } = radek;
      let otvory = [];
      try { otvory = JSON.parse(otvoryJson); } catch { otvory = []; }
      return {
        ...stena,
        mistnost: indexMistnosti.get(mistnostId) ?? 0,
        zatoceni: stena.zatoceni === "ven" ? "ven" : "dovnitr",
        otvory: Array.isArray(otvory) ? otvory : [],
        skrinky: podleSteny.get(stena.id) || [],
      };
    }),
  };
}

/** Místnosti zakázky v pořadí, jak je truhlář založil. */
export async function nactiMistnosti(env, uzivatelId, zakazkaId) {
  const radky = await env.DB.prepare(
    "SELECT id, poradi, nazev, x_mm, y_mm, otoceni FROM mistnosti "
    + "WHERE uzivatel_id = ? AND zakazka_id = ? ORDER BY poradi, id"
  ).bind(uzivatelId, zakazkaId).all();
  return radky.results || [];
}

async function poDavkach(env, prikazy) {
  for (let i = 0; i < prikazy.length; i += VELIKOST_DAVKY) {
    await env.DB.batch(prikazy.slice(i, i + VELIKOST_DAVKY));
  }
}

/** Uložený kusovník i se snímkem standardu, nebo null. */
export async function nactiKusovnik(env, uzivatelId, id) {
  const radek = await env.DB.prepare(
    "SELECT id, zakazka_id, nazev_zakazky, standard_snapshot_json, polozky_json, "
    + "varovani_json, pocet_dilu, plocha_cm2, odhad_desek, vytvoreno "
    + "FROM kusovniky WHERE id = ? AND uzivatel_id = ?"
  ).bind(id, uzivatelId).first();
  if (!radek) return null;
  const rozbal = (retezec, vychozi) => {
    try { return JSON.parse(retezec); } catch { return vychozi; }
  };
  return {
    id: radek.id,
    vytvoreno: radek.vytvoreno,
    zakazka: { id: radek.zakazka_id, nazev: radek.nazev_zakazky },
    standard: normalizujStandard(rozbal(radek.standard_snapshot_json, null)),
    polozky: rozbal(radek.polozky_json, []),
    varovani: rozbal(radek.varovani_json, []),
    souhrn: {
      pocet_dilu: radek.pocet_dilu,
      plocha_cm2: radek.plocha_cm2,
      odhad_desek: radek.odhad_desek,
    },
  };
}

/**
 * Přepíše místnosti, stěny a skříňky zakázky.
 *
 * Dokument bez seznamu místností (starší rozepsané měření v telefonu) se
 * uloží do jedné „Místnost 1“; o tom, jestli smí přepsat víc místností,
 * rozhoduje volající (PUT vrací 409, viz functions/api/zakazky/[id].js).
 */
export async function ulozDokument(env, uzivatelId, zakazkaId, dokument) {
  const vstupMistnosti = Array.isArray(dokument?.mistnosti) && dokument.mistnosti.length
    ? dokument.mistnosti.slice(0, MAX_MISTNOSTI) : [{}];
  const mistnosti = vstupMistnosti.map((m, i) => ocistiMistnost(m, i));
  const vstupSteny = Array.isArray(dokument?.steny) ? dokument.steny.slice(0, MAX_STEN) : [];
  const steny = vstupSteny.map((s, i) => ocistiStenu(s, i, mistnosti.length));

  await env.DB.batch([
    env.DB.prepare("DELETE FROM skrinky WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(uzivatelId, zakazkaId),
    env.DB.prepare("DELETE FROM steny WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(uzivatelId, zakazkaId),
    env.DB.prepare("DELETE FROM mistnosti WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(uzivatelId, zakazkaId),
  ]);

  // Místnosti napřed (kvůli mistnost_id u stěn), pak stěny (kvůli stena_id
  // u skříněk). Identity se dohledají jedním dotazem přes pořadí — pořadí
  // je v rámci zakázky jedinečné, protože ho právě teď určujeme my.
  await poDavkach(env, mistnosti.map((m) => env.DB.prepare(
    "INSERT INTO mistnosti (uzivatel_id, zakazka_id, poradi, nazev, x_mm, y_mm, otoceni) "
    + "VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(uzivatelId, zakazkaId, m.poradi, m.nazev, m.x_mm, m.y_mm, m.otoceni)));
  const idMistnosti = new Map((await nactiMistnosti(env, uzivatelId, zakazkaId))
    .map((m) => [m.poradi, m.id]));

  await poDavkach(env, steny.map((stena) => env.DB.prepare(
    "INSERT INTO steny (uzivatel_id, zakazka_id, poradi, nazev, delka_mm, vyska_mm, "
    + "roh_vlevo, roh_vpravo, otvory_json, mistnost_id, zatoceni) "
    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(uzivatelId, zakazkaId, stena.poradi, stena.nazev, stena.delka_mm,
    stena.vyska_mm, stena.roh_vlevo, stena.roh_vpravo, JSON.stringify(stena.otvory),
    idMistnosti.get(stena.mistnost) ?? null, stena.zatoceni)));
  const vlozene = await env.DB.prepare(
    "SELECT id, poradi FROM steny WHERE uzivatel_id = ? AND zakazka_id = ?"
  ).bind(uzivatelId, zakazkaId).all();
  const idSten = new Map((vlozene.results || []).map((s) => [s.poradi, s.id]));

  const prikazySkrinek = [];
  vstupSteny.forEach((vstup, i) => {
    const stenaId = idSten.get(i);
    if (!stenaId) return;
    const skrinky = Array.isArray(vstup?.skrinky) ? vstup.skrinky.slice(0, 40) : [];
    skrinky.forEach((vstupSkrinky, j) => {
      const s = ocistiSkrinku(vstupSkrinky, j);
      prikazySkrinek.push(env.DB.prepare(
        "INSERT INTO skrinky (uzivatel_id, zakazka_id, stena_id, poradi, typ, odsazeni_mm, "
        + "sirka_mm, vyska_mm, hloubka_mm, pocet_polic, pocet_dvirek, pocet_zasuvek, "
        + "zasuvka_vyska_mm, zada_typ_prepis, material_id, poznamka) "
        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(uzivatelId, zakazkaId, stenaId, s.poradi, s.typ, s.odsazeni_mm,
        s.sirka_mm, s.vyska_mm, s.hloubka_mm, s.pocet_polic, s.pocet_dvirek,
        s.pocet_zasuvek, s.zasuvka_vyska_mm, s.zada_typ_prepis, s.material_id, s.poznamka));
    });
  });
  await poDavkach(env, prikazySkrinek);

  await env.DB.prepare("UPDATE zakazky SET zmeneno = ? WHERE id = ? AND uzivatel_id = ?")
    .bind(ted(), zakazkaId, uzivatelId).run();
}

export { text as ocistiText, cele as celeCislo, vMezich };

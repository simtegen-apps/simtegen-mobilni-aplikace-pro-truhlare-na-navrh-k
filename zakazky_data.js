// Čtení a zápis zakázky jako JEDNOHO dokumentu (zakázka → stěny → skříňky).
//
// Žije mimo functions/ jako spolecne.js a rozpad.js — pomocný modul pod
// functions/ by se stal routou.
//
// Proč dokument a ne dílčí endpointy: truhlář měří u zákazníka, kde signál
// bývá mizerný. Aplikace si drží celou zakázku v telefonu a ukládá ji
// najednou; částečné PATCH požadavky by znamenaly půlku zakázky na serveru
// a půlku v kapse. Uložení je proto „smaž a zapiš znovu“ v jedné dávce —
// nejde o velká data (kuchyň je pár desítek řádků) a nemůže dopadnout
// napůl.

import { ted } from "./spolecne.js";
import { MEZE, VYCHOZI_STANDARD, normalizujStandard } from "./rozpad.js";

const TYPY = ["spodni", "horni", "vysoka", "rohova"];
const TYPY_OTVORU = ["okno", "dvere"];

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

export function ocistiStenu(vstup, poradi) {
  const otvory = Array.isArray(vstup?.otvory) ? vstup.otvory.slice(0, 20) : [];
  return {
    poradi,
    nazev: text(vstup?.nazev, 60) || `Stěna ${poradi + 1}`,
    delka_mm: vMezich(vstup?.delka_mm, "stena_delka_mm", 3600),
    vyska_mm: vMezich(vstup?.vyska_mm, "stena_vyska_mm", 2600),
    roh_vlevo: vstup?.roh_vlevo ? 1 : 0,
    roh_vpravo: vstup?.roh_vpravo ? 1 : 0,
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

  const steny = await env.DB.prepare(
    "SELECT id, poradi, nazev, delka_mm, vyska_mm, roh_vlevo, roh_vpravo, otvory_json "
    + "FROM steny WHERE uzivatel_id = ? AND zakazka_id = ? ORDER BY poradi, id"
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
    steny: (steny.results || []).map((stena) => {
      let otvory = [];
      try { otvory = JSON.parse(stena.otvory_json); } catch { otvory = []; }
      return {
        ...stena,
        otvory: Array.isArray(otvory) ? otvory : [],
        skrinky: podleSteny.get(stena.id) || [],
      };
    }),
  };
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

/** Přepíše stěny a skříňky zakázky jednou dávkou. */
export async function ulozDokument(env, uzivatelId, zakazkaId, dokument) {
  const steny = Array.isArray(dokument?.steny) ? dokument.steny.slice(0, 12) : [];
  const prikazy = [
    env.DB.prepare("DELETE FROM skrinky WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(uzivatelId, zakazkaId),
    env.DB.prepare("DELETE FROM steny WHERE uzivatel_id = ? AND zakazka_id = ?")
      .bind(uzivatelId, zakazkaId),
  ];
  await env.DB.batch(prikazy);

  // Stěny napřed, kvůli stena_id u skříněk. INSERT ... RETURNING id dá
  // identitu hned; skříněk je málo, takže sekvenční zápis je v pohodě.
  for (let i = 0; i < steny.length; i += 1) {
    const stena = ocistiStenu(steny[i], i);
    const vlozena = await env.DB.prepare(
      "INSERT INTO steny (uzivatel_id, zakazka_id, poradi, nazev, delka_mm, vyska_mm, "
      + "roh_vlevo, roh_vpravo, otvory_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
    ).bind(uzivatelId, zakazkaId, stena.poradi, stena.nazev, stena.delka_mm,
      stena.vyska_mm, stena.roh_vlevo, stena.roh_vpravo,
      JSON.stringify(stena.otvory)).first();

    const skrinky = Array.isArray(steny[i]?.skrinky) ? steny[i].skrinky.slice(0, 40) : [];
    const davka = skrinky.map((vstup, j) => {
      const s = ocistiSkrinku(vstup, j);
      return env.DB.prepare(
        "INSERT INTO skrinky (uzivatel_id, zakazka_id, stena_id, poradi, typ, odsazeni_mm, "
        + "sirka_mm, vyska_mm, hloubka_mm, pocet_polic, pocet_dvirek, pocet_zasuvek, "
        + "zasuvka_vyska_mm, zada_typ_prepis, material_id, poznamka) "
        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(uzivatelId, zakazkaId, vlozena.id, s.poradi, s.typ, s.odsazeni_mm,
        s.sirka_mm, s.vyska_mm, s.hloubka_mm, s.pocet_polic, s.pocet_dvirek,
        s.pocet_zasuvek, s.zasuvka_vyska_mm, s.zada_typ_prepis, s.material_id, s.poznamka);
    });
    if (davka.length) await env.DB.batch(davka);
  }

  await env.DB.prepare("UPDATE zakazky SET zmeneno = ? WHERE id = ? AND uzivatel_id = ?")
    .bind(ted(), zakazkaId, uzivatelId).run();
}

export { text as ocistiText, cele as celeCislo, vMezich };

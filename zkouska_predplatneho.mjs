// Zkouška předplatného: co se stane, když předplatné vyprší.
//
// Spouští se ručně: `node zkouska_predplatneho.mjs` (Node 22+, jako
// zkouska_rozpadu.mjs). Akceptační testy (uat_kontrola.py) běží jen s čerstvými
// účty A a B — vypršelé předplatné přes API nastavit nejde. Tady se proto
// pouštějí SKUTEČNÉ handlery produktových rout s falešnou databází, ve které
// má účet plati_do v minulosti, a ověří se akceptační scénář ze specifikace:
//
//   Truhlář s vypršeným předplatným — zkusí uložit zakázku — dostane 402
//   „Předplatné vypršelo“, ale stažení vlastních dat přes /api/ucet/export
//   mu dál projde.
//
// Vypíše OK/CHYBA u každého kroku a skončí nenulovým kódem při první chybě.

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { ZKUSEBNI_DNI, stavPredplatneho, vyzadujPredplatne } from "./predplatne.js";

const DEN = 86400;
const nyni = () => Math.floor(Date.now() / 1000);
let chyb = 0;

function over(nazev, podminka, detail = "") {
  console.log(`${podminka ? "OK   " : "CHYBA"} ${nazev}${podminka ? "" : ` — ${detail}`}`);
  if (!podminka) chyb += 1;
}

/** Falešná D1: na každý dotaz odpoví podle začátku SQL. Jen čtení. */
function falesnaDb(ucet) {
  const odpoved = (sql) => {
    if (sql.includes("FROM uzivatele u") && sql.includes("LEFT JOIN predplatne")) {
      return { first: { vytvoreno: ucet.vytvoreno, plati_do: ucet.plati_do }, all: [] };
    }
    if (sql.includes("FROM sqlite_master")) {
      return { first: null, all: [{ name: "predplatne" }, { name: "zakazky" }] };
    }
    if (sql.startsWith("PRAGMA table_info")) {
      return { first: null, all: [{ name: "uzivatel_id" }] };
    }
    if (sql.startsWith("SELECT email, vytvoreno FROM uzivatele")) {
      return { first: { email: "vyprselo@example.cz", vytvoreno: ucet.vytvoreno }, all: [] };
    }
    if (sql.startsWith('SELECT * FROM "predplatne"')) {
      return { first: null, all: [{ uzivatel_id: 1, plati_do: ucet.plati_do, poznamka: "zkouška" }] };
    }
    if (sql.startsWith("SELECT * FROM")) return { first: null, all: [] };
    // Cokoli jiného (zápis zakázky, výpočet kusovníku) by znamenalo, že
    // handler pustil vypršelý účet dál.
    throw new Error(`neočekávaný dotaz: ${sql.slice(0, 60)}`);
  };
  return {
    prepare(sql) {
      const o = odpoved(sql);
      const prikaz = {
        bind: () => prikaz,
        first: async () => o.first,
        all: async () => ({ results: o.all }),
        run: async () => ({ success: true }),
      };
      return prikaz;
    },
  };
}

async function kontext(ucet, metoda, cesta, telo, params = {}) {
  const env = { DB: falesnaDb(ucet) };
  const uzivatel = { id: 1, email: "vyprselo@example.cz" };
  return {
    env,
    params,
    request: new Request(`http://localhost${cesta}`, {
      method: metoda,
      headers: telo ? { "Content-Type": "application/json" } : {},
      body: telo ? JSON.stringify(telo) : undefined,
    }),
    data: { uzivatel, predplatne: await stavPredplatneho(env, uzivatel) },
  };
}

const modul = (cesta) => import(pathToFileURL(resolve(cesta)).href);

// ── 1. Stav účtu ───────────────────────────────────────────────────────
const vyprsely = { vytvoreno: nyni() - 60 * DEN, plati_do: nyni() - 5 * DEN };
const stav = await stavPredplatneho({ DB: falesnaDb(vyprsely) }, { id: 1 });
over("plati_do v minulosti → stav vyprselo", stav.stav === "vyprselo", JSON.stringify(stav));

const novy = await stavPredplatneho({ DB: falesnaDb({ vytvoreno: nyni(), plati_do: null }) }, { id: 1 });
over(`nový účet → zkusebni, ${ZKUSEBNI_DNI} dní`, novy.stav === "zkusebni" && novy.dni_zbyva === 14,
  JSON.stringify(novy));

// Účet z doby 30denní zkušební doby, kterému migrace 0010 zapsala její konec.
const prechod = await stavPredplatneho({ DB: falesnaDb({
  vytvoreno: nyni() - 20 * DEN, plati_do: nyni() - 20 * DEN + 30 * DEN }) }, { id: 1 });
over("účet po migraci 0010 → aktivni, 10 dní", prechod.stav === "aktivni" && prechod.dni_zbyva === 10,
  JSON.stringify(prechod));

const zastaveni = vyzadujPredplatne({ data: { predplatne: stav } });
over("vyzadujPredplatne → 402", zastaveni && zastaveni.status === 402,
  zastaveni ? String(zastaveni.status) : "null");
over("text „Předplatné vypršelo.“",
  zastaveni && (await zastaveni.json()).chyba === "Předplatné vypršelo.", "jiný text");
over("platný účet projde (null)", vyzadujPredplatne({ data: { predplatne: novy } }) === null, "zastaven");

// ── 2. Produktové routy s vypršelým účtem ──────────────────────────────
const zakazka = { zakazka: { nazev: "Zkouška vypršení" }, steny: [] };
const routy = [
  ["POST /api/zakazky (založit zakázku)", "functions/api/zakazky.js", "onRequestPost",
    "POST", "/api/zakazky", { nazev: "Zkouška vypršení" }, {}],
  ["PUT /api/zakazky/7 (uložit zakázku)", "functions/api/zakazky/[id].js", "onRequestPut",
    "PUT", "/api/zakazky/7", zakazka, { id: "7" }],
  ["POST /api/kusovnik (vygenerovat kusovník)", "functions/api/kusovnik.js", "onRequestPost",
    "POST", "/api/kusovnik", { zakazka_id: 7 }, {}],
  ["PUT /api/standard (uložit standard)", "functions/api/standard.js", "onRequestPut",
    "PUT", "/api/standard", { tloustka_mm: 18 }, {}],
];
for (const [nazev, soubor, funkce, metoda, cesta, telo, params] of routy) {
  try {
    const handler = (await modul(soubor))[funkce];
    const odpoved = await handler(await kontext(vyprsely, metoda, cesta, telo, params));
    over(`${nazev} → 402`, odpoved.status === 402, `přišlo ${odpoved.status}`);
  } catch (e) {
    over(`${nazev} → 402`, false, e.message);
  }
}

// ── 3. Práva zákazníka nevyprší ────────────────────────────────────────
try {
  const { onRequestGet } = await modul("functions/api/ucet/export.js");
  const odpoved = await onRequestGet(await kontext(vyprsely, "GET", "/api/ucet/export"));
  const telo = await odpoved.json();
  over("GET /api/ucet/export s vypršelým předplatným → 200", odpoved.status === 200,
    `přišlo ${odpoved.status}`);
  over("export obsahuje tabulku predplatne", Array.isArray(telo.data && telo.data.predplatne),
    JSON.stringify(telo).slice(0, 80));
} catch (e) {
  over("GET /api/ucet/export s vypršelým předplatným → 200", false, e.message);
}

try {
  const { onRequestGet } = await modul("functions/api/ja.js");
  const odpoved = await onRequestGet(await kontext(vyprsely, "GET", "/api/ja"));
  const telo = await odpoved.json();
  over("GET /api/ja ukáže stav vyprselo", odpoved.status === 200 && telo.predplatne.stav === "vyprselo",
    JSON.stringify(telo).slice(0, 80));
} catch (e) {
  over("GET /api/ja ukáže stav vyprselo", false, e.message);
}

console.log(chyb ? `\n${chyb} chyb.` : "\nVšechno sedí.");
process.exit(chyb ? 1 : 0);

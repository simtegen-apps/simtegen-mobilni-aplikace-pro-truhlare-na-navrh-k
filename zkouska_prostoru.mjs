// Zkouška geometrie prostoru proti číslům ze schválené specifikace.
//
// Spouští se ručně: `node zkouska_prostoru.mjs` (vzor zkouska_rozpadu.mjs).
// Není součástí CI a nic nenasazuje. Půdorys je kontrola měření — když
// řekne „sedí“ tam, kde nesedí, truhlář objedná desky podle špatné stěny.
//
// Vypíše OK/CHYBA u každé kontroly a skončí nenulovým kódem, jakmile
// jediná nesedí. Potřebuje Node 22+.

import {
  obrysMistnosti, prichytni, prichytniUsek, volnoVeSpodniRade, sloucitPoUlozeni,
  normalizujDokument, prichytniRoh, rohyMistnosti,
} from "./web/prostor.js";

let chyb = 0;
function over(nazev, skutecne, ocekavane) {
  const ok = JSON.stringify(skutecne) === JSON.stringify(ocekavane);
  if (!ok) chyb += 1;
  console.log(`${ok ? "OK   " : "CHYBA"} ${nazev}: ${JSON.stringify(skutecne)}`
    + (ok ? "" : ` (čekáno ${JSON.stringify(ocekavane)})`));
}

const stena = (delka_mm, zatoceni = "dovnitr") => ({ delka_mm, vyska_mm: 2600, zatoceni });
const mistnost = { nazev: "Kuchyň", x_mm: 0, y_mm: 0, otoceni: 0 };

// 1) Obdélník 3600 × 2800: sedí, plocha 10,08 m².
const obdelnik = obrysMistnosti(mistnost, [stena(3600), stena(2800), stena(3600), stena(2800)]);
over("obdélník — stav", obdelnik.stav, "sedi");
over("obdélník — odchylka", obdelnik.odchylka_mm, 0);
over("obdélník — plocha m²", obdelnik.plocha_m2, 10.08);

// 2) Tři stěny 3600/2800/3565: chybí stěna 2800, odchylka 35 mm.
const tri = obrysMistnosti(mistnost, [stena(3600), stena(2800), stena(3565)]);
over("tři stěny — stav", tri.stav, "chybi");
over("tři stěny — chybějící stěna", tri.chybejici_mm, 2800);
over("tři stěny — odchylka", tri.odchylka_mm, 35);

// 3) Po dopočtu čtvrté stěny je odchylka pořád 35 mm (3565 místo 3600)…
const ctyri = obrysMistnosti(mistnost, [stena(3600), stena(2800), stena(3565), stena(2800)]);
over("dopočtená stěna — stav", ctyri.stav, "odchylka");
over("dopočtená stěna — odchylka", ctyri.odchylka_mm, 35);

// 4) Dvě stěny: otevřený půdorys, žádná vymyšlená plocha.
const dve = obrysMistnosti(mistnost, [stena(3600), stena(2800)]);
over("dvě stěny — stav", dve.stav, "otevreny");
over("dvě stěny — plocha", dve.plocha_m2, 0);

// 5) Místnost tvaru L (obdélník 4000 × 3000 bez rohu 1500 × 1500): na konci
//    třetí stěny se zatáčí ven.
const el = obrysMistnosti(mistnost, [
  stena(4000), stena(1500), stena(1500, "ven"), stena(1500), stena(2500), stena(3000),
]);
over("L — stav", el.stav, "sedi");
over("L — plocha m² (4×3 − 1,5×1,5)", el.plocha_m2, 9.75);

// 6) Otočená a posunutá místnost má stejnou plochu.
const otocena = obrysMistnosti({ x_mm: 5000, y_mm: 1000, otoceni: 90 },
  [stena(3600), stena(2800), stena(3600), stena(2800)]);
over("otočená — plocha", otocena.plocha_m2, 10.08);
over("otočená — první stěna jde dolů", otocena.zdi[0].B, [5000, 4600]);

// 7) Přichytávání: 1213 je 27 mm od hrany okna 1240 → sedne na ni;
//    1300 nemá hranu do 30 mm → zaokrouhlí se na 10 mm.
over("přichycení k hraně okna", prichytni(1213, [0, 1240, 3600]), 1240);
over("bez hrany — krok 10 mm", prichytni(1304, [0, 1240, 3600]), 1300);
over("úsek pravou hranou k oknu", prichytniUsek(620, 600, [0, 1240, 3600]), 640);

// 8) Volné místo ve spodní řadě: 3000 − skříňky 0–900 (dvě po 600 s překryvem
//    300) − dveře 800 = 1300; horní skříňka a okno nic neberou.
over("volné ve spodní řadě", volnoVeSpodniRade({
  delka_mm: 3000,
  otvory: [{ typ: "dvere", odsazeni_mm: 2200, sirka_mm: 800 },
    { typ: "okno", odsazeni_mm: 1200, sirka_mm: 800 }],
  skrinky: [
    { typ: "spodni", odsazeni_mm: 0, sirka_mm: 600 },
    { typ: "spodni", odsazeni_mm: 300, sirka_mm: 600 },
    { typ: "horni", odsazeni_mm: 1000, sirka_mm: 600 },
  ],
}), 1300);

// 9) Sloučení po uložení nesmí přepsat okno přidané během letu požadavku.
const lokalni = normalizujDokument({
  zakazka: { id: 7, nazev: "Ukázka", zmeneno: 100 },
  steny: [{ nazev: "Stěna A", delka_mm: 3600, vyska_mm: 2600, otvory: [], skrinky: [{ sirka_mm: 600 }] }],
});
const odeslano = JSON.parse(JSON.stringify(lokalni));
lokalni.steny[0].otvory.push({ typ: "okno", odsazeni_mm: 1200, sirka_mm: 1200, vyska_mm: 1400, parapet_mm: 900 });
const odpoved = { ...odeslano, zakazka: { ...odeslano.zakazka, zmeneno: 200 }, posledni_kusovnik: null };
sloucitPoUlozeni(lokalni, odpoved);
over("sloučení — okno zůstalo", lokalni.steny[0].otvory.length, 1);
over("sloučení — skříňka zůstala", lokalni.steny[0].skrinky.length, 1);
over("sloučení — čas změny ze serveru", lokalni.zakazka.zmeneno, 200);

// 10) Starý koncept bez místností dostane „Místnost 1“.
over("starý koncept", normalizujDokument({ steny: [{}] }).mistnosti.map((m) => m.nazev), ["Místnost 1"]);

// 11) Spíž 80 mm od rohu kuchyně se přichytí roh na roh.
const kuchyn = rohyMistnosti(mistnost, [stena(3600), stena(2800), stena(3600), stena(2800)]);
const spiz = rohyMistnosti({ x_mm: 3680, y_mm: 0, otoceni: 0 }, [stena(1500), stena(1200), stena(1500), stena(1200)]);
over("přichycení místnosti", prichytniRoh(spiz, kuchyn), [-80, 0]);

if (chyb) {
  console.log(`\n${chyb}× CHYBA — geometrie prostoru se nesmí vydat.`);
  process.exit(1);
}
console.log("\nVšechno sedí.");

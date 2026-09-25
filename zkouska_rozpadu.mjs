// Zkouška rozpadu proti číslům ze schválené specifikace.
//
// Spouští se ručně: `node zkouska_rozpadu.mjs`. Není součástí CI a nic
// nenasazuje — existuje proto, že chybný rozměr stojí truhláře desku,
// takže vzorce musí jít ověřit jedním příkazem, ne čtením kódu.
//
// Vypíše OK/CHYBA u každého očekávaného dílu a skončí nenulovým kódem,
// jakmile jediné číslo nesedí.
//
// Potřebuje Node 22+ (moduly v repu jsou ESM v souborech .js a repozitář
// nemá package.json — novější Node si typ modulu rozpozná sám).

import {
  normalizujStandard, normalizujMaterial, rozpadSkrinky, kusovnikZakazky,
} from "./rozpad.js";

const standard = normalizujStandard(null);
const ltd = normalizujMaterial({ id: 1, nazev: "LTD 18 bílá", tloustka_mm: 18, vlakno: 0 });
const hdf = normalizujMaterial({ nazev: "Záda 3 mm", tloustka_mm: 3, vlakno: 0 });

const skrinka = {
  typ: "spodni", sirka_mm: 600, vyska_mm: 720, hloubka_mm: 510,
  pocet_polic: 1, pocet_dvirek: 1, pocet_zasuvek: 0, material_id: 1, odsazeni_mm: 0,
};

// Specifikace: skříňka 600 × 720 × 510 musí dát přesně těchto 8 kusů.
const OCEKAVANO = [
  ["Bok", 2, 510, 720],
  ["Dno", 1, 564, 510],
  ["Traverza", 2, 564, 100],
  ["Police", 1, 564, 490],
  ["Záda (do drážky)", 1, 580, 700],
  ["Dvířka", 1, 597, 717],
];

let chyb = 0;
const dily = rozpadSkrinky(skrinka, standard, ltd, hdf);
console.log("Skříňka 600 × 720 × 510, výchozí standard:");
for (const [nazev, ks, a, b] of OCEKAVANO) {
  const d = dily.find((x) => x.nazev === nazev);
  const sedi = d && d.ks === ks && d.a_mm === a && d.b_mm === b;
  if (!sedi) chyb += 1;
  console.log(`  ${sedi ? "OK   " : "CHYBA"} ${nazev} ${ks}x ${a} x ${b}`
    + (d ? `  (spočítáno ${d.ks}x ${d.a_mm} x ${d.b_mm}, řez ${d.delka_mm} x ${d.sirka_mm})`
         : "  (díl vůbec nevznikl)"));
}

const kusu = dily.reduce((soucet, d) => soucet + d.ks, 0);
if (kusu !== 8) chyb += 1;
console.log(`  ${kusu === 8 ? "OK   " : "CHYBA"} celkem 8 kusů (spočítáno ${kusu})`);
if (dily.length !== OCEKAVANO.length) {
  chyb += 1;
  console.log(`  CHYBA vznikly navíc díly: ${dily.map((d) => d.nazev).join(", ")}`);
}

// Kolize: skříňka pod oknem s parapetem 900 do něj nezasahuje, horní ano.
const dokument = {
  steny: [{
    nazev: "Stěna A", delka_mm: 3600, vyska_mm: 2600, roh_vlevo: 0, roh_vpravo: 0,
    otvory: [{ typ: "okno", odsazeni_mm: 1200, sirka_mm: 1200, vyska_mm: 1400, parapet_mm: 900 }],
    skrinky: [
      { ...skrinka, odsazeni_mm: 1200 },
      { typ: "horni", odsazeni_mm: 1200, sirka_mm: 600, vyska_mm: 720, hloubka_mm: 320,
        pocet_polic: 1, pocet_dvirek: 1, pocet_zasuvek: 0, material_id: 1 },
    ],
  }],
};
const kusovnik = kusovnikZakazky(dokument, standard, [
  { id: 1, nazev: "LTD 18 bílá", tloustka_mm: 18, vlakno: 0 },
]);
const doOkna = kusovnik.varovani.filter((v) => v.includes("zasahuje do okna"));
const kolizeOk = doOkna.length === 1;
if (!kolizeOk) chyb += 1;
console.log(`\nKontrola kolizí:\n  ${kolizeOk ? "OK   " : "CHYBA"} `
  + `horní skříňka nad parapetem 900 mm hlásí zásah do okna (hlášek: ${doOkna.length})`);
for (const v of kusovnik.varovani) console.log("    ·", v);

console.log(`\nSouhrn zakázky: ${kusovnik.souhrn.pocet_dilu} dílů, `
  + `odhad ${kusovnik.souhrn.odhad_desek} desek, `
  + `${(kusovnik.souhrn.plocha_cm2 / 10000).toFixed(2)} m².`);

console.log(chyb ? `\nNESEDÍ ${chyb} kontrol.` : "\nVšechno sedí.");
process.exit(chyb ? 1 : 0);

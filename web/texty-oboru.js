// Slova oboru anglicky: díly kusovníku, typy skříněk, olepení hran a hlášky
// kontroly stěny.
//
// PROČ TENHLE SOUBOR LEŽÍ VE web/ A PROČ NENÍ V texty.js
//
// Ze stejného důvodu jako kolize.js: anglický kusovník musí na obrazovce
// a v CSV, které stáhne server, vypadat stejně. Kdyby měl prohlížeč svůj
// slovník a server svůj, „Side panel“ v aplikaci a „Side“ v souboru pro
// nářezové centrum by se dřív nebo později rozešly. Server (rozpad.js) si
// modul naimportuje relativní cestou z kořene repozitáře.
//
// Kusovník se UKLÁDÁ česky — je to záznam i se snímkem standardu, ne text
// obrazovky — a překládá se až při zobrazení a při stažení. Proto jsou tu
// vzory českých vět z kolize.js a rozpad.js. Věta, kterou žádný vzor
// nezná, projde beze změny: lepší česká věta než prázdné místo.
//
// Čisté ESM bez závislostí a bez jediného volání ven.

export const TYPY_SKRINEK_EN = {
  spodni: "Base",
  horni: "Wall",
  vysoka: "Tall",
  rohova: "Corner",
};

// Klíčem je název dílu, jak ho píše rozpad.js — tak jde přeložit i starší
// uložený kusovník a ukázka standardu, která klíč dílu nenese.
const DILY_EN = {
  "Bok": "Side panel",
  "Dno": "Bottom",
  "Víko": "Top",
  "Traverza": "Rail",
  "Police": "Shelf",
  "Záda (do drážky)": "Back panel (in groove)",
  "Záda (nasazená)": "Back panel (overlaid)",
  "Čelo zásuvky": "Drawer front",
  "Dvířka": "Door",
};

const TYPY_V_POPISU_EN = {
  "spodní": "base",
  "horní": "wall",
  "vysoká": "tall",
  "rohová": "corner",
  "skříňka": "cabinet",
};

/** Název dílu („Bok“ → „Side panel“). */
export function dilEn(nazev) {
  return DILY_EN[nazev] || String(nazev ?? "");
}

/** Desetinná čárka v rozměru → tečka („0,8 mm“ → „0.8 mm“). */
export function desetinnaTecka(text) {
  return String(text ?? "").replace(/(\d),(\d)/g, "$1.$2");
}

/** Popis olepení z rozpad.js („přední hrana 0,8 mm“ → „front edge 0.8 mm“). */
export function hranyEn(popis) {
  return desetinnaTecka(popis)
    .replace("přední hrana bez olepení", "no edging")
    .replace("kolem dokola bez olepení", "no edging")
    .replace("přední hrana ", "front edge ")
    .replace("kolem dokola ", "all round ")
    .replace("bez olepení", "no edging");
}

/**
 * Materiál. Přeloží se jen to, co pojmenovává aplikace sama (záda); název
 * desky si truhlář zapsal sám a je to jeho obsah.
 */
export function materialEn(nazev) {
  return String(nazev ?? "").replace(/^Záda (\d+) mm$/, "Back panel $1 mm");
}

/** Popis skříňky z kolize.js („1. spodní 600×720×510“ → „1. base 600×720×510“). */
export function skrinkyEn(text) {
  return String(text ?? "").replace(
    /(\d+\. )?(spodní|horní|vysoká|rohová|skříňka) (\d+×\d+×\d+)/g,
    (cele, poradi, typ, rozmer) => `${poradi || ""}${TYPY_V_POPISU_EN[typ]} ${rozmer}`
  );
}

// Konce vět z kolize.js. Začátek věty je štítek „<stěna> · <skříňka>“ —
// stěnu pojmenoval truhlář, skříňku přeloží skrinkyEn.
const VZORY_HLASEK = [
  [/: přesahuje délku stěny o (\d+) mm\.$/, ": runs past the end of the wall by $1 mm."],
  [/: sahá výš než stěna o (\d+) mm\.$/, ": is $1 mm taller than the wall."],
  [/: zasahuje do okna \(otvor od (\d+) mm, šířka (\d+) mm\)\.$/,
    ": overlaps the window (opening from $1 mm, width $2 mm)."],
  [/: zasahuje do dveří \(otvor od (\d+) mm, šířka (\d+) mm\)\.$/,
    ": overlaps the door (opening from $1 mm, width $2 mm)."],
  [/: začíná v rohu — sousední stěna si bere prvních (\d+) mm \(hloubka korpusu\)\.$/,
    ": starts in the corner — the adjoining wall takes the first $1 mm (carcass depth)."],
  [/: končí v rohu — sousední stěna si bere posledních (\d+) mm \(hloubka korpusu\)\.$/,
    ": ends in the corner — the adjoining wall takes the last $1 mm (carcass depth)."],
  [/ a (\d+\. \S+ \d+×\d+×\d+) se překrývají\.$/, " and $1 overlap."],
];

/** Hláška kontroly stěny nebo kusovníku → anglicky; neznámá projde beze změny. */
export function hlaskaEn(text) {
  const veta = String(text ?? "");
  const deska = veta.match(/^Díl (.+) se nevejde na formát desky (\d+) × (\d+) mm\.$/);
  if (deska) return `${dilEn(deska[1])} does not fit on a ${deska[2]} × ${deska[3]} mm board.`;
  let vysledek = veta;
  for (const [vzor, anglicky] of VZORY_HLASEK) vysledek = vysledek.replace(vzor, anglicky);
  return skrinkyEn(vysledek);
}

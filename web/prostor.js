// Geometrie prostoru: půdorys místností, kontrola, jestli se naměřené stěny
// sejdou, přichytávání při posunu ve výkresu a sloučení zakázky po uložení.
//
// Leží ve web/ ze stejného důvodu jako kolize.js: počítá se v telefonu
// u zákazníka (bez signálu, při každém pohybu prstu) a zároveň to musí jít
// ověřit jedním příkazem bez prohlížeče (`node zkouska_prostoru.mjs`).
// Čisté ESM bez závislostí a bez jediného volání ven.
//
// Souřadnice půdorysu jsou milimetry jako ve výkresu SVG: x doprava,
// y DOLŮ. Místnost se obchází tak, že vnitřek leží vpravo od směru chůze;
// „dovnitř“ je proto otočka doprava, „ven“ doleva (vnější roh místnosti
// tvaru L).

import { celeCislo, otvorySteny, svislyRozsah } from "./kolize.js";

export const TOLERANCE_UZAVRENI_MM = 10;
export const TLOUSTKA_ZDI_MM = 120;
export const MAX_MISTNOSTI = 8;

// Mezera menší než tohle je chyba měření, ne chybějící stěna.
const NEJKRATSI_CHYBEJICI_MM = 200;
// Chybějící stěnu dopočítáme, jen když mezera vede (skoro) po ose — jinak
// by chyběly dvě stěny a jedno číslo by lhalo.
const NEJVETSI_ODCHYLKA_CHYBEJICI_MM = 300;

const SMERY = { 0: [1, 0], 90: [0, 1], 180: [-1, 0], 270: [0, -1] };

export function normalizujOtoceni(hodnota) {
  const n = Math.round(celeCislo(hodnota, 0) / 90) * 90;
  return ((n % 360) + 360) % 360;
}

const dovnitr = ([dx, dy]) => [-dy, dx];
const ven = ([dx, dy]) => [dy, -dx];

/**
 * Doplní dokument zakázky do tvaru, se kterým počítá aplikace: aspoň jedna
 * místnost, každá stěna ví, do které patří, a jak se na jejím konci zatáčí.
 * Starší rozepsané měření v telefonu (bez místností) tak jde dál.
 */
export function normalizujDokument(dokument) {
  if (!dokument) return dokument;
  if (!Array.isArray(dokument.steny)) dokument.steny = [];
  if (!Array.isArray(dokument.mistnosti) || !dokument.mistnosti.length) {
    dokument.mistnosti = [{ nazev: "Místnost 1", x_mm: 0, y_mm: 0, otoceni: 0 }];
  }
  for (const m of dokument.mistnosti) {
    m.nazev = String(m.nazev || "").trim() || "Místnost";
    m.x_mm = celeCislo(m.x_mm, 0);
    m.y_mm = celeCislo(m.y_mm, 0);
    m.otoceni = normalizujOtoceni(m.otoceni);
  }
  const posledni = dokument.mistnosti.length - 1;
  for (const s of dokument.steny) {
    s.mistnost = Math.min(posledni, Math.max(0, celeCislo(s.mistnost, 0)));
    s.zatoceni = s.zatoceni === "ven" ? "ven" : "dovnitr";
    if (!Array.isArray(s.otvory)) s.otvory = otvorySteny(s);
    if (!Array.isArray(s.skrinky)) s.skrinky = [];
  }
  return dokument;
}

/** Stěny jedné místnosti v pořadí obcházení, i s indexem v celé zakázce. */
export function stenyMistnosti(dokument, mistnostIndex) {
  return (dokument.steny || [])
    .map((stena, index) => ({ stena, index }))
    .filter((x) => celeCislo(x.stena.mistnost, 0) === mistnostIndex);
}

/**
 * Obrys jedné místnosti v půdorysu. Stěny se skládají za sebou a na konci
 * každé se zatočí o 90° (dovnitř nebo ven). Vrací úsečky zdí a výsledek
 * kontroly měření:
 *
 *   stav "sedi"      — konec poslední stěny se sejde se začátkem první
 *                      (do 10 mm); má plochu v m²
 *   stav "chybi"     — po ose chybí jedna stěna; `chybejici_mm` je její
 *                      délka a `odchylka_mm` to, o co se mezera odchyluje
 *   stav "odchylka"  — stěny jsou všechny, ale nesejdou se o `odchylka_mm`
 *   stav "otevreny"  — méně než tři stěny, nebo chybí víc než jedna
 *   stav "prazdna"   — žádná stěna
 */
export function obrysMistnosti(mistnost, steny) {
  const m = mistnost || {};
  let smer = SMERY[normalizujOtoceni(m.otoceni)];
  const start = [celeCislo(m.x_mm, 0), celeCislo(m.y_mm, 0)];
  let bod = start;
  const zdi = [];
  const body = [start];

  for (const polozka of steny || []) {
    const stena = polozka.stena || polozka;
    const index = polozka.stena ? polozka.index : zdi.length;
    const delka = Math.max(1, celeCislo(stena.delka_mm, 0));
    const [dx, dy] = smer;
    const konec = [bod[0] + dx * delka, bod[1] + dy * delka];
    zdi.push({
      index, stena, delka,
      A: bod, B: konec,
      d: smer,
      n: [-dy, dx],   // normála do místnosti
      zatoceni: stena.zatoceni === "ven" ? "ven" : "dovnitr",
    });
    body.push(konec);
    bod = konec;
    smer = stena.zatoceni === "ven" ? ven(smer) : dovnitr(smer);
  }

  const vysledek = {
    zdi, body, start, konec: bod, smerDalsi: smer,
    stav: "prazdna", odchylka_mm: 0, chybejici_mm: 0, plocha_m2: 0,
  };
  if (!zdi.length) return vysledek;

  const mezera = [start[0] - bod[0], start[1] - bod[1]];
  const vzdalenost = Math.hypot(mezera[0], mezera[1]);
  const poOse = mezera[0] * smer[0] + mezera[1] * smer[1];
  const napric = Math.abs(mezera[0] * smer[1] - mezera[1] * smer[0]);

  if (zdi.length >= 3 && vzdalenost <= TOLERANCE_UZAVRENI_MM) {
    vysledek.stav = "sedi";
    vysledek.odchylka_mm = Math.round(vzdalenost);
    vysledek.plocha_m2 = plochaMnohouhelniku(body.slice(0, -1));
  } else if (zdi.length >= 3 && poOse > NEJKRATSI_CHYBEJICI_MM
      && napric <= NEJVETSI_ODCHYLKA_CHYBEJICI_MM) {
    vysledek.stav = "chybi";
    vysledek.chybejici_mm = Math.round(poOse);
    vysledek.odchylka_mm = Math.round(napric);
  } else if (zdi.length >= 3 && poOse <= NEJKRATSI_CHYBEJICI_MM) {
    vysledek.stav = "odchylka";
    vysledek.odchylka_mm = Math.round(vzdalenost);
  } else {
    vysledek.stav = "otevreny";
  }
  return vysledek;
}

/** Plocha mnohoúhelníku v m² na dvě desetinná místa (vzorec tkaničky). */
export function plochaMnohouhelniku(body) {
  let dvojnasobek = 0;
  for (let i = 0; i < body.length; i += 1) {
    const [x1, y1] = body[i];
    const [x2, y2] = body[(i + 1) % body.length];
    dvojnasobek += x1 * y2 - x2 * y1;
  }
  return Math.round(Math.abs(dvojnasobek) / 2 / 10000) / 100;
}

/**
 * Hodnota po posunu prstem: když je do `tolerance` mm nějaká hrana, sedne
 * na ni; jinak se zaokrouhlí na `krok`. Prst na telefonu má rozlišení
 * kolem 10 mm stěny, takže bez tohohle by nic nesedlo na milimetr.
 */
export function prichytni(hodnota, kandidati, krok = 10, tolerance = 30) {
  let nejlepsi = null;
  let nejmensi = tolerance + 1;
  for (const k of kandidati || []) {
    const d = Math.abs(k - hodnota);
    if (d <= tolerance && d < nejmensi) { nejlepsi = k; nejmensi = d; }
  }
  return nejlepsi !== null ? nejlepsi : Math.round(hodnota / krok) * krok;
}

/** Totéž pro úsek (skříňka, okno): přichytává se levá i pravá hrana. */
export function prichytniUsek(levy, sirka, kandidati, krok = 10, tolerance = 30) {
  let nejlepsi = null;
  let nejmensi = tolerance + 1;
  for (const k of kandidati || []) {
    const dl = Math.abs(k - levy);
    if (dl <= tolerance && dl < nejmensi) { nejlepsi = k; nejmensi = dl; }
    const dp = Math.abs(k - (levy + sirka));
    if (dp <= tolerance && dp < nejmensi) { nejlepsi = k - sirka; nejmensi = dp; }
  }
  return nejlepsi !== null ? nejlepsi : Math.round(levy / krok) * krok;
}

function usekOtvoru(o) {
  const x1 = celeCislo(o.odsazeni_mm, 0);
  return [x1, x1 + celeCislo(o.sirka_mm, 0)];
}

function usekSkrinky(s) {
  const x1 = celeCislo(s.odsazeni_mm, 0);
  return [x1, x1 + celeCislo(s.sirka_mm, 0)];
}

/**
 * Svislé hrany, na které se dá přichytit: oba konce stěny, okna, dveře
 * a skříňky — kromě toho, čím se právě hýbe.
 */
export function hranyNaStene(stena, druh, index) {
  const hrany = [0, celeCislo(stena.delka_mm, 0)];
  otvorySteny(stena).forEach((o, i) => {
    if (druh === "otvor" && i === index) return;
    hrany.push(...usekOtvoru(o));
  });
  (stena.skrinky || []).forEach((s, i) => {
    if (druh === "skrinka" && i === index) return;
    hrany.push(...usekSkrinky(s));
  });
  return hrany;
}

/**
 * Kolik místa zbývá ve spodní řadě: délka stěny mínus spodní, vysoké
 * a rohové skříňky a dveře. Překryvy se nepočítají dvakrát.
 */
export function volnoVeSpodniRade(stena) {
  const delka = Math.max(0, celeCislo(stena.delka_mm, 0));
  const useky = [];
  for (const s of stena.skrinky || []) {
    if (s.typ === "horni") continue;
    useky.push(usekSkrinky(s));
  }
  for (const o of otvorySteny(stena)) {
    if (o.typ === "dvere") useky.push(usekOtvoru(o));
  }
  const orezane = useky
    .map(([a, b]) => [Math.max(0, a), Math.min(delka, b)])
    .filter(([a, b]) => b > a)
    .sort((p, q) => p[0] - q[0]);
  let zabrano = 0;
  let konec = 0;
  for (const [a, b] of orezane) {
    if (b <= konec) continue;
    zabrano += b - Math.max(a, konec);
    konec = b;
  }
  return delka - zabrano;
}

const mm = (n) => Math.round(n).toLocaleString("cs-CZ");

/**
 * Kóty k právě posouvanému prvku — mono řádek pod výkresem, třeba
 * „od kraje 1 250 · k oknu 40 · k sousedce 0 mm“.
 */
export function kotyPrvku(stena, druh, index, standard) {
  const delka = celeCislo(stena.delka_mm, 0);
  if (druh === "delka") {
    return `délka ${mm(delka)} · volné ve spodní řadě ${mm(volnoVeSpodniRade(stena))} mm`;
  }
  if (druh === "vyska") return `výška ${mm(celeCislo(stena.vyska_mm, 0))} mm`;

  const otvory = otvorySteny(stena);
  if (druh === "otvor") {
    const o = otvory[index];
    if (!o) return "";
    const [x1, x2] = usekOtvoru(o);
    const casti = [`od kraje ${mm(x1)}`];
    if (o.typ !== "dvere") casti.push(`parapet ${mm(celeCislo(o.parapet_mm, 0))}`);
    casti.push(`do konce stěny ${mm(delka - x2)}`);
    return `${casti.join(" · ")} mm`;
  }

  const s = (stena.skrinky || [])[index];
  if (!s) return "";
  const [x1, x2] = usekSkrinky(s);
  const casti = [`od kraje ${mm(x1)}`];

  let kOtvoru = null;
  for (const o of otvory) {
    const [ox1, ox2] = usekOtvoru(o);
    const mezera = Math.max(ox1 - x2, x1 - ox2);
    if (mezera < 0) {
      kOtvoru = o.typ === "dvere" ? "přes dveře" : "pod oknem";
      break;
    }
    if (kOtvoru === null || mezera < kOtvoru.mezera) kOtvoru = { mezera, typ: o.typ };
  }
  if (typeof kOtvoru === "string") casti.push(kOtvoru);
  else if (kOtvoru) casti.push(`${kOtvoru.typ === "dvere" ? "ke dveřím" : "k oknu"} ${mm(kOtvoru.mezera)}`);

  const [y1, y2] = svislyRozsah(s, standard);
  let kSousedce = null;
  (stena.skrinky || []).forEach((b, i) => {
    if (i === index) return;
    const [by1, by2] = svislyRozsah(b, standard);
    if (!(y1 < by2 && y2 > by1)) return;
    const [bx1, bx2] = usekSkrinky(b);
    const mezera = Math.max(bx1 - x2, x1 - bx2);
    if (kSousedce === null || mezera < kSousedce) kSousedce = mezera;
  });
  if (kSousedce !== null) {
    casti.push(kSousedce < 0 ? `překryv se sousedkou ${mm(-kSousedce)}` : `k sousedce ${mm(kSousedce)}`);
  }
  return `${casti.join(" · ")} mm`;
}

/**
 * Po uložení na server: z odpovědi se převezme JEN to, co zná jen server
 * (čas změny, poslední kusovník). Stěny, okna a skříňky v telefonu zůstanou
 * — mezitím je truhlář mohl změnit a obrazovka na ně drží odkazy. Přesně
 * výměna celého dokumentu za odpověď byla příčinou chyby „Uloženo, ale
 * okno tam není“.
 */
export function sloucitPoUlozeni(lokalni, odpoved) {
  if (!lokalni || !odpoved) return lokalni;
  if (odpoved.zakazka && lokalni.zakazka) {
    lokalni.zakazka.zmeneno = odpoved.zakazka.zmeneno;
    if (odpoved.zakazka.id) lokalni.zakazka.id = odpoved.zakazka.id;
  }
  if ("posledni_kusovnik" in odpoved) lokalni.posledni_kusovnik = odpoved.posledni_kusovnik;
  return lokalni;
}

/** Rohy místnosti v půdorysu — pro přichytávání místností k sobě. */
export function rohyMistnosti(mistnost, steny) {
  return obrysMistnosti(mistnost, steny).body;
}

/**
 * Posun místnosti tak, aby se některý její roh přichytil k rohu jiné
 * místnosti (do `tolerance` mm). Vrací [dx, dy] k přičtení, nebo null.
 */
export function prichytniRoh(rohy, ostatniRohy, tolerance = 150) {
  let nejlepsi = null;
  let nejmensi = tolerance + 1;
  for (const [x, y] of rohy) {
    for (const [ox, oy] of ostatniRohy) {
      const d = Math.hypot(ox - x, oy - y);
      if (d <= tolerance && d < nejmensi) { nejlepsi = [ox - x, oy - y]; nejmensi = d; }
    }
  }
  return nejlepsi;
}

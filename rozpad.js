// Rozpad skříňky na díly — jádro produktu.
//
// Žije MIMO functions/, stejně jako spolecne.js: všechno pod functions/ je
// kandidát na routu a pomocný modul, který začne odpovídat na HTTP, je
// chyba, kterou nikdo nehledá.
//
// Počítá se na serveru, ne v prohlížeči: je to placená funkce (routa je
// za vyzadujPredplatne) a výsledek se ukládá i se snímkem parametrů.
//
// PRAVIDLA, KTERÁ TENHLE SOUBOR DRŽÍ
//
// 1. Všechno jsou CELÁ ČÍSLA V MILIMETRECH. Spáry a tloušťky hran chodí
//    v desetinách milimetru (1,5 mm = 15), protože jinak by 600 − 2×1,5
//    skončilo jako 596,9999999 a truhlář by objednal špatný rozměr.
// 2. Každý díl si nese GEOMETRICKÝ pár a_mm × b_mm (jak díl leží ve
//    skříňce: a = vodorovně, b = svisle nebo do hloubky) a z něj se teprve
//    odvodí délka × šířka pro nářezové centrum podle směru vlákna. Díky
//    tomu je v aplikaci vidět „bok 510 × 720“ (hloubka × výška), jak to
//    truhlář čte, a v CSV „720 × 510“ s vláknem po délce, jak to čte pila.
// 3. Olepení hran se udává na stranách geometrického páru. Hrana na svislé
//    straně ubírá z šířky a, hrana na vodorovné straně z výšky b — proto
//    se „rozměr po olepení“ nedá spočítat bez toho, aby se vědělo, KTERÁ
//    hrana se olepuje.

// Geometrie stěny (svislý rozsah skříňky, kolize, popis skříňky) je ve
// web/kolize.js — jedna implementace pro prohlížeč i pro server, viz
// komentář v tom souboru.
import { popisSkrinky, zkontrolujStenu } from "./web/kolize.js";

export const VYCHOZI_STANDARD = {
  nazev: "Můj standard",
  tloustka_mm: 18,
  zada_tloustka_mm: 3,
  zada_typ: "drazka",
  drazka_hloubka_mm: 8,
  drazka_odsazeni_mm: 10,
  odskok_police_mm: 20,
  spara_okraj_desetiny: 15,
  spara_mezi_desetiny: 30,
  traverzy_spodni: 1,
  traverza_sirka_mm: 100,
  sokl_mm: 100,
  vyska_horni_mm: 1450,
  hrana_pohledova_desetiny: 20,
  hrana_ostatni_desetiny: 8,
  rozmer_s_olepenim: 0,
  prorez_mm: 4,
  deska_x_mm: 2800,
  deska_y_mm: 2070,
};

// Meze jsou úmyslně široké — nechceme truhláři říkat, co smí postavit,
// chceme chytit překlep o řád (6000 místo 600).
export const MEZE = {
  tloustka_mm: [8, 40],
  zada_tloustka_mm: [3, 20],
  drazka_hloubka_mm: [0, 20],
  drazka_odsazeni_mm: [0, 50],
  odskok_police_mm: [0, 100],
  spara_okraj_desetiny: [0, 100],
  spara_mezi_desetiny: [0, 100],
  traverza_sirka_mm: [40, 300],
  sokl_mm: [0, 300],
  vyska_horni_mm: [0, 2500],
  hrana_pohledova_desetiny: [0, 50],
  hrana_ostatni_desetiny: [0, 50],
  prorez_mm: [0, 20],
  deska_x_mm: [500, 5600],
  deska_y_mm: [500, 2500],
  skrinka_sirka_mm: [100, 1400],
  skrinka_vyska_mm: [100, 2600],
  skrinka_hloubka_mm: [100, 900],
  zasuvka_vyska_mm: [50, 600],
  stena_delka_mm: [200, 20000],
  stena_vyska_mm: [500, 5000],
};

const VYCHOZI_MATERIAL = {
  id: null,
  nazev: "LTD 18 mm",
  dekor_kod: "",
  tloustka_mm: 18,
  vlakno: 0,
  hrana_dekor: "",
};

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

/** Řádek z databáze (nebo nic) → kompletní standard s čísly, ne řetězci. */
export function normalizujStandard(radek) {
  const s = { ...VYCHOZI_STANDARD };
  if (!radek) return s;
  for (const klic of Object.keys(VYCHOZI_STANDARD)) {
    if (radek[klic] === undefined || radek[klic] === null) continue;
    if (klic === "nazev" || klic === "zada_typ") {
      s[klic] = String(radek[klic]);
    } else {
      s[klic] = vMezich(radek[klic], klic, VYCHOZI_STANDARD[klic]);
    }
  }
  s.zada_typ = s.zada_typ === "nasazena" ? "nasazena" : "drazka";
  // Přepínače: chybějící klíč znamená „nech výchozí“, ne „vypni“. Neúplný
  // snímek standardu by jinak tiše přepnul traverzy na plná víka.
  if (radek.traverzy_spodni !== undefined) s.traverzy_spodni = radek.traverzy_spodni ? 1 : 0;
  if (radek.rozmer_s_olepenim !== undefined) s.rozmer_s_olepenim = radek.rozmer_s_olepenim ? 1 : 0;
  return s;
}

export function normalizujMaterial(radek) {
  if (!radek) return { ...VYCHOZI_MATERIAL };
  return {
    id: radek.id ?? null,
    nazev: String(radek.nazev || VYCHOZI_MATERIAL.nazev),
    dekor_kod: String(radek.dekor_kod || ""),
    tloustka_mm: cele(radek.tloustka_mm, 18),
    vlakno: radek.vlakno ? 1 : 0,
    hrana_dekor: String(radek.hrana_dekor || ""),
  };
}

function desetinyText(desetiny) {
  if (!desetiny) return "bez olepení";
  const cele_ = Math.floor(desetiny / 10);
  const zbytek = desetiny % 10;
  return (zbytek ? `${cele_},${zbytek}` : String(cele_)) + " mm";
}

/**
 * Jeden díl. Vstup je geometrický (a = vodorovně, b = svisle/do hloubky),
 * hrany jsou na stranách toho obdélníku. Výstup nese obojí: co se ukáže
 * truhláři i co se pošle do nářezového centra.
 */
function dil(vstup, standard, material) {
  const hrany = {
    vlevo: vstup.hrany?.vlevo || 0,
    vpravo: vstup.hrany?.vpravo || 0,
    nahore: vstup.hrany?.nahore || 0,
    dole: vstup.hrany?.dole || 0,
  };
  let a = Math.round(vstup.a_mm);
  let b = Math.round(vstup.b_mm);
  if (standard.rozmer_s_olepenim) {
    // Zadaný rozměr je hotový díl VČETNĚ hrany → řez musí být menší.
    a -= Math.round((hrany.vlevo + hrany.vpravo) / 10);
    b -= Math.round((hrany.nahore + hrany.dole) / 10);
  }

  const maVlakno = material.vlakno && vstup.smer !== "nezalezi";
  let smer = maVlakno ? vstup.smer : "nezalezi";
  let delka_mm;
  let sirka_mm;
  let hrana_delka_1;
  let hrana_delka_2;
  let hrana_sirka_1;
  let hrana_sirka_2;
  if (smer === "svisle" || (smer === "nezalezi" && b >= a)) {
    delka_mm = b;
    sirka_mm = a;
    hrana_delka_1 = hrany.vlevo;
    hrana_delka_2 = hrany.vpravo;
    hrana_sirka_1 = hrany.nahore;
    hrana_sirka_2 = hrany.dole;
  } else {
    delka_mm = a;
    sirka_mm = b;
    hrana_delka_1 = hrany.nahore;
    hrana_delka_2 = hrany.dole;
    hrana_sirka_1 = hrany.vlevo;
    hrana_sirka_2 = hrany.vpravo;
  }

  return {
    klic: vstup.klic,
    nazev: vstup.nazev,
    a_mm: a,
    b_mm: b,
    delka_mm,
    sirka_mm,
    smer,
    vlakno: smer === "nezalezi" ? 0 : 1,
    ks: vstup.ks,
    material: material.nazev,
    material_id: material.id,
    tloustka_mm: vstup.tloustka_mm ?? material.tloustka_mm,
    hrany: {
      delka_1: hrana_delka_1,
      delka_2: hrana_delka_2,
      sirka_1: hrana_sirka_1,
      sirka_2: hrana_sirka_2,
    },
    hrany_popis: vstup.hrany_popis || "bez olepení",
    skrinky: [],
  };
}

/**
 * Rozpad jedné skříňky. Vzorce jsou tady pohromadě schválně — kdo je chce
 * ověřit, čte jednu obrazovku, ne šest souborů.
 */
export function rozpadSkrinky(skrinka, standard, material, materialZad) {
  const t = standard.tloustka_mm;
  const S = cele(skrinka.sirka_mm, 600);
  const V = cele(skrinka.vyska_mm, 720);
  const H = cele(skrinka.hloubka_mm, 510);
  // Dvě tloušťky hrany, každá tam, kam patří:
  //   hp = pohledová — to, co je vidět při zavřených dvířkách: dvířka,
  //        čela zásuvek a přední hrana boku (ta kouká ve spáře a bere
  //        nárazy dvířek, proto na ní bývá silnější ABS),
  //   ho = ostatní  — přední hrany vnitřních vodorovných dílů (dno, víko,
  //        police), které jsou vidět až po otevření.
  const hp = standard.hrana_pohledova_desetiny;
  const ho = standard.hrana_ostatni_desetiny;
  const svetlost = S - 2 * t;
  const dily = [];

  // ── Korpus ────────────────────────────────────────────────────────
  dily.push(dil({
    klic: "bok", nazev: "Bok", ks: 2,
    a_mm: H, b_mm: V, smer: "svisle",
    hrany: { vlevo: hp },
    hrany_popis: `přední hrana ${desetinyText(hp)}`,
  }, standard, material));

  dily.push(dil({
    klic: "dno", nazev: "Dno", ks: 1,
    a_mm: svetlost, b_mm: H, smer: "vodorovne",
    hrany: { dole: ho },
    hrany_popis: `přední hrana ${desetinyText(ho)}`,
  }, standard, material));

  const traverzy = skrinka.typ === "spodni" && standard.traverzy_spodni;
  if (traverzy) {
    dily.push(dil({
      klic: "traverza", nazev: "Traverza", ks: 2,
      a_mm: svetlost, b_mm: standard.traverza_sirka_mm, smer: "vodorovne",
      hrany_popis: "bez olepení",
    }, standard, material));
  } else {
    dily.push(dil({
      klic: "viko", nazev: "Víko", ks: 1,
      a_mm: svetlost, b_mm: H, smer: "vodorovne",
      hrany: { dole: ho },
      hrany_popis: `přední hrana ${desetinyText(ho)}`,
    }, standard, material));
  }

  const police = Math.max(0, cele(skrinka.pocet_polic, 0));
  if (police > 0) {
    dily.push(dil({
      klic: "police", nazev: "Police", ks: police,
      a_mm: svetlost, b_mm: H - standard.odskok_police_mm, smer: "vodorovne",
      hrany: { dole: ho },
      hrany_popis: `přední hrana ${desetinyText(ho)}`,
    }, standard, material));
  }

  // ── Záda ──────────────────────────────────────────────────────────
  const zadaTyp = skrinka.zada_typ_prepis === "drazka" || skrinka.zada_typ_prepis === "nasazena"
    ? skrinka.zada_typ_prepis
    : standard.zada_typ;
  const d = standard.drazka_hloubka_mm;
  const zadaA = zadaTyp === "drazka" ? S - 2 * t + 2 * d : S;
  const zadaB = zadaTyp === "drazka" ? V - 2 * t + 2 * d : V;
  dily.push(dil({
    klic: "zada", nazev: zadaTyp === "drazka" ? "Záda (do drážky)" : "Záda (nasazená)",
    ks: 1, a_mm: zadaA, b_mm: zadaB, smer: "nezalezi",
    tloustka_mm: standard.zada_tloustka_mm,
    hrany_popis: "bez olepení",
  }, standard, materialZad));

  // ── Čela: dvířka a zásuvky ────────────────────────────────────────
  // Pohledová plocha je celý korpus zmenšený o spáru po obvodu; zásuvky
  // sedí nahoře (klasická spodní skříňka: zásuvka nad dvířky), dvířka
  // doberou zbytek.
  const so = standard.spara_okraj_desetiny;
  const sm = standard.spara_mezi_desetiny;
  const celaSirka = Math.round(S - (2 * so) / 10);
  const celaVyska = Math.round(V - (2 * so) / 10);
  const pocetZasuvek = Math.max(0, cele(skrinka.pocet_zasuvek, 0));
  const pocetDvirek = Math.max(0, cele(skrinka.pocet_dvirek, 0));
  const hranyCela = { vlevo: hp, vpravo: hp, nahore: hp, dole: hp };
  const popisCela = `kolem dokola ${desetinyText(hp)}`;

  let vyskaProDvirka = celaVyska;
  if (pocetZasuvek > 0) {
    let vyskaZasuvky;
    if (pocetDvirek > 0) {
      vyskaZasuvky = vMezich(skrinka.zasuvka_vyska_mm, "zasuvka_vyska_mm", 140);
      vyskaProDvirka = Math.round(celaVyska - pocetZasuvek * (vyskaZasuvky + sm / 10));
    } else {
      vyskaZasuvky = Math.round((celaVyska - ((pocetZasuvek - 1) * sm) / 10) / pocetZasuvek);
      vyskaProDvirka = 0;
    }
    if (vyskaZasuvky > 0) {
      dily.push(dil({
        klic: "celo", nazev: "Čelo zásuvky", ks: pocetZasuvek,
        a_mm: celaSirka, b_mm: vyskaZasuvky, smer: "vodorovne",
        hrany: hranyCela, hrany_popis: popisCela,
      }, standard, material));
    }
  }

  if (pocetDvirek > 0 && vyskaProDvirka > 0) {
    const sirkaDvirek = Math.round(
      (celaSirka - ((pocetDvirek - 1) * sm) / 10) / pocetDvirek
    );
    dily.push(dil({
      klic: "dvirka", nazev: "Dvířka", ks: pocetDvirek,
      a_mm: sirkaDvirek, b_mm: vyskaProDvirka, smer: "svisle",
      hrany: hranyCela, hrany_popis: popisCela,
    }, standard, material));
  }

  return dily.filter((x) => x.ks > 0 && x.a_mm > 0 && x.b_mm > 0);
}

function klicDilu(d) {
  return [d.nazev, d.a_mm, d.b_mm, d.material, d.tloustka_mm,
    d.hrany.delka_1, d.hrany.delka_2, d.hrany.sirka_1, d.hrany.sirka_2].join("|");
}

const PORADI_DILU = ["bok", "dno", "viko", "traverza", "police", "zada", "celo", "dvirka"];

/**
 * Celá zakázka → kusovník. Vstup je dokument (stěny se skříňkami), ne
 * databáze — díky tomu se dá spočítat i náhled nad neuloženými daty.
 */
export function kusovnikZakazky(dokument, standard, materialy) {
  const mapaMaterialu = new Map();
  for (const m of materialy || []) mapaMaterialu.set(Number(m.id), normalizujMaterial(m));
  const vychozi = normalizujMaterial({ ...VYCHOZI_MATERIAL, tloustka_mm: standard.tloustka_mm,
    nazev: `LTD ${standard.tloustka_mm} mm` });
  const materialZad = normalizujMaterial({
    nazev: `Záda ${standard.zada_tloustka_mm} mm`,
    tloustka_mm: standard.zada_tloustka_mm,
    vlakno: 0,
  });

  const slouceno = new Map();
  const varovani = [];
  let pocetSkrinek = 0;

  for (const stena of dokument.steny || []) {
    const skrinky = stena.skrinky || [];
    for (const v of zkontrolujStenu(stena, skrinky, standard).hlasky) varovani.push(v);
    skrinky.forEach((skrinka, index) => {
      pocetSkrinek += 1;
      const material = mapaMaterialu.get(Number(skrinka.material_id)) || vychozi;
      const stitek = `${stena.nazev || "Stěna"} · ${popisSkrinky(skrinka, index)}`;
      for (const d of rozpadSkrinky(skrinka, standard, material, materialZad)) {
        const klic = klicDilu(d);
        const stavajici = slouceno.get(klic);
        if (stavajici) {
          stavajici.ks += d.ks;
          if (!stavajici.skrinky.includes(stitek)) stavajici.skrinky.push(stitek);
        } else {
          d.skrinky = [stitek];
          slouceno.set(klic, d);
        }
      }
    });
  }

  const polozky = [...slouceno.values()].sort((a, b) =>
    a.material.localeCompare(b.material, "cs")
    || PORADI_DILU.indexOf(a.klic) - PORADI_DILU.indexOf(b.klic)
    || b.delka_mm - a.delka_mm
    || b.sirka_mm - a.sirka_mm);

  let pocetDilu = 0;
  let plochaCm2 = 0;
  for (const p of polozky) {
    pocetDilu += p.ks;
    plochaCm2 += Math.round((p.delka_mm * p.sirka_mm) / 100) * p.ks;
  }
  const odhad = odhadDesek(polozky, standard);
  if (odhad.nevejde.length) {
    for (const n of odhad.nevejde) {
      varovani.push(`Díl ${n} se nevejde na formát desky ${standard.deska_x_mm} × ${standard.deska_y_mm} mm.`);
    }
  }

  return {
    polozky,
    varovani,
    souhrn: {
      pocet_skrinek: pocetSkrinek,
      pocet_dilu: pocetDilu,
      plocha_cm2: plochaCm2,
      odhad_desek: odhad.desek,
      desky_podle_materialu: odhad.podle,
    },
  };
}

/**
 * Odhad počtu desek — pásové skládání (nejvyšší díl první, first fit).
 * NENÍ to nářezový plán: nářezové centrum si optimalizuje po svém a
 * skoro vždy vyjde líp. Slouží k tomu, aby truhlář u zákazníka věděl,
 * jestli mluví o třech nebo o deseti deskách.
 */
export function odhadDesek(polozky, standard) {
  const skupiny = new Map();
  const nevejde = [];
  for (const p of polozky) {
    const klic = `${p.material} · ${p.tloustka_mm} mm`;
    if (!skupiny.has(klic)) skupiny.set(klic, []);
    const kusy = skupiny.get(klic);
    for (let i = 0; i < p.ks; i += 1) {
      kusy.push({ d: p.delka_mm, s: p.sirka_mm, otocit: p.smer === "nezalezi", nazev: p.nazev });
    }
  }

  const podle = [];
  let celkem = 0;
  for (const [klic, kusy] of skupiny) {
    const W = standard.deska_x_mm;
    const H = standard.deska_y_mm;
    const k = standard.prorez_mm;
    const pripravene = [];
    for (const kus of kusy) {
      let w = kus.d;
      let h = kus.s;
      if (kus.otocit && h > w) { const pomocna = w; w = h; h = pomocna; }
      if (w > W || h > H) {
        if (kus.otocit && h <= W && w <= H) { const pomocna = w; w = h; h = pomocna; }
        else { if (!nevejde.includes(kus.nazev)) nevejde.push(kus.nazev); continue; }
      }
      pripravene.push({ w, h });
    }
    pripravene.sort((a, b) => b.h - a.h || b.w - a.w);

    const desky = [];
    for (const kus of pripravene) {
      let umisteno = false;
      for (const deska of desky) {
        for (const pas of deska.pasy) {
          if (pas.vyska >= kus.h && pas.volne >= kus.w + k) {
            pas.volne -= kus.w + k;
            umisteno = true;
            break;
          }
        }
        if (umisteno) break;
        if (deska.zbytek >= kus.h + k) {
          deska.pasy.push({ vyska: kus.h, volne: W - kus.w - k });
          deska.zbytek -= kus.h + k;
          umisteno = true;
          break;
        }
      }
      if (!umisteno) {
        desky.push({ pasy: [{ vyska: kus.h, volne: W - kus.w - k }], zbytek: H - kus.h - k });
      }
    }
    podle.push({ material: klic, desek: desky.length });
    celkem += desky.length;
  }
  return { desek: celkem, podle, nevejde };
}

/**
 * Ukázkový rozpad pro obrazovku Standard — ať je vidět, co parametry dělají.
 * Vrací rozebrané položky, ne slepenou větu: obrazovka je skládá do seznamu
 * (název, počet kusů, rozměr) a nemusí větu zase rozebírat zpátky.
 */
export function ukazkaStandardu(standard) {
  const material = normalizujMaterial({ nazev: "ukázka", tloustka_mm: standard.tloustka_mm, vlakno: 0 });
  const zada = normalizujMaterial({ nazev: "záda", tloustka_mm: standard.zada_tloustka_mm, vlakno: 0 });
  const dily = rozpadSkrinky(
    { typ: "spodni", sirka_mm: 600, vyska_mm: 720, hloubka_mm: 510,
      pocet_polic: 1, pocet_dvirek: 1, pocet_zasuvek: 0 },
    standard, material, zada
  );
  return dily.map((d) => ({
    nazev: d.nazev,
    ks: d.ks,
    rozmer: `${d.a_mm} × ${d.b_mm}`,
    hrany: d.hrany_popis,
  }));
}

const CSV_HLAVICKA = [
  "material", "dil", "delka_mm", "sirka_mm", "ks", "tloustka_mm", "vlakno",
  "hrana_delka_1_mm", "hrana_delka_2_mm", "hrana_sirka_1_mm", "hrana_sirka_2_mm",
  "olepeni", "skrinky",
];

function csvPole(hodnota) {
  const text = String(hodnota ?? "");
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV pro nářezové centrum. Oddělovač je středník a soubor začíná BOM,
 * aby se v českém Excelu otevřel rovnou ve sloupcích a s háčky.
 */
export function csvKusovniku(kusovnik, zakazka, standard) {
  const radky = [];
  radky.push(`# Kusovník — ${zakazka.nazev}`);
  radky.push(`# Rozměry jsou v mm, ${standard.rozmer_s_olepenim
    ? "uvedené rozměry jsou HOTOVÉ DÍLY po olepení (řez je už zmenšený)"
    : "uvedené rozměry jsou ŘEZ bez olepení"}. Prořez ${standard.prorez_mm} mm.`);
  radky.push("# Rozměry před odesláním do nářezového centra zkontrolujte.");
  radky.push(CSV_HLAVICKA.join(";"));
  for (const p of kusovnik.polozky) {
    radky.push([
      p.material, p.nazev, p.delka_mm, p.sirka_mm, p.ks, p.tloustka_mm,
      p.vlakno ? "po délce" : "nezáleží",
      (p.hrany.delka_1 / 10).toFixed(1).replace(".", ","),
      (p.hrany.delka_2 / 10).toFixed(1).replace(".", ","),
      (p.hrany.sirka_1 / 10).toFixed(1).replace(".", ","),
      (p.hrany.sirka_2 / 10).toFixed(1).replace(".", ","),
      p.hrany_popis, p.skrinky.join(" + "),
    ].map(csvPole).join(";"));
  }
  return "﻿" + radky.join("\r\n") + "\r\n";
}

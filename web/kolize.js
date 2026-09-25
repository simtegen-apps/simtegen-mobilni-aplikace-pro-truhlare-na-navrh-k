// Geometrie skříňky na stěně: kde skříňka začíná a končí a co s čím koliduje.
//
// PROČ TENHLE SOUBOR LEŽÍ VE web/, KDYŽ HO POUŽÍVÁ I SERVER
//
// Pravidla kolizí potřebují obě strany: prohlížeč je kreslí u zákazníka
// hned při každé změně rozměru (bez signálu a bez čekání na odpověď) a
// server je zapisuje jako varování do uloženého kusovníku. Kdyby existovala
// dvě implementace, varování na obrazovce Stěna a varování v objednaném
// kusovníku by se dřív nebo později rozešla — a to je přesně ten druh
// rozporu, kvůli kterému truhlář objedná špatnou desku.
//
// Jedna implementace tedy musí umět obojí. Nasazuje se jen web/, takže
// modul musí ležet tady, aby ho stáhl prohlížeč; server (functions/ přes
// rozpad.js) si ho naimportuje relativní cestou z kořene repozitáře.
// Je to čisté ESM bez závislostí a bez jediného volání ven.

export const TYPY_SKRINEK = {
  spodni: "Spodní",
  horni: "Horní",
  vysoka: "Vysoká",
  rohova: "Rohová",
};

export function celeCislo(hodnota, vychozi) {
  const n = Math.round(Number(hodnota));
  return Number.isFinite(n) ? n : vychozi;
}

export function popisSkrinky(skrinka, poradi) {
  const typ = TYPY_SKRINEK[skrinka.typ] || "Skříňka";
  const cislo = poradi === undefined ? "" : `${poradi + 1}. `;
  return `${cislo}${typ.toLowerCase()} ${skrinka.sirka_mm}×${skrinka.vyska_mm}×${skrinka.hloubka_mm}`;
}

/**
 * Svislý rozsah skříňky nad podlahou [od, do] v mm. Chybějící standard
 * spadne na výchozí hodnoty — kresba na obrazovce se kvůli nenačtenému
 * standardu nesmí rozbít.
 */
export function svislyRozsah(skrinka, standard) {
  const s = standard || {};
  if (skrinka.typ === "horni") {
    const dole = celeCislo(s.vyska_horni_mm, 1450);
    return [dole, dole + celeCislo(skrinka.vyska_mm, 720)];
  }
  const dole = celeCislo(s.sokl_mm, 100);
  return [dole, dole + celeCislo(skrinka.vyska_mm, 720)];
}

/** Otvory umí přijít jako pole i jako JSON z databáze. */
export function otvorySteny(stena) {
  let otvory = stena.otvory;
  if (typeof otvory === "string") {
    try { otvory = JSON.parse(otvory); } catch { otvory = []; }
  }
  return Array.isArray(otvory) ? otvory : [];
}

/**
 * Kontrola jedné stěny — to, co truhláři u zákazníka ušetří výjezd navíc:
 * skříňka přes okno, přes délku stěny, přes sousedku nebo do rohu.
 *
 * Vrací { kolizni, hlasky }: `kolizni` je Set indexů skříněk (kreslení je
 * obarví červeně), `hlasky` jsou české věty (ty jdou do kusovníku).
 */
export function zkontrolujStenu(stena, skrinky, standard) {
  const hlasky = [];
  const kolizni = new Set();
  const delka = celeCislo(stena.delka_mm, 0);
  const vyska = celeCislo(stena.vyska_mm, 0);
  const otvory = otvorySteny(stena);
  const nazevSteny = stena.nazev || "Stěna";
  const seznam = skrinky || [];

  seznam.forEach((s, index) => {
    const stitek = `${nazevSteny} · ${popisSkrinky(s, index)}`;
    const x1 = celeCislo(s.odsazeni_mm, 0);
    const x2 = x1 + celeCislo(s.sirka_mm, 0);
    const [y1, y2] = svislyRozsah(s, standard);
    const hloubka = celeCislo(s.hloubka_mm, 510);

    if (x2 > delka) {
      kolizni.add(index);
      hlasky.push(`${stitek}: přesahuje délku stěny o ${x2 - delka} mm.`);
    }
    if (vyska > 0 && y2 > vyska) {
      kolizni.add(index);
      hlasky.push(`${stitek}: sahá výš než stěna o ${y2 - vyska} mm.`);
    }
    for (const o of otvory) {
      const ox1 = celeCislo(o.odsazeni_mm, 0);
      const ox2 = ox1 + celeCislo(o.sirka_mm, 0);
      const oy1 = o.typ === "dvere" ? 0 : celeCislo(o.parapet_mm, 0);
      const oy2 = oy1 + celeCislo(o.vyska_mm, 0);
      if (x1 < ox2 && x2 > ox1 && y1 < oy2 && y2 > oy1) {
        kolizni.add(index);
        hlasky.push(`${stitek}: zasahuje do ${o.typ === "dvere" ? "dveří" : "okna"} `
          + `(otvor od ${ox1} mm, šířka ${ox2 - ox1} mm).`);
      }
    }
    // Roh si bere kus stěny pro korpus na sousední stěně. Není to chyba,
    // je to upozornění — proto se skříňka neobarvuje jako kolize.
    if (stena.roh_vlevo && x1 < hloubka) {
      hlasky.push(`${stitek}: začíná v rohu — sousední stěna si bere prvních `
        + `${hloubka} mm (hloubka korpusu).`);
    }
    if (stena.roh_vpravo && x2 > delka - hloubka) {
      hlasky.push(`${stitek}: končí v rohu — sousední stěna si bere posledních `
        + `${hloubka} mm (hloubka korpusu).`);
    }
  });

  // Překryv v rámci jedné řady; spodní a horní skříňka se překrývat smí,
  // proto se porovnává i svislý rozsah.
  for (let i = 0; i < seznam.length; i += 1) {
    for (let j = i + 1; j < seznam.length; j += 1) {
      const a = seznam[i];
      const b = seznam[j];
      const [ay1, ay2] = svislyRozsah(a, standard);
      const [by1, by2] = svislyRozsah(b, standard);
      const ax1 = celeCislo(a.odsazeni_mm, 0);
      const ax2 = ax1 + celeCislo(a.sirka_mm, 0);
      const bx1 = celeCislo(b.odsazeni_mm, 0);
      const bx2 = bx1 + celeCislo(b.sirka_mm, 0);
      if (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1) {
        kolizni.add(i);
        kolizni.add(j);
        hlasky.push(`${nazevSteny}: ${popisSkrinky(a, i)} a ${popisSkrinky(b, j)} `
          + "se překrývají.");
      }
    }
  }

  return { kolizni, hlasky };
}

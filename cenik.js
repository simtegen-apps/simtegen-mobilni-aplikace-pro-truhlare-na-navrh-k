// Schválený ceník předplatného — jediný zdroj pravdy o ceně NA SERVERU.
//
// Žije mimo functions/, stejně jako spolecne.js a predplatne.js: všechno
// pod functions/ je kandidát na routu.
//
// Proč to tu je: objednávka chodí z prohlížeče, a co chodí z prohlížeče,
// to si zákazník může přepsat. Dokud cenu bral server z těla požadavku,
// stačilo při objednávce poslat jinou částku a faktura by se vystavila na
// ni. Cenu proto počítá server sám a číslo z požadavku bere jen jako
// kontrolu — když nesedí s tím, co zákazník viděl na obrazovce, objednávka
// se odmítne a zákazník si stránku načte znovu.
//
// CENIK = null znamená, že cena ještě neprošla bránou majitele. Objednat
// jde i tak (firma částku potvrdí e-mailem před vystavením faktury), ale
// žádné číslo se neuloží a žádné se nesmí poslat z prohlížeče.
//
// KDYŽ MAJITEL CENU SCHVÁLÍ, vyplní se na třech místech najednou:
//   1. tady          CENIK = { mesic: 490, mena: "Kč" }
//   2. web/index.html  window.CENIK = { mesic: 490, mena: "Kč" }  (jen zobrazení)
//   3. data-manifest.json  cena_dph: "včetně DPH"  → obchodní podmínky
// Kdyby se 1 a 2 rozešly, objednávka skončí hláškou o změně ceny — raději
// hlasitě, než tiše fakturovat něco jiného, než zákazník viděl.

export const CENIK = null;

export const MIN_MESICU = 1;
export const MAX_MESICU = 24;

/** Celková cena za daný počet měsíců v Kč, nebo null, není-li ceník schválený. */
export function cenaZa(mesice) {
  if (!CENIK) return null;
  const n = Math.round(Number(mesice));
  if (!Number.isInteger(n) || n < MIN_MESICU || n > MAX_MESICU) return null;
  return Math.round(CENIK.mesic * n);
}

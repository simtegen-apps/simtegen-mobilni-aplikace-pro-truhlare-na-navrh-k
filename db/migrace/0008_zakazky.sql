-- Zakázka = jeden návrh kuchyně nebo skříně: stěny, které truhlář naměřil
-- u zákazníka, a skříňky, které na ně postavil.
--
-- Každá tabulka nese uzivatel_id i tam, kde by stačil odkaz na zakázku:
-- export a smazání účtu jdou generickou cestou přes tento sloupec a nesmí
-- žádnou tabulku minout.
--
-- Otvory (okna, dveře) jsou JSON ve sloupci stěny: je jich pár, vždy se
-- čtou a zapisují celé se stěnou, a vlastní tabulka by přidala migraci
-- i join bez jediného dotazu navíc, který by ji využil.
--
-- Rozměry jsou celá čísla v milimetrech.

CREATE TABLE zakazky (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id        INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    nazev              TEXT    NOT NULL,
    oznaceni_zakaznika TEXT    NOT NULL DEFAULT '',
    poznamka           TEXT    NOT NULL DEFAULT '',
    stav               TEXT    NOT NULL DEFAULT 'rozpracovana',
    vytvoreno          INTEGER NOT NULL DEFAULT (unixepoch()),
    zmeneno            INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_zakazky_uzivatel ON zakazky(uzivatel_id, zmeneno);

CREATE TABLE steny (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    zakazka_id  INTEGER NOT NULL REFERENCES zakazky(id) ON DELETE CASCADE,
    poradi      INTEGER NOT NULL DEFAULT 0,
    nazev       TEXT    NOT NULL DEFAULT '',
    delka_mm    INTEGER NOT NULL,
    vyska_mm    INTEGER NOT NULL,
    roh_vlevo   INTEGER NOT NULL DEFAULT 0,
    roh_vpravo  INTEGER NOT NULL DEFAULT 0,
    otvory_json TEXT    NOT NULL DEFAULT '[]',
    vytvoreno   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_steny_zakazka ON steny(uzivatel_id, zakazka_id, poradi);

CREATE TABLE skrinky (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id      INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    zakazka_id       INTEGER NOT NULL REFERENCES zakazky(id) ON DELETE CASCADE,
    stena_id         INTEGER NOT NULL REFERENCES steny(id) ON DELETE CASCADE,
    poradi           INTEGER NOT NULL DEFAULT 0,
    typ              TEXT    NOT NULL DEFAULT 'spodni',
    odsazeni_mm      INTEGER NOT NULL DEFAULT 0,
    sirka_mm         INTEGER NOT NULL DEFAULT 600,
    vyska_mm         INTEGER NOT NULL DEFAULT 720,
    hloubka_mm       INTEGER NOT NULL DEFAULT 510,
    pocet_polic      INTEGER NOT NULL DEFAULT 1,
    pocet_dvirek     INTEGER NOT NULL DEFAULT 1,
    pocet_zasuvek    INTEGER NOT NULL DEFAULT 0,
    zasuvka_vyska_mm INTEGER NOT NULL DEFAULT 140,
    zada_typ_prepis  TEXT    NOT NULL DEFAULT '',
    material_id      INTEGER,
    poznamka         TEXT    NOT NULL DEFAULT '',
    vytvoreno        INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_skrinky_zakazka ON skrinky(uzivatel_id, zakazka_id, stena_id, poradi);

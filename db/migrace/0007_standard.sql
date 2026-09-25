-- Konstrukční standard dílny a seznam materiálů.
--
-- Tohle je to, proč se zákazník vrací: jednou nastavené parametry jeho
-- dílny (tloušťka desky, provedení zad, spáry dvířek, olepení hran) a
-- každý další kusovník z nich vypadne v rozměrech, ve kterých staví on.
--
-- Rozměry jsou CELÁ ČÍSLA V MILIMETRECH. Jediná výjimka jsou spáry a
-- tloušťky hran, které se v praxi udávají na desetiny (1,5 mm spára,
-- 0,8 mm ABS) — ty se ukládají v DESETINÁCH milimetru, aby se nikde
-- nepočítalo s desetinnou čárkou a nevznikl rozměr 596,9998 mm.
--
-- Jeden standard na účet (unikátní index): „můj standard“ není seznam.

CREATE TABLE standardy (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id           INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    nazev                 TEXT    NOT NULL DEFAULT 'Můj standard',
    tloustka_mm           INTEGER NOT NULL DEFAULT 18,
    zada_tloustka_mm      INTEGER NOT NULL DEFAULT 3,
    zada_typ              TEXT    NOT NULL DEFAULT 'drazka',
    drazka_hloubka_mm     INTEGER NOT NULL DEFAULT 8,
    drazka_odsazeni_mm    INTEGER NOT NULL DEFAULT 10,
    odskok_police_mm      INTEGER NOT NULL DEFAULT 20,
    spara_okraj_desetiny  INTEGER NOT NULL DEFAULT 15,
    spara_mezi_desetiny   INTEGER NOT NULL DEFAULT 30,
    traverzy_spodni       INTEGER NOT NULL DEFAULT 1,
    traverza_sirka_mm     INTEGER NOT NULL DEFAULT 100,
    sokl_mm               INTEGER NOT NULL DEFAULT 100,
    vyska_horni_mm        INTEGER NOT NULL DEFAULT 1450,
    hrana_pohledova_desetiny INTEGER NOT NULL DEFAULT 20,
    hrana_ostatni_desetiny   INTEGER NOT NULL DEFAULT 8,
    rozmer_s_olepenim     INTEGER NOT NULL DEFAULT 0,
    prorez_mm             INTEGER NOT NULL DEFAULT 4,
    deska_x_mm            INTEGER NOT NULL DEFAULT 2800,
    deska_y_mm            INTEGER NOT NULL DEFAULT 2070,
    vytvoreno             INTEGER NOT NULL DEFAULT (unixepoch()),
    zmeneno               INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE UNIQUE INDEX idx_standardy_uzivatel ON standardy(uzivatel_id);

CREATE TABLE materialy (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id  INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    nazev        TEXT    NOT NULL,
    dekor_kod    TEXT    NOT NULL DEFAULT '',
    tloustka_mm  INTEGER NOT NULL DEFAULT 18,
    vlakno       INTEGER NOT NULL DEFAULT 0,
    hrana_dekor  TEXT    NOT NULL DEFAULT '',
    vytvoreno    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_materialy_uzivatel ON materialy(uzivatel_id, id);

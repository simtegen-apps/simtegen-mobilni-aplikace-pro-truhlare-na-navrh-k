-- Místnosti zakázky a jejich rozmístění v půdorysu.
--
-- Truhlář chce vidět celý zadaný prostor, ne jen jednu stěnu, a v jedné
-- zakázce bývá víc místností (kuchyň a spíž, obývák a předsíň). Stěna proto
-- nově patří do místnosti a ví, jestli se na jejím konci zatáčí dovnitř,
-- nebo ven (vnější roh místnosti tvaru L).
--
-- Poloha místnosti je v milimetrech v půdorysu celé zakázky, natočení po
-- 90 stupních. Je to jen kresba a kontrola měření, do kusovníku nevstupuje.
--
-- Existující zakázky: všechny jejich stěny se převedou do jedné místnosti
-- „Místnost 1“, takže se v nich nic nezmění.

CREATE TABLE mistnosti (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    zakazka_id  INTEGER NOT NULL REFERENCES zakazky(id) ON DELETE CASCADE,
    poradi      INTEGER NOT NULL DEFAULT 0,
    nazev       TEXT    NOT NULL DEFAULT '',
    x_mm        INTEGER NOT NULL DEFAULT 0,
    y_mm        INTEGER NOT NULL DEFAULT 0,
    otoceni     INTEGER NOT NULL DEFAULT 0,
    vytvoreno   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_mistnosti_zakazka ON mistnosti(uzivatel_id, zakazka_id, poradi);

ALTER TABLE steny ADD COLUMN mistnost_id INTEGER;
ALTER TABLE steny ADD COLUMN zatoceni TEXT NOT NULL DEFAULT 'dovnitr';

INSERT INTO mistnosti (uzivatel_id, zakazka_id, poradi, nazev)
SELECT DISTINCT uzivatel_id, zakazka_id, 0, 'Místnost 1' FROM steny;

UPDATE steny SET mistnost_id = (
    SELECT m.id FROM mistnosti m
    WHERE m.uzivatel_id = steny.uzivatel_id AND m.zakazka_id = steny.zakazka_id
    ORDER BY m.id LIMIT 1
);

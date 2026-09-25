-- Vygenerovaný kusovník. Ukládá se i se SNÍMKEM konstrukčního standardu,
-- podle kterého vznikl.
--
-- Proč snímek: truhlář podle kusovníku objedná řezané desky. Když si za
-- měsíc změní v dílně tloušťku hrany nebo provedení zad, starý kusovník
-- se tím nesmí přepsat — jinak se nedá dohledat, co se do nářezového
-- centra vlastně poslalo.

CREATE TABLE kusovniky (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    uzivatel_id             INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE,
    zakazka_id              INTEGER NOT NULL REFERENCES zakazky(id) ON DELETE CASCADE,
    nazev_zakazky           TEXT    NOT NULL DEFAULT '',
    standard_snapshot_json  TEXT    NOT NULL DEFAULT '{}',
    polozky_json            TEXT    NOT NULL DEFAULT '[]',
    varovani_json           TEXT    NOT NULL DEFAULT '[]',
    pocet_dilu              INTEGER NOT NULL DEFAULT 0,
    plocha_cm2              INTEGER NOT NULL DEFAULT 0,
    odhad_desek             INTEGER NOT NULL DEFAULT 0,
    vytvoreno               INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_kusovniky_zakazka ON kusovniky(uzivatel_id, zakazka_id, id);

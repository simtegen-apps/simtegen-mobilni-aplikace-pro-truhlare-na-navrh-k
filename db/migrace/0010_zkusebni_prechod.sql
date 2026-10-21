-- Zkušební doba se od build 10 zkracuje z 30 na 14 dní (predplatne.js,
-- schválený ceník). Kdo se registroval ještě za 30denní zkušební doby, má ji
-- slíbenou v podmínkách, které při registraci viděl — nesmí o ni přijít.
--
-- Zkušební doba nemá vlastní řádek (počítá se z uzivatele.vytvoreno), takže
-- by se nasazením tiše zkrátila. Proto se těm účtům, kterým původních 30 dní
-- ke dni migrace ještě běží a nemají žádné zaplacené období, zapíše konec
-- původní zkušební doby do predplatne.plati_do. Účty s předplatným (i ukázkové
-- účty, ty mají řádek vždy) se nemění. Na čerstvé databázi nedělá nic.

INSERT INTO predplatne (uzivatel_id, plati_do, poznamka, zmeneno)
SELECT u.id, u.vytvoreno + 30 * 86400,
       'zkušební doba 30 dní podle podmínek při registraci', unixepoch()
FROM uzivatele u
WHERE u.vytvoreno + 30 * 86400 > unixepoch()
  AND NOT EXISTS (SELECT 1 FROM predplatne p WHERE p.uzivatel_id = u.id);

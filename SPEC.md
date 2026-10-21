# Specifikace — build 10

Hotová aplikace Kusovník pro truhláře se stane instalovatelnou aplikací z Google Play. Truhlář si v ní koupí předplatné přes Google Play, které se samo obnovuje a ruší se v Google Play. Na webu zůstává fakturační objednávka. Obě cesty prodlužují stejné zaplacené období (`predplatne.plati_do`). Vznikají i podklady pro obchod: piktogram linky s kótou, hlavní věta, pět snímků z ukázkové kuchyně, ukázková data, „Co je nového“ a formulář Bezpečnost údajů. Na přihlašovací obrazovce je tlačítko „Vyzkoušet ukázku“ (dočasný účet na 24 hodin). Zakázky, stěny, kusovník, standard, data ani návrhový systém v2 se nemění.

## Placená hodnota (proč přijde druhý nákup)
Truhlář platí za to, že kusovník pro nářezové centrum vznikne z měření jedním klepnutím a zakázky má uložené jako šablony pro další. Vrací se s každou novou kuchyní nebo skříní, tedy několikrát za měsíc. Předplatné z Google Play se obnovuje automaticky a koupí se na tom tabletu, na kterém měří, takže druhá a každá další platba nepotřebuje fakturu ani převod.

## Ceník (schválený majitelem, zobrazuje se doslova)
- SimteGen Kusovník – Sólo — 249 Kč za firmu a měsíc
- SimteGen Kusovník – Standard — 449 Kč za firmu a měsíc; obsahuje: neomezený počet zakázek a uložených projektů, návrh a vizualizace kuchyně/skříněk v tabletu i telefonu, automatické generování kusovníku (rozměry desek a polic) pro nářezové centrum
- SimteGen Kusovník – Tým — 890 Kč za firmu a měsíc
- Zkušební doba 14 dní

**Objednat jde jen Standard** — jediná varianta s definovaným obsahem. Sólo a Tým v této verzi odemykají přesně totéž co Standard, a prodávat stejné plnění za tři ceny by bylo vůči zákazníkovi klamavé. Na webu se proto obě jen zobrazují s větou „… zatím objednat nejde“. Server je odmítne (422, `cenik.js` → `objednat: false`), dokud majitel neurčí, čím se liší.

Server (`cenik.js`) i stránka (`window.CENIK`, `window.CENIK_VARIANTY`) mají stejná čísla. Objednávka posílá jen klíč varianty, do databáze se uloží název z ceníku. Celkovou částku (měsíce × 449 Kč) spočítá server a nesoulad s tím, co zákazník viděl, odmítne (409).

## Design
- Barva produktu beze změny: `--barva-produktu #2f6b43` (dřevozelená, v tmavém režimu #4fa36b). Jen jako ukazatel.
- Navigace beze změny: Zakázky · Standard · Účet + Nahlásit chybu. Každá podřízená obrazovka má tlačítko Zpět a vlastní historii, právní stránky mají „Zpět do aplikace“.
- **Úvod na webu:** obří číslo 449 (Kč za firmu a měsíc, Standard), ceník tří variant doslova s větou, že Sólo a Tým zatím objednat nejde.
- **Úvod v aplikaci z Google Play:** ceník variant se neukazuje, protože v Play koupit nejdou. Obří číslo je 14 (dní zkušební doby zdarma) a věta „Potom se aplikace platí předplatným přes Google Play. Cenu a délku období uvidíte u účtu před nákupem.“ Ceník variant se skrývá stejně opatrně jako fakturační objednávka: dokud `play.js` nepotvrdí prohlížeč (`sg-web`), neukáže se.
- Obě podoby Úvodu mají sekce 01 Co to dělá, 02 Cena a 03 Vyzkoušet nebo se přihlásit. Hlavní akce „Poslat přihlašovací odkaz“ je v liště a „Vyzkoušet ukázku“ pod přihlášením. Na tabletu a notebooku `.dva-sloupce`.
- **Účet:** obří číslo = dní zbývá, stupnice čtyř týdnů s ryskami po 7 dnech a mono datem konce období. 01 Předplatné (v aplikaci nákup přes Google Play v `[data-predplatne-play]`, na webu karta `[data-objednavka]` s ceníkem a objednávkou Standardu), 02 Vaše hlášení, 03 Vaše data. Na tabletu `.mrizka`, vlevo `.s5`, vpravo `.s7`. Stav se čte pokaždé znovu z `/api/ja`. Načítání `.kostra`, chyba s tlačítkem Zkusit znovu.
- Úvod a Účet mají kostru v HTML (`[data-ukazka]`, `[data-predplatne-play]`, `[data-objednavka]`…). `simtegen.js` totiž načte `play.js` jen tehdy, když tyto prvky najde při načtení stránky, a obrazovky se kreslí až po `/api/ja`.
- Mimo kartu `[data-objednavka]` aplikace nemluví o faktuře ani o převodu.

## Datový model
Nová tabulka jen ze šablony: `play_nakupy` (migrace `0900_play_nakupy.sql`: uzivatel_id, token, produkt, plati_do, stav, overeno, zapsano; retence do smazání účtu). Data migrace `0010_zkusebni_prechod.sql`: účtům, kterým ke dni nasazení ještě běží původní 30denní zkušební doba, zapíše její konec do `predplatne.plati_do`. Ostatní entity a retence beze změny. V manifestu přibyla entita `play_nakupy`, služba Google Play (androidpublisher.googleapis.com) a technická cookie `aplikace`. Kontaktní e-mail zůstává `podpora@simtegen.cz` jako v build 9.

## Záznam v obchodě
- `hlavni_veta`: „Od měření u zákazníka ke kusovníku“.
- `dlouhy_popis` u placení uvádí jen to, co aplikace z Google Play opravdu prodává: předplatné přes Google Play, cenu a délku období vidí zákazník před nákupem, automatické obnovení a zrušení v Google Play. Ceník variant v něm není.
- Snímky: Zakázky · Měření stěny (tablet) · Náhled kuchyně (tablet) · Kusovník · Standard dílny. Snímky 2–4 začínají na `o-zakazky` a proklikají se přes háčky `[data-zakazka]`, `[data-stena]`, `[data-akce=nahled]` a `#lista-dole [data-akce=kusovnik]`.
- `play/ukazka.json`: standard „Dílna Ukázka – LTD 18“, dva materiály, vestavná skříň a kuchyň „Kuchyň Rodinný dům Lipová“ do L s kusovníkem. Kuchyň se zakládá poslední, aby byla v seznamu první.

## Akceptační scénáře
V `uat/scenare.json` (CI je spouští proti API):
- Truhlář A — změří skříňku 600 × 720 × 510 a vygeneruje kusovník — 8 dílů, CSV jde stáhnout (stávající scénář).
- Truhlář B — načte zakázky, kusovník A podle id, jeho CSV a objednávky — nic z účtu A, u kusovníku 404.
- Nový účet — `/api/ja` — stav „zkusebni“, 14 dní.
- Truhlář A — objedná Standard na 1 měsíc za 449 Kč — uloží se „SimteGen Kusovník – Standard“ za 449.
- Truhlář A — objedná Standard za 249 místo 449 — 409 „Cena se mezitím změnila“. Objedná Tým nebo Sólo — 422 „zatím objednat nejde“. Nic z toho se neuloží.
- Export vlastních dat je dostupný vždy a bez přihlášení produktová API vrací 401.

V `zkouska_predplatneho.mjs` (`node zkouska_predplatneho.mjs`, ručně jako `zkouska_rozpadu.mjs`): vypršelé předplatné se přes API v akceptačních testech nastavit nedá. Test proto pouští skutečné handlery s falešnou databází, ve které má účet `plati_do` v minulosti:
- POST/PUT zakázky, POST kusovníku a PUT standardu vrátí 402 „Předplatné vypršelo.“
- `/api/ucet/export` vrátí 200 a `/api/ja` ukáže stav „vyprselo“.
- Navíc ověřuje 14denní zkušební dobu nového účtu a účet po migraci 0010.

## Odchylky od schválené specifikace (ověřujte podle tohoto)
1. **Ukázkový účet:** pruh nekreslí produkt, ale šablona (`web/play.js`). Text je „Prohlížíte ukázku s vymyšlenými daty. Za 24 hodin zmizí.“ s tlačítkem „Odejít z ukázky“, ne „Ukázka — data zmizí do 24 hodin.“ / „Založit vlastní účet“. „Odejít z ukázky“ odhlásí a vrátí na Úvod. V ukázce je nákup v Play vidět, ale je zablokovaný.
2. **Nákup v Google Play:** `play.js` (šablona) prodává produkty `predplatne_mesic` a `predplatne_rok`, ne varianty Sólo / Standard / Tým. Validační krok „testovací nákup Standardu“ znamená testovací nákup `predplatne_mesic`.
3. **Varianty:** objednat jde jen Standard, Sólo a Tým se jen zobrazují (viz Ceník). Scénář „Tým za 449 → cena se změnila“ je proto nahrazený: Tým → 422, Standard za špatnou cenu → 409.
4. **Ceník v aplikaci:** na Úvodu aplikace z Google Play se ceník variant neukazuje (viz Design).
5. **Scénář 402** je deterministický test `zkouska_predplatneho.mjs`, ne krok v `uat/scenare.json`.

## Otevřené body pro majitele — BLOKUJÍ vydání do Google Play
- **Cena v Google Play:** v Play Console založit `predplatne_mesic` za schválených **449 Kč** (Standard). `predplatne_rok` majitel neschválil — nezakládat, dokud ho neschválí, jinak ho `play.js` zákazníkovi nabídne. Aplikace cenu z Play zobrazuje tak, jak ji vrátí Google, sama ji nehlídá.
- **Čím se liší Sólo a Tým** (např. počet uživatelů nebo zařízení). Do té doby je nejde objednat.
- **DPH:** `cena_dph` v manifestu je prázdné, v podmínkách zůstává červený slot.
- **Servisní účet** pro ověření nákupů (`PLAY_NAKUPY_UCET`, `PLAY_BALICEK`) nastaví majitel / workflow Vydání.
- **Kontaktní schránka** `podpora@simtegen.cz` musí existovat a někdo ji musí číst. Během stavby se v manifestu mimo stavitele objevila `support@simtegen.com` a byla vrácena, protože změnu nikdo neschválil. Chce-li ji majitel, stačí změnit jedno pole a přegenerovat.

## Vady šablony — v produktu se opravit nesmí, nutné opravit před vydáním do produkce
- `functions/api/ukazka.js` (ř. 73) vrací zákazníkovi tykající hlášku „Ukázek je teď moc, zkus to za chvíli.“ — má vykat („zkuste to prosím za chvíli“). `play.js` ji zobrazí přímo v tlačítku.
- `vykresli_zasady.py` → `web/podminky.html` (ř. 56): obchodní podmínky dostupné z aplikace z Google Play dál popisují úhradu „na základě faktury“. V aplikaci z Play by podmínky platbu fakturou zmiňovat neměly, nebo jen jako způsob platby na webu bez odkazu z aplikace. Rozhodne šablona (generátor), produkt podmínky ručně neupravuje.

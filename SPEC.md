# Specifikace — build 10

Hotová aplikace Kusovník pro truhláře se stane instalovatelnou aplikací z Google Play. Truhlář si v ní koupí předplatné přes Google Play, které se samo obnovuje a ruší se v Google Play. Na webu zůstává fakturační objednávka, nově s variantami schváleného ceníku: Sólo, Standard a Tým. Obě cesty prodlužují stejné zaplacené období (`predplatne.plati_do`). Vznikají i podklady pro obchod: piktogram linky s kótou, hlavní věta, pět snímků z ukázkové kuchyně, ukázková data, „Co je nového“ a formulář Bezpečnost údajů. Na přihlašovací obrazovce je tlačítko „Vyzkoušet ukázku“ (dočasný účet na 24 hodin). Zakázky, stěny, kusovník, standard, data ani návrhový systém v2 se nemění.

## Placená hodnota (proč přijde druhý nákup)
Truhlář platí za to, že kusovník pro nářezové centrum vznikne z měření jedním klepnutím a zakázky má uložené jako šablony pro další. Vrací se s každou novou kuchyní nebo skříní, tedy několikrát za měsíc. Předplatné z Google Play se obnovuje automaticky a koupí se na tom tabletu, na kterém měří, takže druhá a každá další platba nepotřebuje fakturu ani převod.

## Ceník (schválený majitelem, zobrazuje se doslova)
- SimteGen Kusovník – Sólo — 249 Kč za firmu a měsíc
- SimteGen Kusovník – Standard — 449 Kč za firmu a měsíc; obsahuje: neomezený počet zakázek a uložených projektů, návrh a vizualizace kuchyně/skříněk v tabletu i telefonu, automatické generování kusovníku (rozměry desek a polic) pro nářezové centrum
- SimteGen Kusovník – Tým — 890 Kč za firmu a měsíc
- Zkušební doba 14 dní

Server (`cenik.js`) i stránka (`window.CENIK`, `window.CENIK_VARIANTY`) mají stejná čísla. Objednávka posílá jen klíč varianty (`solo` / `standard` / `tym`), do databáze se uloží název z ceníku. Celkovou částku (měsíce × cena varianty) spočítá server a nesoulad s tím, co zákazník viděl, odmítne (409).

## Design
- Barva produktu beze změny: `--barva-produktu #2f6b43` (dřevozelená, v tmavém režimu #4fa36b). Jen jako ukazatel.
- Navigace beze změny: Zakázky · Standard · Účet + Nahlásit chybu. Každá podřízená obrazovka má tlačítko Zpět a vlastní historii, právní stránky mají „Zpět do aplikace“.
- **Úvod:** obří číslo 449 (Kč za firmu a měsíc, Standard). Sekce 01 Co to dělá (s mono řádkem dílů referenční skříňky), 02 Cena (ceník doslova + zkušební doba), 03 Vyzkoušet nebo se přihlásit. Hlavní akce „Poslat přihlašovací odkaz“ v liště. „Vyzkoušet ukázku“ je pod přihlášením. Na tabletu a notebooku `.dva-sloupce`.
- **Účet:** obří číslo = dní zbývá, stupnice čtyř týdnů s ryskami po 7 dnech a mono datem konce období. 01 Předplatné (v aplikaci nákup přes Google Play v `[data-predplatne-play]`, na webu karta `[data-objednavka]`), 02 Vaše hlášení, 03 Vaše data. Na tabletu `.mrizka`, vlevo `.s5` stav, vpravo `.s7` zbytek. Stav se čte pokaždé znovu z `/api/ja`. Načítání `.kostra`, chyba s tlačítkem Zkusit znovu.
- Úvod a Účet mají kostru v HTML (`#uvod-levy`, `#uvod-prihlaseni`, `[data-ukazka]`, `#ucet-stav`, `[data-predplatne-play]`, `[data-objednavka]`…). `simtegen.js` totiž načte `play.js` jen tehdy, když tyto prvky najde při načtení stránky, a obrazovky se kreslí až po `/api/ja`.
- Ukázkový účet: pruh „Prohlížíte ukázku…“ s tlačítkem „Odejít z ukázky“ kreslí `web/play.js` (šablona). Fakturační objednávka se v ukázce neukazuje.
- Mimo kartu `[data-objednavka]` aplikace nemluví o faktuře ani o převodu.

## Datový model
Nová tabulka jen ze šablony: `play_nakupy` (migrace `0900_play_nakupy.sql`: uzivatel_id, token, produkt, plati_do, stav, overeno, zapsano; retence do smazání účtu). Data migrace `0010_zkusebni_prechod.sql`: účtům, kterým ke dni nasazení ještě běží původní 30denní zkušební doba, zapíše její konec do `predplatne.plati_do`, aby se zkrácením na 14 dní nikomu nic nevzalo. Ostatní entity a retence beze změny. V manifestu přibyla entita `play_nakupy`, služba Google Play (androidpublisher.googleapis.com) a technická cookie `aplikace`.

## Záznam v obchodě
- `hlavni_veta`: „Od měření u zákazníka ke kusovníku“.
- Snímky: Zakázky · Měření stěny (tablet) · Náhled kuchyně (tablet) · Kusovník · Standard dílny. Snímky 2–4 začínají na `o-zakazky` a proklikají se přes háčky `[data-zakazka]`, `[data-stena]`, `[data-akce=nahled]` a `#lista-dole [data-akce=kusovnik]`. Nákres stěny a kusovník potřebují otevřenou zakázku.
- `play/ukazka.json`: standard „Dílna Ukázka – LTD 18“, dva materiály, vestavná skříň a kuchyň „Kuchyň Rodinný dům Lipová“ do L (stěna A s oknem a rohovou skříňkou, stěna B s vysokou skříní na troubu) s kusovníkem. Kuchyň se zakládá poslední, aby byla v seznamu první.

## Akceptační scénáře (uat/scenare.json)
- Truhlář A — změří skříňku 600 × 720 × 510 a vygeneruje kusovník — 8 dílů, CSV jde stáhnout (stávající scénář).
- Truhlář B — načte zakázky, kusovník A podle id, jeho CSV a objednávky — nic z účtu A, u kusovníku 404.
- Nový účet — `/api/ja` — stav „zkusebni“, 14 dní.
- Truhlář A — objedná Standard na 1 měsíc za 449 Kč — uloží se „SimteGen Kusovník – Standard“ za 449.
- Truhlář A — objedná Tým za 449 místo 890 — 409 „Cena se mezitím změnila“, nic se neuloží; neznámá varianta 422.
- Export vlastních dat je dostupný vždy a bez přihlášení produktová API vrací 401. Vypršelé předplatné (402) se přes API nastavit nedá, `vyzadujPredplatne` ho hlídá u všech produktových rout.

## Otevřené body pro majitele
- Čím se liší Sólo a Tým: aplikace má jeden účet na e-mail, takže všechny varianty zatím odemknou totéž.
- DPH: `cena_dph` v manifestu zůstává prázdné (v podmínkách červený slot).
- Google Play prodává produkty `predplatne_mesic` a `predplatne_rok` (modul šablony `play.js`), ne tři varianty. Jejich cenu a servisní účet (`PLAY_NAKUPY_UCET`, `PLAY_BALICEK`) nastavuje majitel / workflow Vydání.

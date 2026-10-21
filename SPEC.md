# Specifikace — build 11

Hotová aplikace Kusovník pro truhláře se stane instalovatelnou aplikací z Google Play. Truhlář si v ní koupí předplatné přes Google Play, které se samo obnovuje a ruší se v Google Play. Jde o tři varianty se schváleným ceníkem: Sólo, Standard a Tým. Na webu zůstává fakturační objednávka. Obě cesty prodlužují stejné zaplacené období (predplatne.plati_do). Vzniknou i podklady pro obchod: piktogram linky s kótou, hlavní věta, snímky obrazovek z ukázkové kuchyně, ukázková data, text „Co je nového“ a formulář Bezpečnost údajů. Na přihlašovací obrazovce přibude tlačítko „Vyzkoušet ukázku“ (dočasný účet na 24 hodin). Zakázky, stěny, kusovník, standard, data ani návrhový systém v2 se nemění.

## Placená hodnota (proč přijde druhý nákup)
Truhlář platí za to, že kusovník pro nářezové centrum vznikne z měření jedním klepnutím a zakázky má uložené jako šablony pro další. Vrací se s každou novou kuchyní nebo skříní, tedy několikrát za měsíc. Předplatné z Google Play se obnovuje automaticky a koupí se dvěma klepnutími na tom tabletu, na kterém měří, takže druhá a každá další platba nepotřebuje fakturu ani převod.

## Design (obrazovky, navigace, stavy)
Barva produktu se nemění: --barva-produktu #2f6b43, dřevozelená (v tmavém režimu #4fa36b). Odkazuje na dřevo a dílnu truhláře. Kontrast na papíře #f6f4ef je asi 6,2:1 (≥ 4,5:1, CI ji už v minulých buildech přijalo). Používá se jen jako ukazatel: čtvereček značky, aktivní položka menu, ukazatel vybrané varianty ceníku. Hlavní tlačítka zůstávají černá.

NAVIGACE beze změny, 3 položky: Zakázky · Standard · Účet (a Nahlásit chybu). Od spuštění ke kusovníku vedou 3 klepnutí: zakázka → Kusovník (kusovník celé zakázky), případně zakázka → stěna → Kusovník. Ke koupi předplatného vedou 2 klepnutí: Účet → Koupit. Aplikace v TWA běží bez adresního řádku. Každá podřízená obrazovka má tlačítko #zpet v hlavičce a vlastní historii (router v index.html pushState/popstate), takže funguje i hardwarové Zpět na Androidu. Právní stránky mají odkaz „Zpět do aplikace“. Nákupní dialog Google Play se zavře zpět do Účtu.

OBRAZOVKY (pouze dvě se mění, ostatní zůstávají jako v buildu 9):
1) Úvod / přihlášení (#o-uvod) — MĚNÍ SE.
   • Obří číslo: 449 Kč, schválená cena varianty Standard.
   • Hlavní akce: „Poslat přihlašovací odkaz“ v liště dole. Vedlejší: <button type="button" class="tlacitko" data-ukazka>Vyzkoušet ukázku</button>.
   • Sekce: 01 Co aplikace umí · 02 Cena · 03 Vyzkoušet nebo se přihlásit.
   • Sekce 02 ukazuje ceník doslova, nic nedopočítává:
     – „SimteGen Kusovník – Sólo — 249 Kč za firmu a měsíc“
     – „SimteGen Kusovník – Standard — 449 Kč za firmu a měsíc; obsahuje: neomezený počet zakázek a uložených projektů, návrh a vizualizace kuchyně/skříněk v tabletu i telefonu, automatické generování kusovníku (rozměry desek a polic) pro nářezové centrum“
     – „SimteGen Kusovník – Tým — 890 Kč za firmu a měsíc“
     – „Zkušební doba 14 dní“
   • Detail z oboru: mono řádek „bok 2× 510 × 720 · dno 564 × 510 · záda 580 × 700“, tedy ukázka dílů referenční skříňky.
   • Tablet a notebook: dva sloupce (.dva-sloupce). Vlevo sekce 01 a 02, vpravo karta .vykres s přihlášením a ukázkou.
   • Prázdný stav není (statická obrazovka). Načítání: .kostra místo ceníku, než se ověří relace. Chyba: .hlaska.chyba „Odkaz se nepodařilo odeslat — zkontrolujte e-mail a zkuste to znovu.“ Pokud ukázka selže: „Ukázku teď nejde spustit, zkuste to prosím za chvíli.“

2) Účet (#o-ucet) — MĚNÍ SE.
   • Obří číslo: počet dní zbývajícího předplatného nebo zkušební doby, se stavem „zkušební doba do 4. 11. 2026“ / „předplatné do …“ / „předplatné vypršelo“.
   • Hlavní akce: v aplikaci z Google Play nákup v bloku <div data-predplatne-play></div> (obsluhuje web/play.js: podmínky, automatické obnovení, zrušení). Na webu karta <section data-objednavka> s tlačítkem „Objednávka zavazující k platbě“.
   • Sekce: 01 Předplatné (ceník tří variant doslova + nákup) · 02 Vaše hlášení · 03 Vaše data (export, odhlášení, smazání účtu).
   • Detail: stupnice (.stupnice) zaplaceného období s ryskami po týdnech a datem konce v mono („plati_do 2026-11-04“).
   • Karta data-objednavka (jen web): výběr varianty a délky (1/3/12 měsíců), cena varianty doslova PŘED tlačítkem, fakturační údaje, zaškrtávátko „jako spotřebitel“ a jen pro spotřebitele samostatný souhlas podle § 1837 písm. l).
   • Text mimo kartu nesmí mluvit o objednávce ani faktuře. Řádek 2074 zní nově „Zakázky máte uložené — po obnovení předplatného se k nim zase dostanete.“
   • Tablet: 12sloupcová mřížka. Vlevo .s5 karta stavu + stupnice, vpravo .s7 sekce Předplatné. Notebook: totéž, hlášení a data pod sebou vpravo.
   • Prázdný stav: hlášení „Zatím jste nic nehlásili“. Načítání: .kostra karty stavu. Chyba: „Stav předplatného se nepodařilo načíst — zkontrolujte připojení a zkuste to znovu“ s tlačítkem Zkusit znovu. Úspěch: toast „Předplatné je aktivní do …“ po nákupu v Play, nebo „Objednávku máme“ na webu.

3) Ukázkový účet (stav nad všemi obrazovkami). Dokud běží ukázka, je pod hlavičkou .hlaska „Ukázka — data zmizí do 24 hodin.“ s odkazem „Založit vlastní účet“, který odhlásí ukázku a vrátí na Úvod.

Beze změny, jen připomenutí pro snímky:
- Zakázky: obří číslo = počet otevřených zakázek; hlavní akce „Nová zakázka“; sekce 01 Rozpracované · 02 Hotové; detail = mono rozměry stěn.
- Zakázka: obří číslo = počet skříněk; hlavní akce „Kusovník“; sekce 01 Stěny · 02 Údaje zakázky · 03 Akce.
- Stěna: obří číslo = délka stěny v mm; výkres v měřítku s okny a kótami; hlavní akce „Přidat skříňku“; sekce 01 Rozměry · 02 Otvory · 03 Skříňky.
- Náhled: celá kuchyň.
- Kusovník: obří číslo = počet dílů; hlavní akce „Stáhnout CSV“; sekce 01 Díly · 02 Materiály · 03 Odhad desek; detail = rozměry a olepení hran.
- Standard: obří číslo = tloušťka desky v mm.
Na tabletu a notebooku se zakázka a stěna dělí na výkres (.s8) a panel (.s4), seznamy přecházejí do .tabulka. Všechny obrazovky mají stavy prázdno / .kostra / .hlaska.chyba už z buildu 8–9. Při vypršení předplatného produktové akce zůstanou zablokované (402 → toast a přechod do Účtu).

PIKTOGRAM (play/piktogram.svg, viewBox 0 0 24 24, bez barev a tloušťky):
- rect 4,13,16,7 = spodní skříňky
- line 3,13→21,13 = pracovní deska
- line 9,13→9,20 a 15,13→15,20 = dělení dvířek
- line 7,15→7,17 a 17,15→17,17 = úchytky
- rect 4,4,7,5 a 13,4,7,5 = horní skříňky
- <g class="detail">: kóta line 4,22→20,22 + rysky line 4,21→4,23 a 20,21→20,23
Celkem 11 prvků, vše do 14 od středu.

ZÁZNAM V OBCHODĚ
- hlavni_veta: „Od měření u zákazníka ke kusovníku“.
- snimky (pořadí vypráví práci truhláře):
  1. o-zakazky — stitek „Zakázky“, titulek „Všechny zakázky uložené v účtu“.
  2. o-stena, tablet:true — kliky [#seznam-zakazek [data-zakazka]] [#seznam-sten [data-stena]] — stitek „Měření stěny“, titulek „Stěna s oknem a skříňkami v měřítku“.
  3. o-nahled, tablet:true — stitek „Náhled kuchyně“, titulek „Celá linka před očima zákazníka“.
  4. o-kusovnik — kliky [#seznam-zakazek [data-zakazka]] [[data-akce=kusovnik]] — stitek „Kusovník“, titulek „Kusovník pro nářezové centrum“.
  5. o-standard — stitek „Standard dílny“, titulek „Díly podle konstrukce vaší dílny“.

## Plán
1) Nové soubory ze stavby převzít beze změny a needitovat: web/play.js, functions/api/ukazka.js, play_nakupy.js, functions/api/play.js, db/migrace/0900_play_nakupy.sql. Stejně tak aktuální šablonu vykresli_aplikaci.py, kontrola_manifestu.py, DESIGN.md, styl.css a simtegen.js. Ověřit, že _middleware.js dál nastavuje context.data.predplatne = await stavPredplatneho(env, uzivatel), že /api/ja ho vrací a že všechna produktová API (zakazky*, kusovnik*, standard*, materialy) volají vyzadujPredplatne. Účet, export, smazání a přihlášení zůstávají bez bariéry.

2) Ceník (schválený majitelem, zapsat doslova):
   • cenik.js: CENIK = { mesic: 449, mena: "Kč", varianty: { solo: { nazev: "SimteGen Kusovník – Sólo", mesic: 249 }, standard: { nazev: "SimteGen Kusovník – Standard", mesic: 449 }, tym: { nazev: "SimteGen Kusovník – Tým", mesic: 890 } } }.
   • cenaZa(mesice, varianta) počítá z ceny vybrané varianty. Výchozí je standard.
   • functions/api/objednavka.js: varianta bude jen klíč solo/standard/tym (neznámý klíč → 422). Do sloupce varianta se uloží její název. Kontrola cena_czk proti serveru zůstává (409 při nesouladu).
   • web/index.html: window.CENIK = { mesic: 449, mena: "Kč" } a vedle něj window.CENIK_VARIANTY se stejnými třemi názvy a cenami a textem „obsahuje: …“ jen u Standardu, jak ho majitel schválil.

3) Zkušební doba 14 dní:
   • ZKUSEBNI_DNI = 14 v predplatne.js, "zkusebni_dni": 14 v manifestu, úvodní text „Prvních 14 dní zdarma, bez karty, bez závazku.“
   • Ochrana stávajících zákazníků: migrace db/migrace/0010_zkusebni_prechod.sql. Pro účty, kterým ke dni nasazení ještě běží původních 30 dní a nemají řádek v predplatne, vloží řádek predplatne (uzivatel_id, plati_do = vytvoreno + 30 dní, poznamka „zkušební doba 30 dní podle podmínek při registraci“, zmeneno). Nikomu se tak zkušební doba nezkrátí. Účty s předplatným se nemění.

4) Úvodní obrazovka (vykresliUvod):
   • ceník tří variant doslova a obří 449 Kč,
   • <button type="button" class="tlacitko" data-ukazka>Vyzkoušet ukázku</button> v sekci 03,
   • detail s díly referenční skříňky, rozložení .dva-sloupce na tabletu.

5) Účet (vykresliUcet):
   • Sekce 01 Předplatné: ceník + prázdný <div data-predplatne-play></div> + stávající objednávková karta zabalená do <div data-objednavka>. Ta dostane výběr varianty (radio, Standard předvolen) a délky, cenu varianty doslova před tlačítkem, fakturační údaje, spotřebitele a § 1837 l).
   • Karta se nově nabízí kdykoli, ne jen 7 dní před koncem, aby šlo předplatné prodloužit.
   • Mimo kartu žádná zmínka o objednávce, faktuře ani převodu (přepsat ř. 2074). Text úspěchu „Fakturu pošleme e-mailem“ zůstává jen uvnitř karty data-objednavka.
   • Stupnice zaplaceného období, rozložení s5/s7 na tabletu.
   • Do seznamu zakázek doplnit háčky pro snímky: data-zakazka na řádek, data-stena na řádek stěny, data-akce="kusovnik" na akci Kusovník. Chování se nemění.

6) Projít celý index.html a odstranit všechny další texty, které by mimo kartu data-objednavka vedly k placení mimo Google Play (toast 402 „podrobnosti najdete u účtu“ je v pořádku).

7) data-manifest.json:
   • zkusebni_dni 14.
   • Nová entita v ukladame: play_nakupy (ucel „evidence předplatného koupeného v Google Play“; pole „odkaz na účet, doklad o nákupu od Googlu, produkt, konec zaplaceného období, stav, čas ověření“; retence „do smazání účtu zákazníkem“; play_typy ["historie_nakupu"], play_ucely ["funkce","ucet"]).
   • Služba Google Play (domena androidpublisher.googleapis.com, ucel podle zadání).
   • Cookie aplikace (1 rok, technická, HttpOnly).
   • V aplikace doplnit hlavni_veta a snimky (viz design) a přepsat dlouhy_popis: zkušební doba 14 dní, tři varianty předplatného s cenami, nákup přímo v aplikaci přes Google Play s automatickým obnovením a zrušením v Google Play, ukázka bez registrace. Bez zmínky o faktuře.
   • balicek, nazev, kratky_nazev, popis, kategorie a otisky [] se nemění. Ostatní entity a retence se nemění.

8) play/piktogram.svg: kuchyňská linka podle designu, kóta v <g class="detail">.

9) play/ukazka.json, smyšlená ukázková data bez skutečných osob:
   • PUT /api/standard: „Dílna Ukázka – LTD 18“, záda 8 mm v drážce, sokl 100.
   • POST /api/materialy: „LTD 18 dub Sonoma H1145“ s vláknem, uloz materiál.
   • POST /api/zakazky: „Kuchyň Rodinný dům Lipová“, zákazník „Ukázka, Brno-Líšeň“, uloz zakazka.
   • PUT /api/zakazky/{zakazka} se dvěma stěnami:
     – Stěna A: 3600 × 2600, okno 1200/1200/1400 parapet 900, spodní skříňky 600 a 400 a dřez 800, horní 600 × 720.
     – Stěna B: 2400 × 2600, vysoká skříň 600 × 2100, rohová skříňka.
   • POST /api/kusovnik {zakazka_id}, uloz kusovnik.
   • Druhá zakázka „Vestavná skříň předsíň“.
   Tím se naplní všech 5 snímků.

10) play/co_je_noveho.txt (do 500 znaků, vykat): „Předplatné si nově koupíte přímo v aplikaci přes Google Play — obnovuje se samo a zrušíte ho kdykoli v Google Play. Na úvodní obrazovce najdete ceník variant Sólo, Standard a Tým. Tlačítkem Vyzkoušet ukázku si aplikaci projdete bez registrace na ukázkové kuchyni. Vaše zakázky, standard i kusovníky zůstávají beze změny.“

11) Spustit generátory a kontroly:
   • python vykresli_zasady.py → zásady, podmínky, zpracovatelská smlouva, odstoupení, záznam, incident.
   • python vykresli_aplikaci.py → manifest.webmanifest, ikony, offline.html, sw.js, assetlinks.json, web/ukazka.json, play/zaznam.json, play/BEZPECNOST_DAT.md a odkazy v index.html. Nic z toho needitovat ručně.
   • python kontrola_manifestu.py, node zkouska_rozpadu.mjs, python bezpecnostni_kontrola.py, python uat_kontrola.py, python vizualni_kontrola.py (360/390/820/1180/1440, světle i tmavě).

12) uat/scenare.json: doplnit akceptační scénáře níže a stávající ponechat. SPEC.md přepsat na build 10. Commit na build větev. Na .github/ se nesahá.

## Soubory
- cenik.js
- predplatne.js
- functions/api/objednavka.js
- web/index.html
- data-manifest.json
- db/migrace/0010_zkusebni_prechod.sql
- play/piktogram.svg
- play/ukazka.json
- play/co_je_noveho.txt
- uat/scenare.json
- SPEC.md
- web/play.js (doplní stavba, needitovat)
- functions/api/ukazka.js (doplní stavba, needitovat)
- functions/api/play.js (doplní stavba, needitovat)
- play_nakupy.js (doplní stavba, needitovat)
- db/migrace/0900_play_nakupy.sql (doplní stavba, needitovat)
- web/zasady.html, web/podminky.html, web/zpracovatelska-smlouva.html, web/odstoupeni-formular.html, ZAZNAM_O_ZPRACOVANI.md, POSTUP_PRI_INCIDENTU.md (generuje vykresli_zasady.py)
- web/manifest.webmanifest, web/sw.js, web/offline.html, web/ikona-*.png, web/.well-known/assetlinks.json, web/ukazka.json, play/zaznam.json, play/BEZPECNOST_DAT.md (generuje vykresli_aplikaci.py)

## Rizika
Rozdíl variant není definován. Schválený ceník popisuje obsah jen u Standardu („za firmu a měsíc“ platí u všech tří). Aplikace má jeden účet na e-mail, takže Sólo, Standard i Tým v této verzi odemknou totéž a nastaví stejné plati_do. Zákazník si tak rozumně koupí Sólo. Majitel musí doplnit, čím se Sólo a Tým liší (např. počet zařízení nebo uživatelů). Do té doby aplikace nic nevymýšlí a ceník jen zobrazuje doslova.

DPH: není řečeno, zda je 449 Kč s DPH. cena_dph v manifestu zůstává prázdné a v podmínkách se vykreslí červeně. Bez doplnění od majitele nejde do produkce.

Google Play: tři předplatné (ID např. kusovnik_solo, kusovnik_standard, kusovnik_tym) a jejich ceny v CZK musí majitel založit v Play Console. Google může zobrazit cenu po vlastním zaokrouhlení. Ke spuštění je dále potřeba service account pro androidpublisher a otisk podpisového klíče v otisky (assetlinks). Bez nich TWA ukáže adresní řádek a nákup nepůjde ověřit.

Zkrácení zkušební doby na 14 dní: migrace 0010 chrání účty registrované za 30 dní. Účet z tohoto okna se ale v Účtu zobrazí jako „předplatné do …“ místo „zkušební doba“ (poznámka v predplatne to vysvětluje). Majitel o tom má vědět.

Pravidla Google Play o placení mimo Play: obchodní podmínky a formulář odstoupení (generuje vykresli_zasady.py) popisují platbu fakturou a jsou z aplikace dostupné. Pokud play.js nebo generátor tyto pasáže v aplikaci neskryjí, hrozí výtka při kontrole. Je to věc šablony a v produktu se to ručně neupravuje. Recenzent to musí ověřit ve vydaném APK.

Ukázková data jsou veřejná (web/ukazka.json): nesmí obsahovat nic skutečného. Názvy jsou smyšlené, e-maily jen @example.cz.

Koexistence dvou plateb: zákazník s fakturou i Play by si mohl zaplatit dvakrát. play_nakupy.js prodlužuje plati_do od pozdějšího data, takže se nic neztratí, ale vrácení peněz za Play řeší Google, ne my.

## Jak ověřit
1) Web na telefonu (preview URL, 390 px):
   • Úvod ukazuje tři řádky ceníku přesně podle schválení, obří „449 Kč“ a „Prvních 14 dní zdarma“.
   • Klepnout na „Vyzkoušet ukázku“: otevře se Zakázky s „Kuchyň Rodinný dům Lipová“ a pruhem „Ukázka — data zmizí do 24 hodin“.
   • Zakázka → Kusovník ukáže díly a CSV se stáhne.
   • „Založit vlastní účet“ vrátí na Úvod.
2) Přihlásit se vlastním účtem, Účet:
   • Obří číslo 14 a stav zkušební doby.
   • Karta objednávky: vybrat Tým a 3 měsíce. Před tlačítkem je „SimteGen Kusovník – Tým — 890 Kč za firmu a měsíc“.
   • Zaškrtnout spotřebitele, objeví se souhlas podle § 1837 l). Tlačítko „Objednávka zavazující k platbě“ odešle objednávku.
3) Aplikace z interního testovacího kanálu Google Play na Android tabletu:
   • Běží bez adresního řádku.
   • V Účtu NENÍ karta objednávky ani slovo faktura nebo převod. Místo ní je nákup přes Google Play s podmínkami, automatickým obnovením a odkazem na zrušení.
   • Testovací nákup Standardu prodlouží „předplatné do …“ o měsíc a zakázky se dají dál upravovat.
   • Hardwarové Zpět vrací ze stěny do zakázky a ze zakázky do seznamu. Aplikace se nezavře uprostřed práce.
4) Účet s plati_do v minulosti: stěnu jde otevřít, ale uložení skříňky skončí toastem o vypršení a přechodem do Účtu. Export dat a smazání účtu fungují.
5) Kontroly v repu:
   • python kontrola_manifestu.py projde.
   • Po opětovném spuštění obou generátorů je git diff prázdný.
   • play/zaznam.json obsahuje hlavni_veta a 5 snímků. BEZPECNOST_DAT.md uvádí historii nákupů z play_nakupy.
   • vizualni_kontrola.py projde na 360–1440 px světle i tmavě.
   • uat_kontrola.py projde.

## Akceptační scénáře (CI je spustí proti API)
- Truhlář s účtem A — založí zakázku se skříňkou 600 × 720 × 510 s jednou policí a dvířky a vygeneruje kusovník — vidí 8 dílů včetně Bok, Traverza a Dvířka a CSV jde stáhnout.
- Truhlář s účtem B — načte seznam zakázek, kusovník účtu A podle jeho id a seznam objednávek — neuvidí žádnou zakázku, stěnu, kusovník ani objednávku účtu A (u cizího kusovníku dostane 404).
- Nově registrovaný truhlář — otevře /api/ja — vidí stav předplatného „zkusebni“ se 14 zbývajícími dny.
- Truhlář s účtem A na webu — odešle objednávku varianty Standard na 1 měsíc s cenou 449 Kč — objednávka se uloží s variantou „SimteGen Kusovník – Standard“ a cenou 449 a vrátí se mu v seznamu jeho objednávek.
- Truhlář s účtem A — odešle objednávku varianty Tým s cenou 449 Kč místo schválených 890 Kč — objednávka se odmítne hláškou, že se cena změnila, a nic se neuloží.
- Truhlář s vypršeným předplatným — zkusí uložit zakázku — dostane odpověď 402 „Předplatné vypršelo“, ale stažení vlastních dat přes /api/ucet/export mu dál projde.

_Schvaluje se přes ARGA (simtegen_approve_spec) nebo na mini PC._
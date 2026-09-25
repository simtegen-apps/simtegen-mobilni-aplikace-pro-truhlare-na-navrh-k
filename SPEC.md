# Specifikace — build 6

Vznikne mobilní aplikace (PWA + Google Play přes TWA), ve které truhlář přímo u zákazníka zadá rozměry stěn, oken, rohů a skříněk, vidí 2D pohled a půdorys s upozorněním na kolize, a jedním klepnutím dostane kompletní kusovník dílů — boky, dna, víka/traverzy, police, záda, dvířka a čela — spočítaný podle konstrukčního standardu jeho dílny, včetně olepení hran a odhadu počtu desek, s exportem CSV pro nářezové centrum. Zakázky, standard a materiály zůstávají v účtu, takže se měření dopracuje v dílně a starší zakázka se kopíruje jako šablona pro novou. Výpočet je deterministický kód na serveru, žádný jazykový model v cestě požadavku.

## Placená hodnota (proč přijde druhý nákup)
Platí se měsíční předplatné za to, že truhlář má u zákazníka v telefonu svůj dílenský konstrukční standard a všechny své zakázky — a druhý nákup přijde s další zakázkou na kuchyň (několikrát měsíčně), protože každá znamená znovu měřit a znovu vypsat kusovník, a starší zakázka se kopíruje jako šablona pro novou.

## Design (obrazovky, navigace, stavy)
Návrhový systém web/styl.css, žádné vlastní barvy ani písma, cíl ~390 px. Spodní .navigace má 3 položky: Zakázky · Standard · Účet. Obrazovky uvnitř zakázky se nasouvají přes ni a mají v .hlavicka vlastní tlačítko zpět; navíc history.pushState na každou obrazovku, aby v TWA bez adresního řádku fungovalo hardwarové tlačítko zpět. Cesta k hlavní hodnotě = 2 klepnutí (Zakázky → řádek zakázky → Kusovník).

1) ÚVOD/PŘIHLÁŠENÍ — největší věc: jedna věta co to dělá + cena + „30 dní zdarma“, pod tím pole na e-mail. Prázdný: nemá (vždy je co ukázat). Načítání: .kostra místo textů. Chyba: .hlaska.chyba „E-mail se nepodařilo odeslat, zkuste to prosím znovu.“ Úspěch: „Přihlašovací odkaz najdete v e-mailu.“

2) ZAKÁZKY (domovská) — největší věc: seznam zakázek (.seznam/.radek: název, datum, „47 dílů“). Dole .lista-dole „Nová zakázka“. Prázdný: .prazdno „Zatím tu není žádná zakázka. Začněte změřením stěny u zákazníka.“ + tlačítko. Načítání: tři .kostra řádky v obrysu seznamu. Chyba: .hlaska.chyba „Zakázky se nepodařilo načíst.“ + tlačítko „Zkusit znovu“.

3) ZAKÁZKA — PŘEHLED — největší věc: číslo „47 dílů“ nad seznamem stěn a skříněk. Akce „Přidat stěnu“, „Kopírovat jako šablonu“. Dole: „Vygenerovat kusovník“. Prázdný: .prazdno „Zakázka je prázdná — přidejte první stěnu.“ Načítání: kostra karty s číslem a dvou řádků. Chyba: hláška + návrat na Zakázky.

4) STĚNA — největší věc: .karta s 2D pohledem (inline SVG) na stěnu se skříňkami a oknem, v měřítku. Pod tím pole délka/výška, přepínače roh vlevo/vpravo, seznam otvorů a skříněk. Dole: „Přidat skříňku“. Prázdný: vykreslený obrys stěny + „Zatím žádná skříňka.“ Načítání: kostra v poměru pohledu. Chyba: .hlaska.chyba u uložení; .hlaska.varovani při kolizi (skříňka přes okno nebo mimo délku stěny).

5) SKŘÍŇKA (.panel zdola) — největší věc: tři velká číselná pole Š / V / H (inputmode="numeric"), pod nimi typ (spodní/horní/vysoká/rohová), počet polic, dvířek, zásuvek, materiál. Dole „Uložit skříňku“. Prázdný: předvyplněné výchozí rozměry podle typu. Chyba: text pod polem („Šířka musí být 100–1200 mm“), pole dostane .pole.chybne. Úspěch: .toast „Skříňka uložena.“

6) NÁHLED — největší věc: přepínač Pohled / Půdorys a SVG na celou šířku. Pod ním seznam varování. Prázdný: .prazdno „Přidejte stěnu, ať je co ukázat.“ Načítání: kostra v poměru obrázku. Chyba: .hlaska.chyba „Náhled se nepodařilo vykreslit.“

7) KUSOVNÍK — největší věc: „47 dílů · odhad 4 desky“. Pod tím díly seskupené podle materiálu (.seznam: „Bok 510 × 720 · 2 ks · hrana přední 2 mm“). Dole: „Stáhnout CSV“ + „Uložit do zakázky“. Prázdný: .prazdno „Nejdřív přidejte aspoň jednu skříňku.“ Načítání: kostra tabulky. Chyba: .hlaska.chyba „Kusovník se nepodařilo spočítat.“; při 402 „Předplatné vypršelo“ + odkaz na Účet. Úspěch: .toast „Kusovník uložen.“

8) STANDARD — největší věc: název standardu a tloušťka desky. Parametry (záda v drážce/nasazená, hloubka a odsazení drážky, spáry dvířek, odskok police, traverzy místo víka, olepení hran, rozměr s olepením, prořez, formát desky) s nápovědou a živým příkladem: „skříňka 600 → dno 564 × 510“. Dole „Uložit standard“. Prázdný: předvyplněný výchozí standard s vysvětlením. Chyba: pod polem. Úspěch: .toast.

9) ÚČET — ze šablony: stav předplatného, objednávka, schránka, stažení dat, smazání účtu. Stavy jak je má šablona.

Dotykové cíle 44 px, řádky 56 px, texty česky a zákazníkovi se vyká, nic nepřetéká na 390 px.

## Plán
1. MANIFEST — vyplnit `produkt`, `cena_dph` (návrh 490 Kč/měsíc včetně DPH, schvaluje majitel), `obsah_zakaznika_popis` („názvy a označení zakázek, rozměry místností, stěn a skříněk, poznámky truhláře“) a `subjekty_obsahu` („koncoví zákazníci truhláře“). Do `ukladame` přidat šest entit: standardy, materialy, zakazky, steny, skrinky, kusovniky (účel, pole, retence „do smazání účtu zákazníkem“). Do `uloziste_v_prohlizeci` přidat klíč `rozpracovana-zakazka` (localStorage, rozpracované měření bez signálu) — bez deklarace CI spadne. Přidat sekci `aplikace`: balicek `cz.simtegen.mobilni_aplikace_pro_truhlare_na_navrh_k`, nazev „Kusovník pro truhláře“, kratky_nazev „Kusovník“, popis „Návrh kuchyní u zákazníka a kusovník desek pro nářezové centrum.“, otisky [].

2. MIGRACE — `db/migrace/0007_standard.sql` (standardy, materialy), `0008_zakazky.sql` (zakazky, steny, skrinky), `0009_kusovniky.sql`. Každá tabulka má `uzivatel_id INTEGER NOT NULL REFERENCES uzivatele(id) ON DELETE CASCADE`, časy unixové sekundy, rozměry celá čísla v mm, indexy na (uzivatel_id) a (zakazka_id).

3. VÝPOČET — `rozpad.js` v kořeni (mimo `functions/`, jako `spolecne.js`): čisté funkce `rozpadSkrinky(skrinka, standard, material)`, `kusovnikZakazky(zakazka, standard)`, `odhadDesek(dily, standard)`, `zkontrolujKolize(stena)`. Vzorce: bok 2× H × V; dno (Š − 2t) × H; víko plné nebo u spodní řady 2× traverza (Š − 2t) × 100; police n× (Š − 2t) × (H − odskok); záda nasazená Š × V nebo v drážce (Š − 2t + 2d) × (V − 2t + 2d); dvířka n× šířka (Š − 2·spára_okraj − spára_mezi·(n−1))/n a výška V − 2·spára_okraj; čela zásuvek dělí přední plochu; rohová skříňka zkracuje použitelnou délku sousední stěny o H. Při `rozmer_s_olepenim` se rozměr zmenší o tloušťku hrany na olepených stranách. Odhad desek = police-packing (first-fit-decreasing) na formát desky s prořezem, označený jako odhad, ne nářezový plán.

4. API — `functions/api/zakazky.js` (GET seznam, POST nová), `zakazky/[id].js` (GET celý dokument se stěnami a skříňkami, PUT, DELETE), `zakazky/[id]/kopie.js` (POST — kopie jako šablona), `kusovnik.js` (POST: spočítá, uloží snapshot standardu i položek, vrátí), `kusovnik/[id].js` (GET), `kusovnik/[id]/csv.js` (GET, text/csv s hlavičkou a větou o kontrole rozměrů), `standard.js` (GET/PUT), `materialy.js` (GET/POST/DELETE). Každá produktová routa začíná `const stop = vyzadujPredplatne(context); if (stop) return stop;`. Účet, export, smazání a přihlášení se nehlídají.

5. FRONTEND — `web/index.html` přepsat na devět obrazovek podle pole design: třídy z `web/styl.css`, SVG kreslené inline (žádná knihovna), router přes `history.pushState` + `popstate` (kvůli hardwarovému tlačítku zpět v TWA), localStorage draft rozpracované zakázky, `window.CENIK = { mesic: 490, mena: "Kč" }`, texty úvodní obrazovky podle kontraktu kandidáta. Žádné volání ven kromě vlastního `/api/`.

6. GENERÁTORY A KONTROLA — spustit `python vykresli_zasady.py` (právní texty ze manifestu, nikdy ručně), `python vykresli_aplikaci.py` (manifest aplikace, ikony, offline stránka, service worker, assetlinks, odkazy v index.html), pak `python kontrola_manifestu.py` — musí projít čistě. Na `.github/` nesahat.

## Soubory
- data-manifest.json
- db/migrace/0007_standard.sql
- db/migrace/0008_zakazky.sql
- db/migrace/0009_kusovniky.sql
- rozpad.js
- functions/api/zakazky.js
- functions/api/zakazky/[id].js
- functions/api/zakazky/[id]/kopie.js
- functions/api/kusovnik.js
- functions/api/kusovnik/[id].js
- functions/api/kusovnik/[id]/csv.js
- functions/api/standard.js
- functions/api/materialy.js
- web/index.html
- web/zasady.html (generuje vykresli_zasady.py)
- web/podminky.html (generuje vykresli_zasady.py)
- web/zpracovatelska-smlouva.html (generuje vykresli_zasady.py)
- web/odstoupeni-formular.html (generuje vykresli_zasady.py)
- ZAZNAM_O_ZPRACOVANI.md (generuje vykresli_zasady.py)
- POSTUP_PRI_INCIDENTU.md (generuje vykresli_zasady.py)
- web/manifest.webmanifest, web/sw.js, web/offline.html, web/ikona-*.png, web/.well-known/assetlinks.json (generuje vykresli_aplikaci.py)

## Rizika
Největší riziko je chybný rozměr: truhlář podle kusovníku objedná řezané desky a chyba stojí peníze. Proto jsou všechny parametry standardu vidět s živým příkladem („skříňka 600 → dno 564 × 510“), ke každému kusovníku se ukládá snapshot parametrů, počítá se jen v celých milimetrech a export nese větu „Rozměry před odesláním do nářezového centra zkontrolujte“.

Formát CSV se u nářezových center liší — v1 má jeden obecný formát (materiál, díl, délka, šířka, ks, hrany po stranách, vlákno); od zákazníka nula si hned vyžádat šablonu jeho centra.

Vědomě chybí kování a šuplíkové boxy (v1 počítá jen čela zásuvek), 3D a skutečný nářezový plán s rozkresem. U zákazníka nula ověřit, zda to není pro demo překážka.

Cena 490 Kč/měsíc je návrh v rozpětí ze složky (299–590 Kč) — schvaluje majitel, bez schválení zůstane „ceník sdělí provozovatel“.

Rozsah proti termínu „za pár dní“: držet se 2D pohledu a odhadu desek, nepouštět se do optimalizace nářezu.

Offline: měření se drží v localStorage (deklarováno v manifestu), ale generování kusovníku vyžaduje připojení — v UI se to řekne, aby to u zákazníka bez signálu nepřekvapilo.

## Jak ověřit
Otevřít preview URL na telefonu a přihlásit se vývojovým odkazem, pak:
1) Standard nechat výchozí (tloušťka 18, záda v drážce 8/10, spára okraj 2 a mezi 3, odskok police 20, traverzy u spodní řady 100).
2) Nová zakázka „Ukázka — kuchyň“, stěna 3600 × 2600, okno od 1200, šířka 1200, parapet 900.
3) Přidat spodní skříňku 600 × 720 × 510, 1 police, 1 dvířka.
4) Klepnout „Vygenerovat kusovník“ — musí vyjít přesně 8 dílů: bok 2× 510 × 720, dno 1× 564 × 510, traverza 2× 564 × 100, police 1× 564 × 490, záda 1× 580 × 700, dvířka 1× 597 × 717. Když nesedí jediné číslo, výpočet se nesmí vydat.
5) Přidat skříňku, která zasahuje do okna — na obrazovce Náhled i Stěna musí naskočit varování.
6) „Stáhnout CSV“ — soubor se otevře v tabulkovém editoru, sloupce materiál, díl, délka, šířka, ks, hrany, vlákno.
7) „Kopírovat jako šablonu“ — vznikne nová zakázka se stejnými stěnami a skříňkami, změna v ní neovlivní původní.
8) Odhlásit se a přihlásit na druhém zařízení — zakázka i standard tam jsou.
9) Na 390 px nic nepřetéká vodorovně, hlavní tlačítko je dole v dosahu palce, každá obrazovka má vlastní tlačítko zpět a v nainstalované aplikaci funguje hardwarové zpět.
10) `python kontrola_manifestu.py` projde bez chyb.

_Schvaluje se přes ARGA (simtegen_approve_spec) nebo na mini PC._
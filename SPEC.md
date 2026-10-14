# Specifikace — build 8

Build 7 rozšíří běžící Kusovník pro truhláře přesně o tři věci, které hlásí platící truhlář. Za prvé opraví chybu, kdy se okno nebo dveře „uloží“, ale nepřidají. Příčina je v tom, že po automatickém uložení se celý dokument zakázky v telefonu vymění za odpověď serveru a obrazovka Stěna dál zapisuje do starého, už odpojeného objektu. Za druhé udělá z výkresu stěny pracovní plochu: skříňky, okna i dveře půjde posouvat prstem nebo myší s přichytáváním na 10 mm a k sousedním hranám, za úchyt půjde měnit délka a výška stěny a během tahu budou vidět kóty. Za třetí přidá obrazovku Prostor s půdorysem všech místností zakázky. Ta bude zakreslovat okna a dveře, ukáže, o kolik se nesejde součet naměřených stěn, umí dopočítat chybějící stěnu a nabídne rozvinutý pohled celé místnosti. Výpočet kusovníku, standard, účty, platby a navigace se nemění.

## Placená hodnota (proč přijde druhý nákup)
Platí se dál stejné měsíční předplatné: truhlář má u zákazníka v telefonu svůj dílenský standard, všechny zakázky a hned z nich kusovník. Build 7 k tomu přidá, že rozestavení kuchyně se ve výkresu domluví přímo se zákazníkem a půdorys hned prozradí chybu v měření. Proto se truhlář vrací s každou další kuchyní, kterou měří, typicky několikrát měsíčně, a starou zakázku přitom použije jako šablonu.

## Design (obrazovky, navigace, stavy)
BARVA PRODUKTU: zůstává jedlová zelená #2f6b43 (tmavý režim #4fa36b), už je ve web/produkt.css. Kontrast na papíře #f6f4ef vychází asi 5,8:1, tedy nad požadovanými 4,5:1. Proč: jehličnatá zelená drží dílenský tón, čte se jako text a nepere se s černým inkoustem výkresu. Ve výkresu dál znamená jen „tohle je čelo nebo úchytka“. Nově navíc označuje vybraný prvek v režimu úprav: obrys v barvě produktu, nikdy jako plocha pod textem. Hlavní tlačítko je vždy černé.

NAVIGACE: beze změny, 3 položky (Zakázky · Standard · Účet). Obrazovky uvnitř zakázky mají v .hlavicka vlastní tlačítko zpět a každá dělá history.pushState, aby v TWA fungovalo hardwarové zpět. Nová obrazovka Prostor nahrazuje dosavadní Náhled, takže se počet obrazovek nezvětší. Cesty k hodnotě: Zakázky → zakázka → Prostor jsou 2 klepnutí, Zakázky → zakázka → Vygenerovat kusovník také 2, Zakázky → zakázka → stěna → Upravit ve výkresu 3.

OBRAZOVKY (měněné podrobně, ostatní beze změny)

1) STĚNA (měněná)
- Obří číslo: „1 240 mm volné ve spodní řadě“ (.cislo-radek nad výkresem). Je to délka stěny mínus spodní skříňky a dveře, takže truhlář hned vidí, kolik místa zbývá. Při kolizi se místo něj ukáže stav „2 kolize“.
- Hlavní akce: „Přidat skříňku“. V režimu úprav ji nahradí „Hotovo“ a vedle je jediná vedlejší akce „Vrátit posun“.
- Sekce:
  - 01 — Výkres. Odkaz vpravo „Upravit ve výkresu →“ přepíná režim úprav.
  - 02 — Rozměry stěny: délka, výška, název, roh vlevo/vpravo a nově „Na konci stěny zatáčí: dovnitř / ven“, kvůli místnostem tvaru L.
  - 03 — Okna a dveře.
  - 04 — Skříňky.
- Režim úprav:
  - Klepnutí vybere prvek (obrys v barvě produktu).
  - Tahem se posouvá: skříňka vodorovně, okno vodorovně i svisle (mění se parapet), dveře vodorovně.
  - Úchyt na pravém okraji stěny mění délku, úchyt nahoře výšku.
  - Přichytává se na 10 mm a k hranám sousedních skříněk, otvorů a konců stěny (tolerance 30 mm).
  - Pod lištou je vybraný prvek s tlačítky ←/→ (na okně i ↑/↓) po 10 mm, na notebooku šipky po 10 mm a se Shiftem po 100 mm.
  - SVG dostane touch-action: none jen v režimu úprav, mimo něj se stránka normálně posouvá.
  - Ukládá se až po puštění prstu (jedno zmeneno() na tah, ne na každý pohyb).
- Detail, který nese informaci oboru: živé mono kóty během tahu („od kraje 1 250 · k oknu 40 · k sousedce 0 mm“). Při kolizi se prvek obarví na --barva-chyba hned během tahu, ne až po uložení.
- Tablet (768–1199 px): .mrizka, vlevo .s8 přilepený výkres, vpravo .s4 sekce 02–04. Vybraný prvek se upravuje přímo v pravém sloupci místo spodního panelu, takže výkres zůstává vidět.
- Notebook (≥ 1200 px): výkres přes 8 sloupců ve větším měřítku, vpravo seznam otvorů a skříněk jako .tabulka (typ, od, Š × V × H) a klávesové posuny.
- Stavy:
  - Prázdný: obrys stěny s kótou + .prazdno „Zatím žádná skříňka. Přidejte první — rozměry jsou předvyplněné.“ s tlačítkem.
  - Načítání: .kostra v poměru výkresu.
  - Chyba: .hlaska.varovani „Zatím neuloženo — změny máte v telefonu, uložíme je, jakmile bude signál.“ a u kolize .hlaska.varovani s větou z kolize.js.
  - Úspěch: .toast „Okno přidáno.“ / „Skříňka posunuta na 1 250 mm.“

2) PROSTOR (náhrada Náhledu)
- Obří číslo / stav: „Odchylka uzavření 35 mm“, tedy o kolik se konec poslední stěny nesejde se začátkem první. Je to kontrola měření. Při odchylce ≤ 10 mm se ukáže „Sedí“ s podlahovou plochou „12,4 m²“. U neuzavřené místnosti „Otevřený půdorys · 2 stěny“.
- Hlavní akce: „Vygenerovat kusovník“.
- Sekce:
  - 01 — Půdorys / Rozvinutý pohled (přepínač v odkazu sekce).
  - 02 — Místnosti: řádky „Kuchyň · 4 stěny · 12,4 m²“, odkaz „Přidat místnost →“, u otevřeného půdorysu řádek „Dopočítat chybějící stěnu (2 800 mm)“.
  - 03 — Kontrola: varování ze všech stěn, u více místností s předponou místnosti.
- Detail oboru:
  - Zdi šrafované na 45° jako řez.
  - Okno je mezera ve zdi s tenkou dvojitou čarou, dveře mezera s mono popiskem „D 900“.
  - Délky stěn jsou kótované.
  - Horní řada skříněk čárkovaně, čelo silnou čarou v barvě produktu.
  - Rozvinutý pohled ukáže stěny místnosti vedle sebe s kótou celkového obvodu.
- Klepnutí na zeď v půdorysu otevře její Stěnu.
- Režim „Upravit rozmístění“ (jen když je víc místností): místnost jde posouvat tahem, „Otočit o 90°“, přichytává se roh k rohu sousední místnosti (tolerance 150 mm).
- Tablet: půdorys .s8, sekce 02 a 03 v .s4.
- Notebook: půdorys nahoře přes 8 sloupců, pod ním rozvinutý pohled vybrané místnosti, vpravo místnosti a kontrola.
- Stavy:
  - Prázdný: .prazdno „Přidejte stěnu, ať je co ukázat.“ s tlačítkem „Přidat stěnu“.
  - Načítání: .kostra v poměru půdorysu.
  - Chyba: .hlaska.chyba „Půdorys se nepodařilo vykreslit — zkontrolujte délky stěn.“ a pod tím seznam stěn jako odkazy.
  - Úspěch: .hlaska.uspech „Nic se nepřekrývá a půdorys se uzavírá.“

3) ZAKÁZKA (drobná změna)
- Obří číslo zůstává (díly v kusovníku / skříňky v zakázce).
- Sekce 01 — Stěny se při víc místnostech dělí podle místnosti (mono podnadpis „KUCHYŇ · 4 STĚNY“).
- „Přidat stěnu“ přidá stěnu do naposledy otevřené místnosti.
- Akce „Náhled a kontrola“ se jmenuje „Prostor a kontrola“.
- Stavy beze změny (prázdný, kostra, chyba s návratem na Zakázky).

4) PANEL MÍSTNOST (nový .panel zdola)
- Hlavní číslo: počet stěn a plocha.
- Pole: název („Kuchyň“, „Spíž“).
- Hlavní akce „Uložit místnost“, varovná „Smazat místnost“ (jen bez skříněk, jinak vysvětlí proč nejde).
- Chyba: text pod polem „Napište název místnosti.“
- Úspěch: .toast „Místnost uložena.“

5) PANEL OKNO / DVEŘE (oprava)
- Stejná pole jako dnes, k tomu kontrola, že otvor leží na stěně: „Okno přesahuje stěnu o 120 mm.“ a pole dostane .pole.chybne.
- Úspěch: .toast „Okno přidáno.“ / „Dveře přidány.“, a prvek je ve výkresu hned vidět.

6) PANEL SKŘÍŇKA, KUSOVNÍK, STANDARD, ÚČET, ZAKÁZKY, ÚVOD: beze změny proti buildu 6, včetně stavů. Jen texty varování v kusovníku nesou při víc místnostech název místnosti.

Dotykové cíle ≥ 44 px, úchyty ve výkresu mají neviditelnou zásahovou plochu ≥ 44 px. Na 360 px nic nepřetéká. Texty česky a vykají.

## Plán
1. OPRAVA OKEN A DVEŘÍ (web/index.html):
   - Zavést stav.revize, která se zvýší při každém zmeneno().
   - ulozNaServer() pošle snímek dokumentu s číslem revize. Po odpovědi převezme jen zakazka.zmeneno a posledni_kusovnik a stav.dokument.steny nikdy nepřepíše. Když se revize během letu změnila, naplánuje další uložení.
   - panelOtvor, panelSkrinka, napojení polí stěny a smazání si stěnu dohledají jako stav.dokument.steny[stenaIndex] až v okamžiku akce, ne z uzávěru.
   - Logiku sloučení (slouc​itPoUlozeni) dát jako čistou funkci do web/prostor.js, aby šla ověřit bez prohlížeče.

2. MIGRACE db/migrace/0010_mistnosti.sql:
   - CREATE TABLE mistnosti (id, uzivatel_id NOT NULL REFERENCES uzivatele ON DELETE CASCADE, zakazka_id NOT NULL REFERENCES zakazky ON DELETE CASCADE, poradi, nazev, x_mm, y_mm, otoceni ∈ {0,90,180,270}, vytvoreno) s indexem (uzivatel_id, zakazka_id, poradi).
   - ALTER TABLE steny ADD COLUMN mistnost_id INTEGER; ADD COLUMN zatoceni TEXT NOT NULL DEFAULT 'dovnitr'.
   - Převod existujících dat: pro každou zakázku se stěnami vložit „Místnost 1“ (INSERT … SELECT DISTINCT uzivatel_id, zakazka_id FROM steny) a UPDATE steny SET mistnost_id podle zakázky.
   - Rozměry zůstávají celá čísla v mm.

3. SERVER (zakazky_data.js):
   - Přidat ocistiMistnost: název do 60 znaků, x/y omezené na ±50 000 mm, otočení na násobek 90.
   - ocistiStenu dostane zatoceni ('dovnitr' | 'ven') a index místnosti.
   - ulozDokument smaže a zapíše i mistnosti. Místnosti se vkládají jako první (RETURNING id), stěny se namapují přes index; stěny se dávkují přes env.DB.batch s RETURNING, aby uložení zůstalo pod sekundou. Limit stěn se zvedne z 12 na 40 a místností je nejvýš 8.
   - Tělo bez mistnosti znamená jednu „Místnost 1“, takže staré koncepty v localStorage jdou dál.
   - nactiDokument vrací mistnosti[] a u každé stěny mistnost (index) a zatoceni.
   - functions/api/zakazky/[id].js:
     - DELETE maže i mistnosti.
     - PUT bez klíče mistnosti na zakázku, která má víc než jednu místnost, vrátí 409 „Aplikace se mezitím aktualizovala — obnovte ji prosím, ať nepřijdete o místnosti.“ (ochrana proti starému otevřenému klientovi).
   - kopie.js funguje beze změny přes ulozDokument; jen se ověří, že kopíruje i místnosti a otvory.
   - kusovnik.js: při víc místnostech dostanou varování předponu názvu místnosti. Rozpad (rozpad.js) se nemění, takže referenční 8 dílů platí dál.

4. SDÍLENÁ GEOMETRIE web/prostor.js (čisté ESM jako web/kolize.js, bez závislostí):
   - obrysMistnosti(mistnost, steny): úsečky zdí, otvory a skříňky v půdorysu, s otočením a polohou místnosti a zatočením dovnitř/ven.
   - odchylkaUzavreni() v mm.
   - plochaMistnosti() v m², jen u uzavřené.
   - chybejiciStena(), jen když je mezera rovnoběžná s osou.
   - prichytni(hodnota, kandidati, krok=10, tolerance=30).
   - volnoVeSpodniRade(stena).
   - sloucitPoUlozeni().
   - Ruční zkouška zkouska_prostoru.mjs (vzor zkouska_rozpadu.mjs): obdélník 3600/2800/3600/2800 → odchylka 0 a plocha 10,08 m²; stěny 3600/2800/3565 → chybějící stěna 2800 a odchylka 35 mm; posun skříňky na 1 236 se přichytí na hranu okna 1 200 + 40 → 1 240; sloučení nepřepíše otvor přidaný během letu.

5. FRONTEND (web/index.html, třídy jen ze styl.css, žádná knihovna):
   - Režim „Upravit ve výkresu“ na obrazovce Stěna: pointerdown/move/up se setPointerCapture, hit-test na data-prvek v SVG, převod px→mm přes getScreenCTM, úchyty délky a výšky stěny, živé kóty, ←/→/↑/↓ po 10 mm, klávesnice, jednoúrovňové „Vrátit posun“, zmeneno() až po puštění.
   - Obrazovka Prostor (o-prostor místo o-nahled; window.ukaz('nahled') přesměruje): půdorys z prostor.js s okny a dveřmi a kótami, rozvinutý pohled, panel Místnost, „Dopočítat chybějící stěnu“, „Upravit rozmístění“ (posun a otočení místnosti).
   - Rozvržení .mrizka .s8/.s4 pro tablet a notebook.
   - Prvky SVG v režimu úprav mají role="button", tabindex="0" a aria-label („Okno 1200 × 1400, od 1200 mm“).
   - Vlastní CSS jen na úrovni rozvržení (touch-action, kurzor tahu, zásahové plochy), žádné barvy v HTML.

6. MANIFEST (data-manifest.json):
   - Nová entita mistnosti: účel „místnosti zakázky a jejich rozmístění v půdorysu“; pole „odkaz na účet a zakázku, pořadí, název místnosti, poloha v půdorysu v mm a natočení, čas“; retence „se zakázkou, nejpozději do smazání účtu zákazníkem“.
   - U steny doplnit do pole „příslušnost k místnosti, zatočení na konci stěny“.
   - Každé položce ukladame doplnit play_typy, play_ucely a play_volitelne:
     | Entita | play_typy | play_ucely | play_volitelne |
     |---|---|---|---|
     | uzivatele | [email, id_uzivatele] | [ucet] | – |
     | prihlasovaci_odkazy | [email] | [ucet, bezpecnost] | – |
     | relace | [] | [ucet, bezpecnost] | – |
     | predplatne | [historie_nakupu] | [ucet] | – |
     | platby | [historie_nakupu] | [ucet] | – |
     | objednavky | [jmeno, adresa, historie_nakupu] | [funkce, ucet] | – |
     | hlaseni | [zpravy] | [komunikace] | true |
     | standardy, materialy, steny, skrinky, mistnosti, kusovniky | [obsah_uzivatele] | [funkce] | – |
     | zakazky | [obsah_uzivatele, osobni_jine] | [funkce] | – |
   - Do sekce aplikace doplnit:
     - kategorie BUSINESS.
     - kontakt_email: provozní e-mail, který doplní majitel; nahoře je zatím prázdný a nesmí se vymyslet.
     - dlouhy_popis, česky a jen pravda: měření stěn, oken, dveří a skříněk u zákazníka, výkres stěny s posunem prvků, půdorys místností s kontrolou měření, kusovník podle vlastního konstrukčního standardu dílny s olepením hran a odhadem desek, export CSV pro nářezové centrum, kopie zakázky jako šablona, měsíční předplatné s 30 dny zdarma, data v EU, export a smazání účtu.
   - balicek, nazev, kratky_nazev, popis a otisky beze změny. Na uloziste_v_prohlizeci a cookies se nesahá.

7. GENERÁTORY A KONTROLY:
   - python vykresli_zasady.py (právní texty z manifestu, nikdy ručně).
   - python vykresli_aplikaci.py (manifest aplikace, ikony, sw.js, offline.html, assetlinks, play/zaznam.json, play/BEZPECNOST_DAT.md, odkazy v index.html).
   - python kontrola_manifestu.py musí projít čistě.
   - Spustit node zkouska_rozpadu.mjs a node zkouska_prostoru.mjs.
   - Spustit vizualni_kontrola.py na 360/390/820/1180/1440 px, světle i tmavě.
   - Na .github/ se nesahá.

8. UAT: do uat/scenare.json přidat akceptační scénáře z této specifikace (viz akceptace) bez zásahu do stávajících. Ve tělech se nepoužívá typ 'spodni' (viz poznámka v souboru).

## Soubory
- web/index.html
- web/prostor.js
- zakazky_data.js
- functions/api/zakazky/[id].js
- functions/api/zakazky/[id]/kopie.js (jen ověření, případně komentář)
- functions/api/kusovnik.js
- db/migrace/0010_mistnosti.sql
- data-manifest.json
- zkouska_prostoru.mjs
- uat/scenare.json
- web/zasady.html, web/podminky.html, web/zpracovatelska-smlouva.html, web/odstoupeni-formular.html, ZAZNAM_O_ZPRACOVANI.md, POSTUP_PRI_INCIDENTU.md (generuje vykresli_zasady.py)
- web/manifest.webmanifest, web/sw.js, web/offline.html, web/ikona-*.png, web/.well-known/assetlinks.json, play/zaznam.json, play/BEZPECNOST_DAT.md (generuje vykresli_aplikaci.py)

## Rizika
- Ztráta dat při ukládání: chyba oken vznikla výměnou dokumentu po uložení. Oprava mění jádro ukládání, a kdyby se pokazila, mohly by mizet i skříňky. Proto je sloučení čistá funkce s ruční zkouškou a UAT po uložení ověřuje okno i skříňku zároveň.
- Starý otevřený klient: SW je network-first, ale otevřená karta nebo TWA může držet starý kód a jeho PUT bez místností by sloučil víc místností do jedné. Ochrana: server vrátí 409 a místnosti nechá být. Staré koncepty v localStorage bez místností se uloží do „Místnost 1“.
- Migrace přidává sloupce do živé tabulky steny a převádí data. Před nasazením spustit nad kopií produkční D1 a porovnat počty stěn a skříněk před a po.
- Přesnost tahu na telefonu: 3,6 m stěny na 360 px je zhruba 10 mm na pixel. Proto přichytávání na 10 mm, šipky po 10 mm a přesné číslo dál v poli panelu. Výkres v režimu úprav se dá otočit na šířku.
- Konflikt gesta s posouváním stránky: touch-action: none platí jen v režimu úprav a jen na SVG.
- Dva přístroje najednou (tablet u zákazníka, PC v dílně) dál fungují podle pravidla „poslední zápis vyhrává“ jako dosud. Slučování mezi zařízeními se v této verzi vědomě neřeší, protože zákazník ho nežádal.
- Půdorys počítá jen pravé úhly (zatočení dovnitř a ven). Šikmé stěny a arkýře ukáže jako otevřený půdorys s odchylkou, nepočítá je. Chybějící stěnu dopočítá jen při mezeře rovnoběžné s osou.
- Dveře v půdorysu se kreslí jako mezera s popiskem, bez oblouku otevírání: směr otevírání se neměří a vymyšlený oblouk by klamal.
- kontakt_email je v manifestu prázdný a vykresli_aplikaci.py / záznam v obchodě ho potřebuje. Doplní ho majitel, nesmí se vymyslet. Do té doby nejde aplikace do Play.
- Rozsah: žádné 3D, žádná změna rozpadu ani ceny, žádná nová položka navigace. Kusovník musí pro referenční skříňku dál dávat přesně 8 dílů.

## Jak ověřit
Na telefonu (390 px) otevřít preview URL, přihlásit se vývojovým odkazem a projít:
1) Otevřít existující zakázku → stěnu → „Přidat“ u Oken a dveří → okno od 1200, šířka 1200, výška 1400, parapet 900 → Uložit. Okno musí být hned ve výkresu i v seznamu, a po 2 s (po automatickém uložení) přidat druhé okno a dveře – i ty zůstanou. Obnovit stránku: všechny tři otvory tam jsou. Pro kontrolu stejné kroky zopakovat rychle za sebou během „Ukládám…“.
2) Na stěně „Upravit ve výkresu“: přetáhnout skříňku k oknu – přichytí se na hranu, kóta ukazuje vzdálenost. Přetáhnout ji do okna – obarví se červeně a nahoře naskočí varování. „Vrátit posun“ ji vrátí. Šipkou → posunout o 10 mm.
3) Za pravý úchyt zkrátit stěnu na 3000 mm: pole Délka ukáže 3000, skříňka za koncem je červená s větou „přesahuje délku stěny o … mm“. Obří číslo „volné ve spodní řadě“ se přepočítá.
4) Zakázka → „Prostor a kontrola“: zadat 3 stěny 3600/2800/3565. Prostor ukáže „Odchylka uzavření 35 mm“ a nabídne „Dopočítat chybějící stěnu (2 800 mm)“. Po dopočtu a opravě 3565 na 3600 se ukáže „Sedí · 10,08 m²“. Okna a dveře jsou zakreslené ve zdech, klepnutí na zeď otevře stěnu.
5) Přidat místnost „Spíž“ se dvěma stěnami, v „Upravit rozmístění“ ji přisunout k rohu kuchyně a otočit o 90°. Obnovit stránku: poloha drží.
6) Vygenerovat kusovník: referenční skříňka 600 × 720 × 510 dá dál přesně 8 dílů (bok 2× 510 × 720, dno 564 × 510, traverza 2× 564 × 100, police 564 × 490, záda 580 × 700, dvířka 597 × 717).
7) Kopírovat zakázku jako šablonu: kopie má obě místnosti, okna a polohy.
8) Tablet (820 px) a notebook (1440 px): výkres vlevo, vlastnosti vpravo. Výkres při úpravě nezmizí pod panelem, na notebooku fungují šipky.
9) V nainstalované aplikaci hardwarové zpět vrací Prostor → Zakázka → Zakázky a nic nepřetéká vodorovně.
10) python kontrola_manifestu.py, node zkouska_rozpadu.mjs, node zkouska_prostoru.mjs a uat_kontrola.py projdou bez chyb.

## Akceptační scénáře (CI je spustí proti API)
- Účet A uloží zakázku se stěnou 3600 × 2600 a oknem od 1200 mm, šířky 1200 mm, s parapetem 900 mm a znovu ji načte — v odpovědi musí vidět to okno se stejnými čísly a vedle něj beze změny i dříve uloženou skříňku.
- Účet A uloží zakázku se dvěma místnostmi (Kuchyň se čtyřmi stěnami 3600/2800/3600/2800 a Spíž s polohou 3600 mm, 0 mm a natočením 90°) a znovu ji načte — musí vidět obě místnosti s polohou a natočením a každou stěnu u správné místnosti.
- Účet A posune spodní skříňku 600 × 720 × 510 tak, že zasahuje do okna, a vygeneruje kusovník — musí vidět 8 dílů a varování, že skříňka zasahuje do okna.
- Účet A zkopíruje zakázku se dvěma místnostmi a oknem jako šablonu — v nové zakázce musí vidět obě místnosti, okno i skříňky a změna kopie nesmí změnit původní zakázku.
- Účet A pošle úpravu zakázky se dvěma místnostmi bez seznamu místností (starý klient) — musí dostat odpověď 409 a při dalším načtení dál vidět obě místnosti.
- Účet B zkusí načíst, uložit a zkopírovat zakázku účtu A — pokaždé dostane 404 a v jeho seznamu zakázek ani v exportu dat se neobjeví názvy místností, stěn ani zakázky účtu A.

_Schvaluje se přes ARGA (simtegen_approve_spec) nebo na mini PC._
# Specifikace — build 16

Kusovník pro truhláře dostane druhý jazyk, angličtinu. Celé vlastní rozhraní produktu jde přepnout jedním klepnutím: úvod a přihlášení, zakázky, stěna, náhled pro zákazníka, kusovník, standard a účet. Kusovník půjde stáhnout jako anglické CSV pro nářezové centrum. Data, API, výpočty, vzhled ani ceník se nemění. Volba jazyka se drží v zařízení, výchozí zůstává čeština, takže stávající zákazníci nic nezaznamenají.

## Placená hodnota (proč přijde druhý nákup)
Platí se dál stejné předplatné 449 Kč za firmu a měsíc za uložené zakázky a kusovník při každé kuchyni. Angličtina ho otevírá dílnám, kde měří nebo řežou lidé bez češtiny, a zakázkám pro anglicky mluvící zákazníky, kterým truhlář ukáže náhled kuchyně v jejich jazyce. Protože tyhle zakázky přicházejí pořád znovu, platící zákazník, který si o funkci řekl, má důvod platit dál, a s ním každá dílna se smíšenou partou.

## Design (obrazovky, navigace, stavy)
Barva produktu se nemění: jedlová zelená #2f6b43 (tmavý režim #4fa36b). Na papíře #f6f4ef má kontrast asi 5,8:1. Jehličnatá zelená drží dílenský tón, je čitelná jako text a nepere se s černým inkoustem výkresu. Stavba nepřidává žádnou obrazovku a nemění rozvržení. Každá obrazovka vypadá v EN stejně jako v češtině, jen s anglickými texty. Navigace zůstává tři položky (Zakázky / Jobs, Standard / Workshop standard, Účet / Account), hlavní hodnota je dál na dvě až tři klepnutí (zakázka → kusovník).

PŘEPÍNAČ JAZYKA (jedna volba, tři místa, žádné nové černé tlačítko):
1) Úvod: v patičce textové tlačítko „English“ (v EN „Česky“). Hlavní akcí zůstává „Poslat přihlašovací odkaz“ a přihlašovací formulář i volání POST /api/navsteva {stranka:"uvod"} zůstávají beze změny.
2) Účet: nová malá sekce „Jazyk aplikace / App language“ se dvěma volbami .volba (Čeština, English). Změna platí hned, toast „Jazyk změněn.“ / „Language changed.“.
3) Náhled: v liště dole vedle hlavní akce „Vygenerovat kusovník“ přibude vedlejší tlačítko „English version“ (v EN „Česká verze“). Je pro chvíli, kdy truhlář ukazuje kuchyň anglicky mluvícímu zákazníkovi.
Po přepnutí se aktuální obrazovka vykreslí znovu na stejném místě, bez návratu na začátek, a nastaví se <html lang="en">. Volba přežije obnovení stránky i restart aplikace (localStorage `jazyk`).

OBRAZOVKY (typ, hlavní akce, co se v EN mění):
• Úvod / přihlášení (přehled, 3 sekce: co to dělá, cena, přihlášení): hlavní akce „Poslat přihlašovací odkaz“ / „Send sign-in link“. Ukázkový výkres stěny je stejný. Cena zůstává ve tvaru „449 Kč“ přes SimteGen.kc (měna je CZK). V EN věta „Legal documents and help are in Czech.“ u patičky. Stavy: chyba odeslání anglicky s radou, co udělat; úspěch „Check your e-mail…“.
• Zakázky / Jobs (přehled): hlavní akce „New job“. Prázdný stav: věta „Your jobs will appear here — start by measuring the first kitchen.“, tlačítko „New job“ a tlačítko šablony data-ukazkova-data (text kreslí šablona). Načítání: stávající kostry. Chyba: „Jobs could not be loaded — check your connection and try again.“ + „Try again“.
• Zakázka / Job (přehled): hlavní akce beze změny (přidat stěnu / kusovník), jen přeložené. Prázdný stav „Add the first wall you measured.“. Chyba a načítání stejně jako dnes, anglicky.
• Stěna / Wall (nástroj, výkres přes celou plochu, beze změny chování): kreslí se stěna s okny a dveřmi a skříňky s dvířky, zásuvkami a policemi. Kóty jsou v mm (čísla se nepřekládají) a celková délka „3600 mm“. Nástroje a předpřipravené díly: base 60, wall 60, tall, corner (Spodní/Horní/Vysoká/Rohová). Vlastnosti vybrané skříňky mají anglické popisky polí. Hlavní akce „Add cabinet“. Hlášky kolizí jsou v EN přeložené („Base 600×720×510: overlaps the window (opening from 1200 mm, width 1200 mm).“). Prázdná stěna: kóta celé délky a „Add the first cabinet“. Uložení: „Saved“ / „Saving…“ / „Not saved yet — your measurements are on this device and will be saved when you are back online.“. aria-label výkresu a seznam dílů pro čtečku jsou anglicky.
• Náhled / Customer preview (nástroj): pohled na stěny a půdorys, legenda „Cabinet · Window and door · Shelf (hidden edge)“, kontrola „Nothing overlaps and nothing blocks a window.“. Hlavní akce „Generate cutting list“, vedlejší přepínač jazyka. Prázdný stav: „Add a wall so there is something to show.“.
• Kusovník / Cutting list (přehled, číslo nese informaci: počet dílů, odhad desek, m²): díly se jmenují Side panel, Bottom, Top, Rail, Shelf, Back panel (in groove / overlaid), Drawer front, Door. Olepení: „front edge 0.8 mm“, „no edging“. V EN se píše desetinná tečka. Hlavní akce „Download CSV“, které stáhne anglické CSV, vedlejší „Done“. Varování z uloženého kusovníku se přeloží při zobrazení. Načítání: kostra tabulky. Chyba: „The cutting list could not be calculated — go back to the job and try again.“. Prázdný stav: „Add at least one cabinet first.“.
• Standard / Workshop standard (přehled, 3 sekce formuláře): hlavní akce „Save standard“. Popisky a nápovědy 15 polí jsou přeložené (Board thickness (mm), Back panel thickness (mm), Gap around fronts (tenths of mm), …). Stavy jako dnes, anglicky.
• Účet / Account (přehled): stav předplatného, nová sekce jazyka, hlášení, „Download my data“, „Sign out“, „Delete account and all data“. Potvrzovací dialogy SimteGen.potvrd dostanou anglický text i tlačítka ano/ne. Fakturační objednávka (data-objednavka, jen na webu) má přeložené popisky a větu „Terms and the invoice are in Czech.“. V aplikaci z Google Play zůstává skrytá jako dnes.
Rozložení na tabletu a notebooku se nemění: nástroj od 1000 px výkres vlevo a vlastnosti vpravo, přehledy v .mrizka / .dva-sloupce. Anglické texty jsou kratší než české, takže nic nepřeteče. Ověří to vizuální kontrola i pro EN.

Co zůstává česky i v EN režimu (kreslí to šablona, needituje se): pruh zkušební doby a cesta k platbě, offline pruh, toast „Vrátit“, formulář Nahlásit chybu, nákup přes Google Play (play.js), úvodní logo, zásady a podmínky, nápověda a záznam v obchodě.

## Plán
1. Nový `web/texty-oboru.js` (ES modul, čisté JS, bez závislostí, importuje ho prohlížeč i server stejně jako dnes `web/kolize.js`). Obsahuje:
   - anglické názvy dílů podle `klic` (bok, dno, viko, traverza, police, zada drážka/nasazená, celo, dvirka) a typů skříněk (spodni, horni, vysoka, rohova);
   - `popisHran(desetiny, druh, jazyk)` pro „front edge 0.8 mm“ / „no edging“;
   - `prelozMaterial(text)` pro vzor „Záda N mm“ → „Back panel N mm“; ostatní názvy materiálů jsou obsah zákazníka a zůstanou;
   - `prelozStitekSkrinky(text)`: v „Stěna A · 1. spodní 600×720×510“ se přeloží jen typ, název stěny zůstane;
   - `prelozHlasku(text)`: deterministické vzory všech 7 hlášek z `kolize.js` a hlášky „Díl … se nevejde na formát desky“ z `rozpad.js`. Neznámý text se vrátí beze změny.
   `kolize.js` ani výpočet v `rozpad.js` se nemění.
2. Nový `web/texty-en.js`: slovník „český text → anglický“ pro všechny texty obrazovek v `web/index.html` (titulky obrazovek, sekce, tlačítka, popisky polí standardu, prázdné stavy, chyby, toasty, aria-label). Anglické texty dodrží pravidla DESIGN.md: sloveso + věc („Save standard“, nikdy samotné „Save“ / „OK“), chyba = co se stalo + co s tím, bez interních názvů.
3. `web/index.html`:
   (a) Funkce `t(cesky, nahrady)`: v češtině vrací český text, v EN slovník (náhrada `{x}`). Chybějící klíč vrátí češtinu a zapíše se přes console.warn. Všechny texty pro zákazníka se obalí `t()`.
   (b) Při startu se přečte `localStorage.jazyk`, dovolené hodnoty jsou jen „cs“ a „en“, výchozí „cs“. Při „en“ se ještě před prvním vykreslením načte `import("./texty-en.js")` a nastaví se `document.documentElement.lang`. Čeština nestahuje nic navíc (limit 2,5 s).
   (c) `nastavJazyk(j)`: uloží volbu, nastaví lang, načte slovník a znovu zavolá `zobraz(aktualni)` beze změny historie. Přepínač na úvodu (patička), na Účtu (.volba) a na Náhledu (vedlejší tlačítko v liště).
   (d) Data a čísla: v češtině beze změny (SimteGen.datum / SimteGen.kc). V EN se datum píše přes Intl en-GB („9 Nov 2026“, nikdy ISO), desetinná místa s tečkou, částky dál SimteGen.kc.
   (e) Kusovník v EN: názvy dílů, olepení, materiál „Záda“, štítky skříněk a varování se překládají přes `texty-oboru.js`. `stahniCsv` posílá `?jazyk=en` a soubor se jmenuje `cutting-list-<id>.csv`.
   (f) Chyby ze serveru: v EN se místo českého `data.chyba` ukáže anglická záložní hláška dané akce. Toast při 402 je také přeložený.
   (g) `SimteGen.potvrd` dostane v EN anglický text a volby `ano` / `ne`. Jména obrazovek, `window.ukaz`, data-akce háčky snímků, POST /api/navsteva, přihlašovací formulář a data-ukazka / data-ukazkova-data zůstávají beze změny.
4. `rozpad.js`: `csvKusovniku(kusovnik, zakazka, standard, jazyk = "cs")`. Při „en“ přeloží komentářové řádky, hlavičku (material;part;length_mm;width_mm;qty;thickness_mm;grain;edge_length_1_mm;edge_length_2_mm;edge_width_1_mm;edge_width_2_mm;edging;cabinets), názvy dílů podle `klic`, směr vlákna (along length / any), olepení, štítky skříněk a „Záda N mm“. Desetinná čísla píše s tečkou, středník a BOM zůstávají. Česká větev zůstane bajt po bajtu stejná.
5. `functions/api/kusovnik/[id]/csv.js`: přečte `?jazyk`, dovolí jen „en“, jinak „cs“. Kontrola přihlášení, předplatného a vlastnictví (`nactiKusovnik` podle uzivatel_id) se nemění. V EN se soubor jmenuje `cutting-list-<název>.csv`.
6. `data-manifest.json`: do `uloziste_v_prohlizeci` přidat `{"nazev": "jazyk", "typ": "localStorage", "ucel": "zapamatuje si, v jakém jazyce (čeština, nebo angličtina) chcete aplikaci na tomto zařízení používat", "trvani": "do změny volby nebo smazání dat prohlížeče"}`. Žádná nová entita `ukladame` ani migrace, na serveru se nic nového neukládá. Sekce `aplikace` se nemění (balíček cz.simtegen.kusovnik, snímky zůstávají české, protože výchozí jazyk je čeština). Spustit `python3 vykresli_zasady.py` (zásady se přegenerují, ručně se nepíšou) a pak `vykresli_aplikaci.py` / `vykresli_seo.py`, jak to stavba dělá vždy.
7. `uat/scenare.json`: přidat scénář „Kusovník v angličtině“ (A vygeneruje kusovník; GET …/csv?jazyk=en obsahuje „part;length_mm“, „Side panel“, „Rail“, „Door“ a stejné rozměry „510;720“ nebo „720;510“ podle délky po vlákně; GET …/csv bez parametru obsahuje „dil;delka_mm“ a „Bok“; GET …/csv?jazyk=de obsahuje „Bok“). Přidat izolaci: B volá …/csv?jazyk=en na kusovník A → 404. Stávající scénáře beze změny.
8. Nový `kontrola_prekladu.py` (kořen, spouští stavitel): projde `web/index.html`, ověří, že každý literál v `t("…")` má klíč v `web/texty-en.js` a že slovník nemá anglické hodnoty ze zakázaných slov („OK“, „Save“, „Delete“, … samotné).
9. Ruční kontrola EN: vizuální kontrolu spustit jednou navíc s `localStorage.jazyk="en"` (360 / 820 / 1440 px), aby nic nepřeteklo a dotykové cíle měly aspoň 44 px.
10. `play/co_je_noveho.txt`: „Aplikaci můžete nově používat v angličtině — přepnete ji na úvodní obrazovce, u účtu nebo přímo v náhledu kuchyně, když ji ukazujete zákazníkovi. Kusovník stáhnete i jako anglický soubor CSV pro nářezové centrum. Vaše zakázky, standard i kusovníky zůstávají beze změny.“
11. Nedotýkat se: `.github/`, `simtegen.js`, `play.js`, `styl.css`, `DESIGN.md`, `ikony.svg`, `functions/api/_middleware.js`, migrací (0910_zdroje.sql a ostatní), `play_nakupy.js`, `functions/api/play.js`, `ukazka*.js` ani generovaných souborů.

## Soubory
- web/index.html
- web/texty-en.js
- web/texty-oboru.js
- rozpad.js
- functions/api/kusovnik/[id]/csv.js
- data-manifest.json
- web/zasady.html (generováno vykresli_zasady.py)
- ZAZNAM_O_ZPRACOVANI.md (generováno)
- uat/scenare.json
- kontrola_prekladu.py
- play/co_je_noveho.txt

## Rizika
• Smíšený jazyk: komponenty šablony (pruh zkušební doby a platby, offline pruh, „Vrátit“, Nahlásit chybu, nákup přes Google Play, úvodní logo) a právní texty s nápovědou zůstanou česky, protože simtegen.js a play.js nemají jazykový háček a produkt je needituje. Zákazník v EN je uvidí česky. Zmírnění: věta „Legal documents and help are in Czech.“. Firma zároveň zadá do šablony volitelný slovník (SimteGen.jazyk). Až bude, produkt mu jen předá `texty-en.js` bez další změny produktu.
• Rozsah index.html (~2400 řádků vložených českých textů): snadno se nějaký text vynechá. Proti tomu je náhradní čeština místo prázdna, console.warn a `kontrola_prekladu.py`. CI tuhle kontrolu sama nespouští (.github patří člověku), stavitel ji pouští ručně.
• CI vizuální kontrola a snímky do obchodu běží v češtině. Proto se jazyk prohlížeče úmyslně nedetekuje: anglický Chromium v CI by jinak vykreslil EN a snímky by se změnily. Daň: anglický uživatel si EN jednou přepne sám.
• Volba je na zařízení, ne na účtu, takže na tabletu a PC se nastavuje zvlášť. Je to vědomé: funguje před přihlášením a bez migrace. Kdyby zákazník chtěl volbu napříč zařízeními, přidá se později sloupec ve `standardy` s migrací.
• Překlad uložených varování a štítků jde přes vzory textu. Kdyby se v budoucnu změnilo znění hlášky v kolize.js, EN ukáže česky (bezpečný pád). Vzory proto leží vedle kolize.js ve web/ a mají UAT.
• Nářezová centra mají vlastní importní šablony. Anglické CSV mění jen popisky, ne strukturu sloupců, takže import podle pořadí sloupců funguje dál.
• Ceny v EN zůstávají v Kč (SimteGen.kc) a fakturace i VOP jsou české. Pro zahraniční firmu jde o omezení, ne o chybu.

## Jak ověřit
Na telefonu (Android, aplikace i Chrome) a na tabletu:
(1) Otevřít aplikaci: všechno je česky jako dřív.
(2) Na úvodu klepnout v patičce na „English“: úvod je anglicky, hlavní tlačítko „Send sign-in link“, ukázkový výkres beze změny. Přihlásit se: zakázky jsou anglicky („Jobs“, „New job“).
(3) Otevřít zakázku, pak stěnu: popisky, nástroje a typy skříněk anglicky, kóty v mm stejně jako dřív. Posunout skříňku do okna: hláška kolize je anglicky.
(4) Náhled: legenda a kontrola anglicky. Klepnout na „Česká verze“ a zpět na „English version“: obrazovka zůstane na místě.
(5) „Generate cutting list“: díly Side panel / Bottom / Rail / Shelf / Back panel / Door se stejnými rozměry jako v češtině (skříňka 600 × 720 × 510: side 2× 510 × 720, bottom 564 × 510, door 597 × 717). „Download CSV“ stáhne cutting-list-….csv s anglickou hlavičkou, který se otevře v Excelu ve sloupcích.
(6) Zavřít a znovu otevřít aplikaci: zůstane anglicky. Na Účtu přepnout na Čeština: vše česky, stažené CSV česky a bajtově shodné s dřívějším.
(7) Na notebooku (1440 px) a tabletu (820 px) projít totéž v EN: nic nepřetéká, rozvržení je stejné jako v češtině.
(8) Spustit `python3 kontrola_manifestu.py`, `python3 kontrola_prekladu.py`, UAT (`uat_kontrola.py`) a vizuální kontrolu (česky i s jazyk=en): všechno projde.

## Akceptační scénáře (CI je spustí proti API)
- Přihlášený truhlář s vygenerovaným kusovníkem zavolá GET /api/kusovnik/:id/csv?jazyk=en — musí dostat CSV s hlavičkou „part;length_mm“ a díly „Side panel“, „Rail“ a „Door“ se stejnými rozměry a počty kusů jako v české verzi.
- Přihlášený truhlář zavolá GET /api/kusovnik/:id/csv bez parametru jazyka — musí dostat české CSV beze změny proti dnešku (hlavička „dil;delka_mm“, díly „Bok“, „Traverza“, „Dvířka“).
- Přihlášený truhlář zavolá GET /api/kusovnik/:id/csv?jazyk=de — musí dostat české CSV (neznámý jazyk se tiše vrací na češtinu), ne chybu.
- Účet B zavolá GET /api/kusovnik/:id/csv?jazyk=en na kusovník účtu A — musí dostat 404 a v odpovědi nesmí být nic ze zakázky účtu A.
- Truhlář přepne na Účtu jazyk na English a znovu otevře aplikaci — musí vidět zakázky, stěnu, náhled i kusovník anglicky se stejnými zakázkami a rozměry jako předtím v češtině.
- Nový návštěvník otevře aplikaci poprvé — musí vidět úvod a přihlášení česky a úvod musí dál jednou zavolat POST /api/navsteva.

_Schvaluje se přes ARGA (simtegen_approve_spec) nebo na mini PC._
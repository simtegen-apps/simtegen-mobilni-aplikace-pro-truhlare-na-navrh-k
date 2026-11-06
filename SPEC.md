# Specifikace — build 13

Jde o údržbu, ne o nový produkt. Tři okna prohlížeče `confirm()` ve `web/index.html` se nahradí komponentami ze `simtegen.js`. Smazání stěny proběhne hned a půjde vrátit (`SimteGen.vratitelne`). Smazání zakázky a smazání účtu na serveru vrátit nejde, proto u nich zůstane potvrzení, jen přes `SimteGen.potvrd` s červeným tlačítkem a fokusem na „Zrušit“. Chování, data, API ani texty pro zákazníka se jinak nemění. Opravuje se jen nález kontroly `kontrola_manifestu.py`.

## Placená hodnota (proč přijde druhý nákup)
Platí se dál předplatným za uložené zakázky a kusovníky pro nářezové centrum při každé nové kuchyni. Tahle oprava placenou hodnotu nemění, jen udrží aplikaci v Google Play a v souladu s návrhovým systémem, takže ji předplatitelé můžou dál používat.

## Design (obrazovky, navigace, stavy)
Barva produktu, obrazovky, navigace ani rozvržení se nemění — tahle stavba podle zadání opravuje jen nález kontroly. Mění se tři místa a vzhled dialogů dodá šablona (`simtegen.js` a `.panel` ve `styl.css`):

1) Obrazovka Stěna (nástroj), akce „Smazat stěnu“: bez otázky. Stěna zmizí hned, toast „Stěna smazána.“ zůstane jako text `SimteGen.vratitelne` s tlačítkem Vrátit a aplikace přejde na zakázku jako dnes. Vrácení vloží stěnu i se skříňkami zpět na původní pořadí do aktuální `stav.dokument` (dokument se po uložení vyměňuje, proto se bere ten aktuální, stejně jako u vrácení posunu `st-vratit`). Pak zavolá `zmeneno()`. PUT `/api/zakazky/:id` přepisuje stěny a skříňky celé, takže stará data se uloží znovu. Je-li mezitím otevřená jiná zakázka, vrácení nic neudělá a ukáže toast „Stěnu už vrátit nejde — zakázka je zavřená.“

2) Detail zakázky, „Smazat zakázku“: DELETE na serveru je nevratný (stěny, skříňky i kusovníky se mažou natvrdo a obnovovací endpoint neexistuje), proto potvrzení: `SimteGen.potvrd("Smazat zakázku „<název>“?", {popis: "Smaže se i se stěnami a kusovníky. Krok je nevratný.", ano: "Smazat zakázku", nebezpecne: true})`. Po smazání stejný toast i navigace jako dnes.

3) Účet, „Smazat účet“: `SimteGen.potvrd("Smazat účet a všechna data?", {popis: "Smažou se všechny zakázky i kusovníky. Krok je nevratný.", ano: "Smazat účet", nebezpecne: true})`. Dál beze změny (`/api/ucet/smazat`, `zahodKoncept`, reload).

Stavy: při zrušení dialogu se nic nestane. Chyba serveru vypíše stejný toast jako dnes. Úspěch ukáže toast nebo pruh s nabídkou vrácení. Žádné nové obrazovky, tlačítka ani texty mimo dialogy.

## Plán
1. Ve `web/index.html` v `smazZakazku()` (asi ř. 1228) nahradit `confirm(…)` za `if (!await SimteGen.potvrd(…, {popis, ano: "Smazat zakázku", nebezpecne: true})) return;`. Zbytek funkce nechat.
2. Ve vykreslení stěny u akce „Smazat stěnu“ (asi ř. 1347) odstranit `confirm`. Před `splice` si zapamatovat `zakazkaId`, `index` a vyjmutý objekt stěny. Volání `toast("Stěna smazána.")` nahradit za `SimteGen.vratitelne("Stěna smazána.", () => { if (!stav.dokument || stav.dokument.zakazka.id !== zakazkaId) { toast("Stěnu už vrátit nejde — zakázka je zavřená."); return; } stav.dokument.steny.splice(Math.min(index, stav.dokument.steny.length), 0, vyjmuta); zmeneno(); jdi("stena", { index }, true); })`. Navigace na zakázku zůstane. Na tvar volání a název obrazovky stěny se podívat v souboru (`jdi`, `vykresliStenu`) a sladit je s ním.
3. V `smazUcet()` (asi ř. 2330) nahradit `confirm` za `SimteGen.potvrd` podle DESIGN.md (ano: „Smazat účet“, nebezpecne: true). Zbytek nechat.
4. Ověřit, že v `web/` nezůstal žádný `confirm(`, `prompt(` ani `alert(`. V `web/` by měly zůstat nula výskytů.
5. Přepsat `play/co_je_noveho.txt` (zadání žádá u každé stavby): „Mazání v aplikaci je přehlednější: smazanou stěnu vrátíte jedním klepnutím a smazání zakázky nebo účtu potvrzujete v okně aplikace, ne prohlížeče.“
6. Spustit `python3 kontrola_manifestu.py` a vizuální kontrolu. Infrastrukturu šablony (`simtegen.js`, `styl.css`, DESIGN.md, generátory), manifest, API ani migrace needitovat.

## Soubory
- web/index.html
- play/co_je_noveho.txt

## Rizika
- `SimteGen.potvrd` a `SimteGen.vratitelne` v současném `web/simtegen.js` zatím nejsou. Doplní je obnova šablony při stavbě. Kdyby obnova neproběhla, mazání skončí chybou JS, takže kontrolu je potřeba pouštět až po obnově.
- Vrácení stěny po automatickém uložení: server dostane stěnu znovu jako nová data. Skříňky a stěny se ukládají celé, takže by to mělo fungovat. Jestli se ID stěny a skříněk změní, ověřit, že na ně nic jiného neodkazuje, hlavně kusovník (`kusovnik.js` maže kusovníky podle ID).
- Smazání zakázky dál nejde vrátit. Je to záměr: přidat obnovovací endpoint by šlo nad rámec zadání („nic dalšího“).
- Funkce s `confirm` jsou už `async`, ale obsluha „Smazat stěnu“ je synchronní šipková funkce. Kvůli `vratitelne` to nevadí, protože se nečeká na odpověď.

## Jak ověřit
Na telefonu se přihlásit a naplnit účet ukázkovými daty. (a) Otevřít zakázku, pak stěnu a dát „Smazat stěnu“: stěna zmizí bez otázky a dole se ukáže „Stěna smazána.“ s tlačítkem Vrátit. Klepnout na Vrátit: stěna se vrátí i se skříňkami na původní místo. Po obnovení stránky tam pořád je. (b) U zakázky dát „Smazat zakázku“: otevře se okno aplikace (ne prohlížeče) s otázkou, červeným tlačítkem „Smazat zakázku“ a fokusem na „Zrušit“. Zrušit nechá zakázku beze změny, potvrzení ji smaže a vrátí seznam zakázek. (c) Na Účtu dát „Smazat účet“: stejné okno s tlačítkem „Smazat účet“. Escape ho zavře a nic se nesmaže. (d) `python3 kontrola_manifestu.py` už nehlásí `confirm()` ve `web/index.html` a `grep -n "confirm(\|prompt(\|alert(" web/` nic nenajde.

## Akceptační scénáře (CI je spustí proti API)
- Přihlášený truhlář smaže stěnu zakázky a do 5 s klepne na Vrátit — v zakázce (GET /api/zakazky/:id) musí stěnu znovu vidět i se všemi skříňkami.
- Přihlášený truhlář klepne na Smazat zakázku a v okně aplikace zvolí Zrušit — zakázka musí zůstat v seznamu beze změny.
- Přihlášený truhlář potvrdí Smazat zakázku — zakázka, její stěny i kusovníky musí zmizet a v seznamu zakázek ji už nesmí vidět.
- Účet B zavolá DELETE /api/zakazky/:id na zakázku účtu A — zakázka účtu A musí účtu A zůstat beze změny a účet B ji neuvidí.
- Přihlášený truhlář klepne na Smazat účet a zavře okno Escapem — účet i všechny zakázky musí zůstat a /api/ja ho dál hlásí přihlášeného.

_Schvaluje se přes ARGA (simtegen_approve_spec) nebo na mini PC._
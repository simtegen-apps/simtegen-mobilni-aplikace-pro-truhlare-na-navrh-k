# Specifikace — build 9

Opravíme deploy build 8. Do data-manifest.json doplníme kontaktní e-mail provozovatele (podpora@simtegen.cz, stejná adresa jako u sesterského produktu SimteGen) a z manifestu znovu vygenerujeme zásady, podmínky, zpracovatelskou smlouvu a podklady aplikace pro Google Play. Kód, data, migrace, design ani rozpracované funkce build 8 se nemění. Jde jen o soulad manifestu s kontrolou a s požadavkem Google Play.

## Placená hodnota (proč přijde druhý nákup)
Truhlář platí předplatné za uložené zakázky a kusovník pro nářezové centrum, který vznikne jedním klepnutím. Vrací se s každou další zakázkou na kuchyň nebo skříň. Tato oprava odblokuje nasazení build 8 a vydání v Google Play, a na tablet u zákazníka se tak aplikace dostane jako instalovatelná appka.

## Design (obrazovky, navigace, stavy)
Bez změny vzhledu a obrazovek. Návrhový systém v2 (web/styl.css, web/produkt.css, DESIGN.md) zůstává. Barva produktu zůstává --barva-produktu #2f6b43 (dřevozelená, tmavý režim #4fa36b), zvolená a ověřená v dřívějších buildech. Navigace, obrazovky (Zakázky, Zakázka, Stěna, Prostor, Kusovník, Účet) a jejich prázdné, načítací a chybové stavy se nemění.

Jediná viditelná změna je v právních stránkách:
- Zásady zpracování údajů, Obchodní podmínky a Zpracovatelská smlouva: v identifikaci provozovatele se místo červeného slotu „(doplnit kontaktní e-mail)“ zobrazí klikatelný odkaz mailto:podpora@simtegen.cz.
- Stránky se otevírají z obrazovky Účet a z patičky. Mají vlastní odkaz „Zpět do aplikace“ (index.html), takže v TWA bez adresního řádku nespoléhají na tlačítko prohlížeče.

Google Play: play/zaznam.json a play/BEZPECNOST_DAT.md (generuje vykresli_aplikaci.py) ponesou kontaktní e-mail pro záznam v obchodě. Offline stránka, ikony a manifest aplikace vzniknou z generátoru beze změny vzhledu.

## Plán
1. V data-manifest.json změnit horní "kontakt_email": "" na "kontakt_email": "podpora@simtegen.cz". Jde o podpůrnou adresu provozovatele SimteGen s.r.o., kterou už používá produkt appka-pro-mechaniky-a-servisy-na-uskladn, nic se nevymýšlí. Do sekce aplikace se kontakt_email nepřidává: horní hodnotu přebírá vykresli_aplikaci.py (ř. 240 a 566) i vykresli_zasady.py, takže existuje jen jeden zdroj pravdy a zásady i záznam v Play mají stejný kontakt.
2. Ostatní pole manifestu se nemění: balicek, nazev, kratky_nazev, popis, otisky, dlouhy_popis, kategorie, ukladame s play_typy, play_ucely a play_volitelne, služby, cookies i úložiště v prohlížeči. Datový model zůstává beze změny: žádná nová tabulka ani migrace. Platí stávající entity uzivatele, prihlasovaci_odkazy, relace, predplatne, platby, objednavky, hlaseni, standardy, materialy, zakazky, mistnosti, steny, skrinky a kusovniky s retencemi podle manifestu.
3. Spustit python vykresli_zasady.py. Přegeneruje web/zasady.html, web/podminky.html, web/zpracovatelska-smlouva.html, web/odstoupeni-formular.html, ZAZNAM_O_ZPRACOVANI.md a POSTUP_PRI_INCIDENTU.md.
4. Spustit python vykresli_aplikaci.py. Tentokrát projde _chyby_konfigurace a zapíše web/manifest.webmanifest, ikony, web/offline.html, web/sw.js, web/.well-known/assetlinks.json, play/zaznam.json, play/BEZPECNOST_DAT.md a odkazy v index.html.
5. Spustit python kontrola_manifestu.py: musí projít čistě, včetně kontroly, že se vygenerované soubory shodují s generátorem.
6. Spustit regresní kontroly rozpracovaného build 8, protože ten dosud nikdy neprošel CI: node zkouska_rozpadu.mjs, node zkouska_prostoru.mjs, python bezpecnostni_kontrola.py a vizualni_kontrola.py na 360/820/1440 px. Kdyby některá selhala z jiného důvodu než kontaktu, opravit jen to, co brání průchodu, a v rozsahu build 8.
7. Na .github/ se nesahá. Ruční úpravy vygenerovaných souborů jsou zakázané.
8. Commit „build 8: kontakt_email v manifestu, přegenerované zásady a podklady pro Play“ na větev build/mobilni-aplikace-pro-truhlare-na-navrh-k-2.

## Soubory
- data-manifest.json
- web/zasady.html (generuje vykresli_zasady.py)
- web/podminky.html (generuje vykresli_zasady.py)
- web/zpracovatelska-smlouva.html (generuje vykresli_zasady.py)
- web/odstoupeni-formular.html (generuje vykresli_zasady.py)
- ZAZNAM_O_ZPRACOVANI.md (generuje vykresli_zasady.py)
- POSTUP_PRI_INCIDENTU.md (generuje vykresli_zasady.py)
- web/manifest.webmanifest, web/sw.js, web/offline.html, web/ikona-*.png, web/.well-known/assetlinks.json (generuje vykresli_aplikaci.py)
- play/zaznam.json, play/BEZPECNOST_DAT.md (generuje vykresli_aplikaci.py, nově vzniknou)
- web/index.html (jen odkazy vložené vykresli_aplikaci.py)

## Rizika
- Schránka podpora@simtegen.cz musí skutečně existovat a někdo ji musí číst. Google Play ji zobrazuje zákazníkům a může ji ověřovat, zásady ji uvádějí pro uplatnění práv podle GDPR. Pokud majitel chce pro tento produkt jinou adresu, stačí změnit jediné pole a spustit generátory znovu.
- Vedlejší účinek v deploy.yml (ř. 132): neprázdný horní kontakt_email se v produkci (main, je-li nastaven EMAIL_ODESILATEL) uloží jako secret KONTAKT_EMAIL. Upozornění na nové objednávky předplatného (functions/api/objednavka.js) pak půjdou na podpora@simtegen.cz místo na adresu odesílatele. To je zamýšlené chování šablony, ale majitel o něm má vědět.
- V zásadách zůstávají další červené sloty (IČO, sídlo, účinnost, retence logů…). Kontrola je nevyžaduje a tato oprava je neřeší. S nimi se podle poznámky v manifestu nesmí do produkce, doplní je majitel.
- Build 8 obsahuje rozsáhlé změny (místnosti, prostor, tah ve výkresu), které CI ještě nikdy neviděl, protože skončil už na kontaktu. Po opravě se mohou ukázat další chyby. Ty se opraví v rozsahu build 8, bez přestavby.
- otisky zůstávají prázdné, assetlinks.json proto zatím neověří TWA. Otisk podpisového klíče doplní majitel z Play Console.

## Jak ověřit
1. V CI (deploy na větvi build) musí projít krok kontrola_manifestu.py a hláška „aplikace.kontakt_email … chybí“ zmizí. Lokálně: python kontrola_manifestu.py skončí bez chyb a git diff po opětovném spuštění obou generátorů je prázdný.
2. Na telefonu otevřít preview URL a přihlásit se vývojovým odkazem. V účtu klepnout na „Zásady zpracování údajů“: v první odstavci je místo červeného „(doplnit kontaktní e-mail)“ odkaz podpora@simtegen.cz, klepnutí otevře poštovní aplikaci. „Zpět do aplikace“ vrátí do appky. Totéž ověřit v Obchodních podmínkách.
3. V repozitáři otevřít play/zaznam.json a ověřit pole kontakt_email = podpora@simtegen.cz. V play/BEZPECNOST_DAT.md je kontakt uveden u žádosti o smazání údajů.
4. Ověřit, že nic, co už funguje, se nerozbilo: otevřít existující zakázku, stěnu a vygenerovat kusovník. Referenční skříňka dá 8 dílů, CSV jde stáhnout.

## Akceptační scénáře (CI je spustí proti API)
- Majitel — spustí deploy větve build 8 — kontrola manifestu projde zeleně a v logu už není chyba o chybějícím aplikace.kontakt_email.
- Truhlář na telefonu — otevře z účtu Zásady zpracování údajů — vidí kontakt podpora@simtegen.cz jako odkaz místo červeného slotu a odkaz „Zpět do aplikace“ ho vrátí do aplikace.
- Truhlář s účtem A — vygeneruje kusovník u své zakázky — dostane seznam dílů jako před opravou a CSV jde stáhnout.
- Truhlář s účtem B — načte seznam zakázek — neuvidí žádnou zakázku, stěnu ani kusovník účtu A.
- Majitel — otevře play/zaznam.json — vidí kontakt_email podpora@simtegen.cz shodný s kontaktem v zásadách.

_Schvaluje se přes ARGA (simtegen_approve_spec) nebo na mini PC._
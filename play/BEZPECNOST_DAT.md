# Google Play — co vyplnit v Play Console

GENEROVANÝ SOUBOR z data-manifest.json (`python vykresli_aplikaci.py`) — needituj ručně.
Kde je `<adresa>`, doplň adresu produktu (vlastní doména, nebo `<repo>.pages.dev`).

## 1. Hlavní záznam v obchodě (Main store listing)

Workflow Vydání ho nahrává sám, jakmile má servisní účet. Ručně jen poprvé, nebo bez něj:

- **Název aplikace:** Kusovník pro truhláře
- **Krátký popis:** Návrh kuchyní u zákazníka a kusovník desek pro nářezové centrum.
- **Kategorie:** Firmy (`BUSINESS`) — v Play Console: Nastavení obchodu
- **Kontaktní e-mail:** support@simtegen.com
- **Web:** `<adresa>`
- **Úplný popis:**

```
Kusovník pro truhláře je aplikace pro truhláře a výrobce kuchyní na míru, kteří měří přímo u zákazníka v telefonu nebo tabletu.

Co aplikace dělá:
• Zadáte rozměry stěn, oken a dveří a na stěny postavíte skříňky — spodní, horní, vysoké i rohové.
• Výkres stěny ukazuje skříňky, okna a dveře v měřítku.
• Aplikace upozorní, když se skříňky překrývají nebo zasahují do okna.
• Jedním klepnutím vznikne kusovník dílů — boky, dna, víka nebo traverzy, police, záda, dvířka a čela zásuvek — podle konstrukčního standardu vaší dílny (tloušťka desky, záda v drážce nebo nasazená, spáry, olepení hran). Součástí je orientační odhad počtu desek.
• Kusovník stáhnete jako soubor CSV pro nářezové centrum.
• Zakázky zůstávají ve vašem účtu: měření dopracujete v dílně na počítači a starší zakázku zkopírujete jako šablonu pro novou.

Přihlašujete se jednorázovým odkazem z e-mailu, bez hesla. Data jsou uložena v EU; v aplikaci si je kdykoli stáhnete nebo účet se všemi daty smažete.

Aplikace se platí měsíčním předplatným. Prvních 30 dní je zdarma, bez zadávání platební karty a bez závazku.

Rozměry v kusovníku před odesláním do nářezového centra vždy zkontrolujte.
```

## 2. Zásady ochrany soukromí (Privacy policy)

`<adresa>/zasady.html`

## 3. Bezpečnost údajů (Data safety)

1. *Shromažďuje nebo sdílí aplikace některý z požadovaných typů uživatelských údajů?* **Ano**
2. *Jsou všechny shromážděné údaje šifrovány při přenosu?* **Ano** (jen HTTPS)
3. *Poskytujete uživatelům způsob, jak požádat o smazání údajů?* **Ano** — v aplikaci Účet → Smazat účet a všechna data; popis na webu.
4. *Umožňuje aplikace vytvořit účet?* **Ano** (e-mailem). Odkaz na smazání účtu: `<adresa>/zasady.html`

**Sdílení: u žádného typu Ne.** Cloudflare (hosting, databáze), Resend (e-maily) a GitHub (evidence hlášení, šifrovaně) zpracovávají údaje pro nás — Google je za sdílení nepočítá.
**Zpracování dočasné (ephemeral): Ne** — údaje se ukládají.

| Kategorie | Typ údajů | Shromažďováno | Povinné? | Účely | Odkud (manifest) |
|---|---|---|---|---|---|
| Osobní údaje (Personal info) | E-mailová adresa (Email address) | Ano | povinné | Správa účtu (Account management), Prevence podvodů, zabezpečení a dodržování předpisů (Fraud prevention, security, and compliance) | uzivatele, prihlasovaci_odkazy |
| Osobní údaje (Personal info) | Jméno (Name) | Ano | povinné | Funkce aplikace (App functionality), Správa účtu (Account management) | objednavky |
| Osobní údaje (Personal info) | Adresa (Address) | Ano | povinné | Funkce aplikace (App functionality), Správa účtu (Account management) | objednavky |
| Osobní údaje (Personal info) | ID uživatelů (User IDs) | Ano | povinné | Správa účtu (Account management) | uzivatele |
| Osobní údaje (Personal info) | Jiné informace (Other info) | Ano | povinné | Funkce aplikace (App functionality) | zakazky |
| Finanční údaje (Financial info) | Historie nákupů (Purchase history) | Ano | povinné | Funkce aplikace (App functionality), Správa účtu (Account management) | predplatne, platby, objednavky |
| Zprávy (Messages) | Jiné zprávy v aplikaci (Other in-app messages) | Ano | volitelné | Funkce aplikace (App functionality), Komunikace vývojáře (Developer communications) | hlaseni, hlášení chyb (tlačítko Nahlásit chybu) |
| Aktivita v aplikaci (App activity) | Jiný obsah vytvořený uživatelem (Other user-generated content) | Ano | povinné | Funkce aplikace (App functionality) | standardy, materialy, zakazky, steny, skrinky, kusovniky |
| Informace o aplikaci a výkonu (App info and performance) | Diagnostika (Diagnostics) | Ano | volitelné | Funkce aplikace (App functionality), Komunikace vývojáře (Developer communications) | hlášení chyb (tlačítko Nahlásit chybu) |

## 4. Obsah aplikace — ostatní prohlášení (App content)

- **Reklamy:** Ne, aplikace neobsahuje reklamy.
- **Cílová skupina:** 18 let a více.
- **Hodnocení obsahu (dotazník IARC):** kategorie Nástroje / Produktivita; na otázky o násilí, sexu, vulgaritách, drogách, hazardu a sdílení polohy odpověz Ne. Uživatelé spolu v aplikaci nekomunikují.
- **Zpravodajská aplikace / vládní aplikace / finanční funkce / zdraví:** Ne.
- **Přístup k aplikaci:** část funkcí vyžaduje přihlášení. Interní testování to nepotřebuje; před vydáním do produkce Google chce přístup pro kontrolu — přihlášení odkazem e-mailem kontrolor sám nedokončí, takže to vyřešíme demo účtem.

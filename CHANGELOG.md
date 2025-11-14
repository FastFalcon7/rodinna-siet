# CHANGELOG

Všetky významné zmeny v projekte Rodinna Sieť.

---

## [v0004] - 2025-11-14

### 🔒 BEZPEČNOSTNÉ OPRAVY (KRITICKÉ)

#### Storage Rules
- **OPRAVENÉ:** Verejný prístup k súborom
  - Posts obrázky: `allow read: if true` → `allow read: if request.auth != null`
  - Chat prílohy: `allow read: if true` → `allow read: if request.auth != null`
  - Hlasové správy: `allow read: if true` → `allow read: if request.auth != null`
  - Profilové fotky: `allow read: if true` → `allow read: if request.auth != null`
- **Dopad:** Všetky súbory teraz prístupné len prihláseným používateľom

#### Firestore Rules
- **OPRAVENÉ:** Verejný prístup k whitelist emailom
  - Config kolekcia: `allow read: if true` → `allow read: if request.auth != null`
- **OPRAVENÉ:** Nekontrolované úpravy príspevkov
  - Posts update: Pridaná detailná validácia
  - Vlastník: Môže upraviť celý príspevok
  - Ostatní: Môžu len pridávať reakcie/komentáre (nie mazať/meniť obsah)

### ✨ NOVÉ FEATURES

#### Firebase Rules Testing
- Pridaný `@firebase/rules-unit-testing` package
- Pridaný `mocha` test runner
- 36 automatizovaných testov:
  - Firestore rules: 18 testov
  - Storage rules: 18 testov
- 100% test coverage kritických scenárov

#### Automatizácia
- `npm run test:rules:auto` - Automatický test runner s emulátormi
- `npm run test:rules:firestore` - Firestore testy
- `npm run test:rules:storage` - Storage testy
- `npm run emulators:start` - Spustenie Firebase emulátorove
- `run-tests.js` - Helper skript pre automatické testovanie

#### Dokumentácia
- `TESTING.md` - Kompletný návod na testovanie (pre začiatočníkov)
- `QUICK_START_TESTING.md` - Rýchly štart za 2 minúty
- `SECURITY_AUDIT_REPORT.md` - Kompletný bezpečnostný audit report
- `CHANGELOG.md` - Tento súbor

### 🔧 KONFIGURÁCIA

#### firebase.json
- Pridaná konfigurácia pre Firebase emulátory:
  - Firestore emulátor: port 8080
  - Storage emulátor: port 9199
  - UI emulátor: port 4000

#### package.json
- Aktualizovaná verzia `@firebase/rules-unit-testing` z 3.0.4 na 4.0.0 (kompatibilita s Firebase 12)
- Pridané nové npm skripty pre testovanie

### 📊 ŠTATISTIKY

- Bezpečnostných problémov nájdených: 11 (3 kritické, 5 stredné, 3 nízke)
- Kritických problémov opravených: 3/3 (100%)
- Testov vytvorených: 36
- Testov úspešných: 36/36 (100%)
- Dokumentačných súborov: 4

### 🚀 DEPLOY

- Dátum: 2025-11-14
- Nasadené: storage.rules, firestore.rules, aplikácia
- Produkcia: https://rodinna-siet.web.app

---

## [v0003] - 2025-11-XX

### 🐛 BUGFIXY

- Oprava iOS emoji/komentárov
- Funkčnosť ikony témy v hlavnej lište

---

## [v0002] - 2025-11-XX

### ✨ NOVÉ FEATURES

- Pridané základné funkcie aplikácie

---

## [v0001] - 2025-11-XX

### 🎉 PRVÁ VERZIA

- Iniciálna verzia aplikácie
- Firebase setup
- Základná štruktúra projektu

---

## FORMÁT VERZIOVANIA

Projekt používa formát `vXXXX` kde XXXX je 4-miestne číslo:
- v0001, v0002, v0003, v0004, ...
- Každá zmena/deploy = +1 verzia
- Aj menšie zmeny dostávajú vlastné číslo verzie

## LEGEND

- 🔒 Bezpečnostné opravy
- ✨ Nové features
- 🐛 Bugfixy
- 🔧 Konfiguračné zmeny
- 📊 Štatistiky/Reporty
- 🚀 Deploy/Release
- 📝 Dokumentácia
- ⚡ Výkon/Performance
- 💄 UI/UX zmeny

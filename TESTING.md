# 🧪 NÁVOD NA TESTOVANIE FIREBASE RULES

Tento dokument vysvetľuje, ako testovať bezpečnostné pravidlá pre Firebase v projekte Rodinna Sieť.

---

## 📚 ČO SÚ FIREBASE RULES TESTY?

Firebase rules testy sú **automatizované testy**, ktoré overujú, či vaše bezpečnostné pravidlá fungujú správne. Simulujú rôzne scenáre používateľov a kontrolujú, či:

- ✅ Autorizovaní používatelia majú prístup k dátam
- ❌ Neautorizovaní používatelia NEMAJÚ prístup k dátam
- 🔒 Citlivé operácie sú chránené

### Prečo to potrebujeme?

Bez testov:
- ❌ Nevieme, či pravidlá fungujú správne
- ❌ Môžeme omylom otvoriť bezpečnostné diery
- ❌ Zmeny môžu pokaziť existujúce pravidlá

S testami:
- ✅ Automaticky overíme všetky scenáre
- ✅ Zmeny sú bezpečnejšie
- ✅ Dokumentácia, ako pravidlá fungujú

---

## 🛠️ INŠTALÁCIA

### 1. Nainštaluj potrebné balíčky

```bash
npm install
```

Toto nainštaluje:
- `@firebase/rules-unit-testing` - Firebase testing framework
- `mocha` - Test runner (spúšťa testy)

### 2. Nainštaluj Firebase CLI (ak ešte nemáš)

```bash
npm install -g firebase-tools
```

---

## 🚀 SPUSTENIE TESTOV

### Spustiť všetky testy naraz

```bash
npm run test:rules
```

Toto spustí:
1. Firestore rules testy
2. Storage rules testy

### Spustiť len Firestore testy

```bash
npm run test:rules:firestore
```

### Spustiť len Storage testy

```bash
npm run test:rules:storage
```

---

## 📋 AKO FUNGUJÚ TESTY?

### Štruktúra testu

Každý test má 3 časti:

1. **Setup** - Príprava (vytvorenie testových dát)
2. **Action** - Akcia (pokus o operáciu)
3. **Assert** - Overenie (skontroluj výsledok)

### Príklad testu

```javascript
it('❌ Neautentifikovaný používateľ NEMÔŽE čítať príspevky', async () => {
  // SETUP: Vytvor kontext neprihláseného používateľa
  const unauthedDb = testEnv.unauthenticatedContext().firestore();

  // ACTION: Pokús sa čítať príspevok
  const postRef = unauthedDb.collection('posts').doc('post123');

  // ASSERT: Očakávame FAIL (zamietnutie)
  await assertFails(postRef.get());
});
```

### Vysvetlenie:

- `unauthenticatedContext()` - Simuluje NEprihláseného používateľa
- `authenticatedContext('uid')` - Simuluje prihláseného používateľa s UID
- `assertFails()` - Očakávame, že operácia zlyhá (je zamietnutá)
- `assertSucceeds()` - Očakávame, že operácia uspeje (je povolená)

---

## 📖 ČO SA TESTUJE?

### 🔥 Firestore Rules (`tests/firestore.rules.test.js`)

Testuje pravidlá pre databázové kolekcie:

#### 📋 Config (Whitelist)
- ❌ Neprihlásení nemôžu čítať whitelist
- ✅ Prihlásení môžu čítať whitelist
- ❌ Normálni používatelia nemôžu upravovať whitelist
- ✅ Admin môže upravovať whitelist

#### 👥 Users (Profily)
- ❌ Neprihlásení nemôžu čítať profily
- ✅ Prihlásení môžu čítať profily
- ✅ Používateľ môže upravovať svoj profil
- ❌ Používateľ nemôže upravovať cudzí profil

#### 📝 Posts (Príspevky)
- ❌ Neprihlásení nemôžu čítať príspevky
- ✅ Používateľ môže vytvoriť príspevok
- ✅ Vlastník môže upraviť svoj príspevok
- ✅ Iný používateľ môže pridať reakciu
- ❌ Iný používateľ nemôže zmeniť obsah
- ✅ Vlastník môže zmazať svoj príspevok
- ❌ Iný používateľ nemôže zmazať cudzí príspevok

#### 💬 Messages (Chat)
- ✅ Používateľ môže odoslať správu
- ✅ Iný používateľ môže pridať reakciu
- ❌ Iný používateľ nemôže zmazať cudziu správu

### 📁 Storage Rules (`tests/storage.rules.test.js`)

Testuje pravidlá pre súbory:

#### 🖼️ Posts obrázky
- ❌ Neprihlásení nemôžu čítať obrázky
- ✅ Prihlásení môžu čítať obrázky
- ✅ Vlastník môže nahrať svoj obrázok
- ❌ Používateľ nemôže nahrať do cudzieho priečinka

#### 📎 Chat prílohy
- ❌ Neprihlásení nemôžu čítať prílohy
- ✅ Prihlásení môžu čítať prílohy
- ✅ Vlastník môže nahrať prílohu
- ❌ Používateľ nemôže nahrať do cudzieho priečinka
- ✅ Vlastník môže zmazať svoju prílohu
- ❌ Používateľ nemôže zmazať cudziu prílohu

#### 🎤 Hlasové správy
- ❌ Neprihlásení nemôžu čítať
- ✅ Prihlásení môžu čítať
- ✅ Vlastník môže nahrať
- ❌ Používateľ nemôže nahrať do cudzieho priečinka

#### 👤 Profilové fotky
- ❌ Neprihlásení nemôžu čítať
- ✅ Prihlásení môžu čítať
- ✅ Vlastník môže nahrať svoju fotku
- ❌ Používateľ nemôže nahrať fotku pre iného

---

## 📊 INTERPRETÁCIA VÝSLEDKOV

### Úspešný test

```
✅ Autentifikovaný používateľ MÔŽE čítať príspevky
```

To znamená: Pravidlo funguje správne, prihlásený používateľ má prístup.

### Neúspešný test (ERROR)

```
❌ Error: Expected request to fail, but it succeeded
```

To znamená: **BEZPEČNOSTNÝ PROBLÉM!** Operácia, ktorá mala byť zamietnutá, bola povolená.

**Čo robiť?**
1. Skontroluj pravidlá v `firestore.rules` alebo `storage.rules`
2. Oprav pravidlo
3. Spusti testy znova

---

## 🔧 RIEŠENIE PROBLÉMOV

### Problém 1: "Error: Could not start emulator"

**Riešenie:**
```bash
# Zatvori všetky Firebase emulátor procesy
pkill -f firebase
# Alebo reštartuj počítač
```

### Problém 2: "Module not found: @firebase/rules-unit-testing"

**Riešenie:**
```bash
npm install --save-dev @firebase/rules-unit-testing mocha
```

### Problém 3: "Connection refused to localhost:8080"

**Riešenie:**
Port 8080 je obsadený. Zmení port v test súboroch:
```javascript
port: 8081  // Namiesto 8080
```

### Problém 4: Testy sú pomalé

Testy používajú lokálne emulátory, takže sú **rýchle** (žiadne volania na internet).
Ak sú pomalé:
- Skontroluj, či nie je spustených viac instancií
- Reštartuj počítač

---

## 📝 PRIDANIE NOVÉHO TESTU

### Krok 1: Otvor test súbor

- Pre Firestore: `tests/firestore.rules.test.js`
- Pre Storage: `tests/storage.rules.test.js`

### Krok 2: Pridaj nový test

```javascript
it('✅ Popis testu', async () => {
  // 1. SETUP - Príprava
  const userDb = testEnv.authenticatedContext('user123').firestore();

  // 2. ACTION - Akcia
  const docRef = userDb.collection('myCollection').doc('myDoc');

  // 3. ASSERT - Overenie
  await assertSucceeds(docRef.get());
  // alebo
  await assertFails(docRef.get());
});
```

### Krok 3: Spusti testy

```bash
npm run test:rules
```

---

## 🎯 BEST PRACTICES

### 1. Testuj všetky edge cases

- ✅ Prihlásený používateľ
- ❌ Neprihlásený používateľ
- 👤 Vlastník vs. iný používateľ
- 👑 Admin vs. normálny používateľ

### 2. Pomenuj testy jasne

```javascript
// ✅ Dobré
it('❌ Neprihlásený používateľ NEMÔŽE čítať príspevky', ...)

// ❌ Zlé
it('Test 1', ...)
```

### 3. Používaj emojis pre prehľadnosť

- ✅ - Test, ktorý MUSÍ uspieť
- ❌ - Test, ktorý MUSÍ zlyhať (bezpečnostné zamietnutie)
- 🔒 - Bezpečnostný test
- 🚨 - Kritický test

### 4. Spúšťaj testy PRED každým deploy

```bash
npm run test:rules && firebase deploy
```

---

## 📚 DODATOČNÉ ZDROJE

### Firebase Docs
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Rules](https://firebase.google.com/docs/storage/security/start)

### Náš projekt
- `firestore.rules` - Firestore bezpečnostné pravidlá
- `storage.rules` - Storage bezpečnostné pravidlá
- `tests/` - Test súbory

---

## ❓ FAQ

**Q: Musia bežať emulátory pri testoch?**
A: Nie, testy automaticky spustia svoj vlastný emulátor.

**Q: Stoja testy peniaze?**
A: Nie, testy sú 100% lokálne, bez poplatkov.

**Q: Ako často spúšťať testy?**
A: Pri každej zmene pravidiel PRED deploy.

**Q: Môžem testovať production databázu?**
A: NIE! Testy používajú lokálny emulátor, nie produkciu.

**Q: Čo ak test zlyhá?**
A: To znamená, že pravidlo nefunguje správne. Oprav pravidlo a testuj znova.

---

## 🎓 ZÁVER

Firebase rules testy sú kľúčové pre bezpečnosť aplikácie. Vďaka nim:

- ✅ Automaticky overíš, že pravidlá fungujú
- 🔒 Zabrániš bezpečnostným dierám
- 📝 Zdokumentuješ, ako pravidlá fungujú
- 🚀 Deployuj s istotou

**Spúšťaj testy pravidelne a udržuj aplikáciu bezpečnú!**

---

Vytvoril: Claude AI
Verzia: v0004
Dátum: 2025

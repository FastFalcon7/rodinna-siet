# ⚡ RÝCHLY ŠTART - Firebase Rules Testovanie

Stručný návod na spustenie testov za 2 minúty.

---

## 🚀 3 KROKY NA SPUSTENIE

### 1️⃣ Nainštaluj balíčky (prvýkrát)

```bash
npm install
```

### 2️⃣ Spusti testy

```bash
npm run test:rules
```

### 3️⃣ Skontroluj výsledok

```
✅ Všetky testy prešli = Bezpečnostné pravidlá fungujú správne
❌ Niektoré testy zlyhalili = Bezpečnostný problém, treba opraviť
```

---

## 📝 ČO SA TESTUJE?

### Firestore (databáza)
- Kto môže čítať/meniť príspevky, správy, profily
- Ochrana whitelistu
- Admin vs. normálny používateľ

### Storage (súbory)
- Kto môže nahrávať/čítať fotky, chat prílohy
- Ochrana súborov pred neprihlás enými používateľmi

---

## 🔍 DETAILNÉ PRÍKAZY

```bash
# Všetky testy
npm run test:rules

# Len Firestore testy
npm run test:rules:firestore

# Len Storage testy
npm run test:rules:storage
```

---

## 📖 PODROBNÝ NÁVOD

Pre detailný návod a vysvetlenia pozri: **[TESTING.md](./TESTING.md)**

---

## ⚠️ DÔLEŽITÉ

**Vždy spusti testy PRED deploy:**

```bash
npm run test:rules && firebase deploy
```

To zabezpečí, že nepošleš na produkciu nefunkčné pravidlá.

---

✅ **Hotovo! Testy sú pripravené na použitie.**

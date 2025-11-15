# 📊 ULTRATHINK ANALÝZA & MODERNIZÁCIA RODINNEJ SIETE

> Komplexná vízia modernizácie a rozšírenia aplikácie Rodinná Sieť
> **Dátum vytvorenia:** 15. november 2025
> **Verzia dokumentu:** v1.0
> **Aktuálna verzia aplikácie:** v0004

---

## Obsah

1. [Súčasný stav - Zhodnotenie](#i-súčasný-stav---zhodnotenie)
2. [Modernizácia UI/UX](#ii-modernizácia-uiux---kompletný-návrh)
3. [Kalendár - Revolution](#iii-kalendár---revolution)
4. [Rodina - Interaktívny Hub](#iv-rodina---interaktívny-hub)
5. [Denník - Nová Sekcia](#v-denník---nová-sekcia)
6. [Technická Architektúra - Migrácia na NAS](#vi-technická-architektúra---migrácia-na-nas)
7. [Implementation Roadmap](#vii-implementation-roadmap)
8. [Technológie & Knižnice](#viii-technologies--libraries)
9. [Odhadované Náklady](#ix-estimated-costs)
10. [Prioritizácia & Odporúčania](#x-prioritizácia--odporúčania)
11. [Risk Assessment](#xi-risk-assessment)
12. [Záver a Next Steps](#-záver-a-next-steps)

---

## I. SÚČASNÝ STAV - ZHODNOTENIE

### ✅ Silné stránky

- **Moderná technologická základňa** (React 19, Firebase)
- **Dark mode** plne implementovaný
- **Responzívny dizajn** s mobile-first prístupom
- **Real-time aktualizácie** cez Firestore
- **Dobré UX prvky:** emoji reakcie, long-press interakcie, FAB tlačidlá
- **Context architekúra** dobre navrhnutá

### 🔄 Oblasti na zlepšenie

- **Kalendár:** Základná listová štruktúra bez vizuálneho kalendárového pohľadu
- **Rodina:** Statické zobrazenie, chýbajú interaktívne prvky
- **Navigácia:** Klasická, mohla by byť modernejšia
- **Animácie:** Minimálne, chýba "wow" efekt
- **Personalizácia:** Obmedzené možnosti

---

## II. MODERNIZÁCIA UI/UX - KOMPLETNÝ NÁVRH

### 🎨 A. Nový dizajnový jazyk "Family Flow"

#### 1. Moderná farebná paleta s gradientmi

```javascript
// Rozšírenie Tailwind konfigurácie
theme: {
  extend: {
    colors: {
      'family': {
        50: '#fef2f2',
        100: '#fee2e2',
        // ... až po 900
        primary: '#6366f1',   // indigo
        accent: '#ec4899',    // pink
        success: '#10b981',
        warning: '#f59e0b'
      }
    },
    backgroundImage: {
      'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'gradient-sunset': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'gradient-ocean': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    }
  }
}
```

#### 2. Glassmorphism efekty

- Priehľadné panely s blur efektom
- Floating elementy s jemným tieňom
- Lepšia hierarchia obsahu

#### 3. Micro-interakcie

- Hover efekty s plynulými transformáciami
- Ripple efekty pri kliknutí/dotyku
- Loading stavy s skeleton screens
- Haptic feedback na mobile (vibrácie)

### 🧭 B. Modernizovaná navigácia

#### Koncept 1: "Command Palette" (Spotlight-style)

**Cmd/Ctrl + K** → Otvorí quick search overlay

- Vyhľadávanie naprieč celou aplikáciou
- Rýchle akcie (Nový príspevok, Nová udalosť, ...)
- Navigácia medzi sekciami
- História posledných akcií

#### Koncept 2: "Floating Navigation Dock" (macOS štýl)

- Animovaný dock s ikonami na spodku (desktop)
- Zväčšovanie ikon pri hover
- Dynamické badges s počtom notifikácií
- Smooth transitions medzi sekciami

#### Koncept 3: "Segmented Control" + Tabs (iOS štýl)

- iOS štýl segmented control pre hlavné sekcie
- Swipe gestures medzi tabnami
- Progress indicator na vrchu stránky

### 🎭 C. Animácie a transície

#### Framer Motion integrácia

```javascript
// Page transitions
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.43, 0.13, 0.23, 0.96] }
};

// Staggered animations pre listy
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};
```

#### Navrhované animácie:

- ✨ **Page transitions** medzi sekciami
- 🎯 **Staggered list item animations**
- 🌊 **Pull-to-refresh** s custom grafikou
- 💫 **Parallax scrolling** efekty
- 🎪 **Modal entrance animations** (spring physics)
- 🔄 **Skeleton loading states**

---

## III. KALENDÁR - REVOLUTION

### 🎯 A. Vizuálne vylepšenia

#### 1. Trojitý pohľad (Triple View)

```
┌─────────────────────────────────────┐
│ [Mesiac] [Týždeň] [Zoznam] [Agenda] │
├─────────────────────────────────────┤
│                                     │
│  Mesačný kalendár s heatmap         │
│  (čím viac udalostí, tím tmavšia)   │
│                                     │
├─────────────────────────────────────┤
│  Upcoming events (scrollable)       │
└─────────────────────────────────────┘
```

#### 2. Interaktívny mesačný kalendár

**Features:**

- Drag & drop udalostí
- Multi-day events s vizuálnymi spojnicami
- Color-coded events podľa typu
- Mini event preview on hover
- Quick add kliknutím na dátum
- Zobrazenie viacerých kalendárov naraz (filter)

#### 3. Timeline view (Agenda štýl)

- Chronologický zoznam s časovou osou
- Vizuálne oddeľovače dní
- Countdown timer pre najbližšie udalosti
- Weather integration (ikona počasia pri udalostiach)

### 🚀 B. Funkcionálne vylepšenia

#### 1. Smart suggestions

```javascript
// AI-powered návrhy (lokálne, bez cloudu)
"Každú stredu o 18:00 máte rodinnú večeru"
"Narodeniny Janka už o 5 dní! Pridať pripomienku?"
```

- Detekcia recurring patterns

#### 2. Rodinný synchronizovaný kalendár

- **Spoločné udalosti** (family events)
- **Osobné udalosti** (len pre mňa)
- **Dostupnosť členov** (availability view)
- **Voting system** pre termíny (keď plánujete akciu)
  - "Kedy majú všetci čas?" → návrh voľných slotov

#### 3. Integrácie

- Import z `.ics` súborov (Google Calendar, Outlook)
- Export do PDF (týždenný/mesačný prehľad)
- Notifikácie push/email/SMS
- Integrácia s počasím (OpenWeather API)
- Integrácia so sviatkami a výročiami (SK kalendár)

#### 4. Šablóny udalostí (Event templates)

Prednastavené šablóny:

- 🎂 **Narodeniny** (s automatickým opakovaním každý rok)
- 👨‍⚕️ **Lekárska prehliadka** (s pripomienkou na nasledujúci rok)
- 🏖️ **Dovolenka** (multi-day, s možnosťou pridať fotky)
- 🎓 **Školská udalosť** (s možnosťou pridať homework)

---

## IV. RODINA - INTERAKTÍVNY HUB

### 🎨 A. Vizuálny redesign

#### 1. "Family Tree" vizualizácia

```
┌──────────────────────────────────┐
│  Interaktívny rodinný strom      │
│  - Klikateľné uzly               │
│  - Hover zobrazí detail          │
│  - Zoomovanie (pinch gesture)    │
│  - Animated connections          │
└──────────────────────────────────┘
```

#### 2. "Family Dashboard" cards

```
┌─────────┬─────────┬─────────┐
│ Avatar  │ Status  │ Stats   │
│ & Name  │ 🏠 Doma │ 📊 Info │
├─────────┴─────────┴─────────┤
│  Quick actions:             │
│  [💬 Chat] [📞 Call] [📅 Cal]│
└─────────────────────────────┘
```

#### 3. "Heat signatures" - Aktivita členov

Vizuálny indikátor aktivity za posledný týždeň:

```
┌─────────────────────────────┐
│ 👤 Mária                    │
│ ▓▓▓▓▒▒▒ 78% aktívna         │
│ ▓ = posts/messages/events   │
└─────────────────────────────┘
```

### 🚀 B. Funkcionálne vylepšenia

#### 1. Rich profiles

Rozšírený profil člena:

- 🎂 Narodeniny + vek
- 📍 Posledná známa poloha (opt-in)
- 🎯 Záujmy & hobby
- 📊 Štatistiky (počet príspevkov, komentárov, ...)
- 🏆 Achievements (badges za aktivitu)
- 📅 Nadchádzajúce osobné udalosti
- 📸 Photo gallery (top 9 photos)

#### 2. "Where is everyone?" mapa

```javascript
// Real-time location sharing (opt-in)
- Interaktívna mapa s pozíciami členov
- Geofencing alerts ("Mama práve prišla domov")
- Location history (ak povolené)
- "Find my family" funkcia
```

#### 3. Family insights & stats

Týždenný/mesačný report:

- 💬 Najaktívnejší člen
- 📅 Nadchádzajúce udalosti
- 🎂 Blížiace sa narodeniny
- 📊 Family engagement score
- 🏆 Weekly challenges (gamifikácia)

#### 4. Roles & permissions

Rodinné roly:

- 👑 **Admin** (full control)
- 👨‍👩‍👧‍👦 **Parent** (most permissions)
- 👦 **Child** (limited, parental controls)
- 👴 **Elder** (customizable)
- 🏠 **Guest** (view only, temporary)

Permissions matrix pre každú rolu

---

## V. DENNÍK - NOVÁ SEKCIA

### 🎯 A. Koncept a architekúra

**Vízia:** Osobný denník s postupnou evolúciou do AI-powered "life journal" ktorý automaticky agreguje dáta z celej aplikácie a tvorí zmysluplné záznamy.

### 📱 B. FÁZA 1 - MVP (Immediate implementation)

#### 1. Základný denník

**Komponenty:**

```
/src/components/Diary/
├── Diary.jsx          // Hlavný komponent
├── DiaryEntry.jsx     // Jednotlivý záznam
├── DiaryEditor.jsx    // Editor (rich text)
├── DiaryCalendar.jsx  // Kalendárový pohľad
└── DiaryFilters.jsx   // Filtrovanie a search
```

**Štruktúra záznamu:**

```javascript
{
  id: string,
  userId: string,
  date: timestamp,
  mood: '😊' | '😐' | '😢' | '😡' | '🤗' | ...,
  weather: {
    temp, icon, description
  }, // opt-in API call
  title: string,
  content: string (rich text HTML),
  tags: string[],
  media: [
    { type: 'image|video', url: string }
  ],
  location: { lat, lng, name },
  privacy: 'private' | 'family' | 'public',
  aiSummary: string | null, // pre budúcnosť
  linkedEntries: {
    feedPosts: string[],
    chatMessages: string[],
    calendarEvents: string[],
    photos: string[]
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 2. UI/UX denníka

**Desktop:**

```
┌────────────────────────────────────────┐
│  [📅 Kalendár] [Záznamy] [Tagy]        │
├───────────────┬────────────────────────┤
│               │                        │
│  Mini         │  Dnes, 14.11.2025      │
│  Kalendár     │  ┌──────────────────┐  │
│  (highlight   │  │ 😊 Krásny deň    │  │
│   dni so      │  │                  │  │
│   záznamami)  │  │ Dnešné ráno...   │  │
│               │  │                  │  │
│               │  │ [Edit] [Delete]  │  │
│               │  └──────────────────┘  │
│               │                        │
│               │  Včera, 13.11.2025     │
│               │  ┌──────────────────┐  │
│               │  │ 😐 Normálny deň  │  │
│               │  └──────────────────┘  │
└───────────────┴────────────────────────┘
```

**Mobile:**

```
┌─────────────────────┐
│ Denník    [+ Nový]  │
├─────────────────────┤
│ [Filter: Všetky ▾]  │
├─────────────────────┤
│  Dnes               │
│  ┌─────────────────┐│
│  │ 😊 Krásny deň   ││
│  │ Dnešné ráno...  ││
│  └─────────────────┘│
│                     │
│  Včera              │
│  ┌─────────────────┐│
│  │ 😐 Normálny deň ││
│  └─────────────────┘│
└─────────────────────┘
```

#### 3. Rich Text Editor

**Features:**

- ✍️ Formátovanie textu (bold, italic, underline)
- 📝 Headings, lists, quotes
- 🔗 Linky
- 📷 Vkladanie obrázkov drag&drop
- 😊 Emoji picker
- 📎 Attachments
- 🎨 Syntax highlighting pre kód (ak potrebné)
- 💾 Auto-save (každých 5 sekúnd)
- 📱 Mobile-optimized keyboard

**Knižnica:** Slate.js alebo TipTap (React wrappers)

#### 4. Mood tracking

**Denná nálada:**

- Visual mood selector (veľké emoji)
- Mood calendar (celý mesiac na jednom pohľade)
- Mood trends (graf za mesiac/rok)
- Mood insights: "Tento mesiac ste boli 70% šťastný!"

### 🚀 C. FÁZA 2 - Smart Features (3-6 mesiacov)

#### 1. Auto-agregácia obsahu

Denník automaticky navrhne pridanie:

```javascript
// Pri vytvorení nového záznamu: "Chcete pridať do denníka?"

📸 Fotky z Feedu z dnešného dňa
💬 Zaujímavé konverzácie z Chatu
📅 Udalosti z Kalendára
📍 Navštívené miesta (location history)

// Implementácia:
const suggestContent = async (date) => {
  const suggestions = {
    feedPosts: await getFeedPostsByDate(date),
    calendarEvents: await getEventsByDate(date),
    photos: await getPhotosByDate(date),
    chatHighlights: await getChatHighlightsByDate(date)
  };
  return suggestions;
};
```

#### 2. Templates & prompts

**Denníkové šablóny:**

**🌅 "Ranný denník"** (guided prompts)

- → Ako sa cítim?
- → Čo dnes plánujem?
- → Za čo som vďačný?

**🌙 "Večerný denník"**

- → Čo sa dnes udialo?
- → Čo sa mi podarilo?
- → Čo by som zmenil?

**🎯 "Týždenný review"**

- → Top 3 momenty
- → Čo som sa naučil?
- → Ciele na budúci týždeň

**🎂 "Výročie/Udalosť"**

- → Custom šablóna pre špeciálne dni

#### 3. Tagging & kategorization

**Smart tagging:**

- `#rodina`, `#práca`, `#hobby`, `#cestovanie`, ...
- Auto-suggestions na základe obsahu
- Color-coded tags
- Tag clouds (vizualizácia najčastejších tém)
- Filter by multiple tags

### 🤖 D. FÁZA 3 - AI Integration (6-12 mesiacov)

#### 1. Lokálny LLM model

**Model:** Llama 3 8B / Mistral 7B (quantized pre NAS)
**Spustené cez:** Ollama na Synology NAS

**Funkcie:**

- Automatické zhrnutia
- Sentiment analysis
- Získavanie insights
- Generovanie denníkových záznamov

#### 2. Automatické denníkové záznamy

**AI pipeline:**

```
┌─────────────────────────────────────┐
│ 1. Data Collection                  │
│  - Feed posts (text + images)       │
│  - Chat messages (filtered)         │
│  - Calendar events                  │
│  - Photos metadata                  │
│  - Weather data                     │
│  - News highlights (optional)       │
└─────────────┬───────────────────────┘
              ▼
┌─────────────────────────────────────┐
│ 2. LLM Processing (lokálne)         │
│  Prompt engineering:                │
│  "Based on the following data..."   │
│  → Generate diary entry             │
│  → Extract key moments              │
│  → Identify emotions                │
│  → Suggest tags                     │
└─────────────┬───────────────────────┘
              ▼
┌─────────────────────────────────────┐
│ 3. User Review & Edit               │
│  - AI návrh zobrazený užívateľovi   │
│  - Možnosť editácie                 │
│  - Schválenie/zamietnutie           │
│  - Publikovanie                     │
└─────────────────────────────────────┘
```

**Príklad AI-generovaného záznamu:**

```
📅 Štvrtok, 14. november 2025
🌤️ 12°C, Slnečno

✨ Dnešný deň v skratke:
Krásny rodinný deň! Ráno sme s Markou išli na prechádzku do parku 🏞️,
poobede sme mali rodinnú videohovor s babkou a dedkom 👴👵.
Večer sme sledovali nový film a deti mali skvelú náladu! 🎬

📸 Najlepšie momenty:
  • Fotka z parku (Feed)
  • Smajlíky v chate od detí 😊
  • Plánovaný rodinný výlet na víkend

💭 Poznámky:
Treba nezabudnúť kúpiť darček pre Janka na narodeniny budúci týždeň!

🏷️ #rodina #voľnýčas #výlet
```

#### 3. Personálne insights

**AI-powered analytics:**

- 📊 "Tento mesiac ste boli najšťastnejší v stredu"
- 📈 "Vaša aktivita stúpla o 20% oproti minulému mesiacu"
- 🎯 "Najčastejšie témy: rodina (45%), práca (30%), hobby (25%)"
- 💡 "Môžete byť zaujatý o: cestovanie (na základe nedávnych príspevkov)"
- 🔮 Pattern recognition: "Každú nedeľu píšete o rodine"

#### 4. Smart search

**Natural language search:**

- "Všetky záznamy o dovolenke minulé leto"
- "Dni keď som bol smutný"
- "Čo som robil pred rokom?"
- "Najlepšie momenty s deťmi"

Semantic search (nie len keyword matching)

### 🌐 E. Integrácie pre budúcnosť

**External data sources (opt-in):**

- 🌤️ **Počasie** (OpenWeather API)
  - Automatické pridávanie počasia k záznamu
- 📰 **Správy** (NewsAPI)
  - Top 3 udalosti dňa (svet/slovensko)
  - Filter podľa preferencií (šport, tech, kultúra)
- 🎵 **Hudba** (Spotify API)
  - "Čo ste počúvali dnes?"
  - Top skladby dňa
- 📚 **Knihy** (Goodreads API)
  - Knižné poznámky
  - Reading progress
- 🏃 **Fitness** (Health API)
  - Kroky, kalórie, aktivita
  - Športové výkony
- 📍 **Poloha** (Location history)
  - Mapa navštívených miest
  - Travel journal

### 🔐 F. Privacy & Security

**Privacy controls:**

- 🔒 End-to-end encryption pre súkromné záznamy
- 👨‍👩‍👧‍👦 Rodinné záznamy (viditeľné pre rodinu)
- 🌍 Verejné záznamy (opt-in sharing)
- 🗑️ Automatické mazanie starých AI návrhov (90 dní)
- 📦 Export do PDF/JSON (backup)
- 🚫 Opt-out z AI features kedykoľvek

---

## VI. TECHNICKÁ ARCHITEKTÚRA - MIGRÁCIA NA NAS

### 🏗️ A. Príprava na migráciu

#### Súčasný stack (Firebase)

- **Frontend:** React 19 (hosting na Firebase)
- **Backend:** Firebase Functions (serverless)
- **Database:** Firestore (NoSQL)
- **Storage:** Firebase Storage
- **Auth:** Firebase Auth

#### Cieľový stack (Synology NAS DS925+)

**Hardware:** Synology DS925+ (AMD Ryzen)
**OS:** DSM 7.x

**Services:**

```
┌────────────────────────────────────┐
│  Docker Container Stack:           │
├────────────────────────────────────┤
│  1. Nginx Reverse Proxy            │
│  2. Node.js API Server (Express)   │
│  3. PostgreSQL Database            │
│  4. Redis (caching, sessions)      │
│  5. MinIO (S3-compatible storage)  │
│  6. Ollama (lokálny LLM)           │
│  7. Traefik (load balancer)        │
└────────────────────────────────────┘
```

### 🔄 B. Migračný plán

#### Fáza 1: Hybrid Setup (6 mesiacov)

```
┌──────────────────────────────────────┐
│ Frontend: Zostáva na Firebase        │
│ Auth: Zostáva Firebase Auth          │
│                                      │
│ Backend split:                       │
│  - Read-heavy: NAS (cache cez Redis)│
│  - Write-heavy: Firebase (sync→NAS) │
│                                      │
│ Database: Dual-write                 │
│  - Firebase Firestore (primary)     │
│  - PostgreSQL na NAS (replica)      │
└──────────────────────────────────────┘
```

**Benefits:**

- Zero downtime
- Postupná migrácia
- Rollback možnosť
- Testing v produkcii

#### Fáza 2: Full Migration (12 mesiacov)

```
┌──────────────────────────────────────┐
│ Frontend: Self-hosted na NAS         │
│  - Static hosting cez Nginx          │
│  - CDN (Cloudflare) pre assets       │
│                                      │
│ Auth: Vlastný JWT auth systém        │
│  - Sessions v Redis                  │
│  - 2FA support                       │
│                                      │
│ Backend: Komplet na NAS              │
│  - REST API (Express.js)             │
│  - GraphQL (optional)                │
│  - WebSocket (real-time)             │
│                                      │
│ Database: PostgreSQL + Redis         │
│  - Relational data                   │
│  - Fast caching                      │
│                                      │
│ Storage: MinIO                       │
│  - S3-compatible API                 │
│  - Lokálne súbory                    │
│                                      │
│ AI: Ollama LLM                       │
│  - Lokálne inferencing               │
│  - Žiadne cloud závislosti           │
└──────────────────────────────────────┘
```

### 🐳 C. Docker Compose setup

```yaml
version: '3.8'

services:
  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
      - frontend

  # Frontend (React build)
  frontend:
    build: ./frontend
    expose:
      - "3000"
    environment:
      - NODE_ENV=production

  # API Server
  api:
    build: ./backend
    expose:
      - "5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/rodinna_siet
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - postgres
      - redis
      - minio

  # Database
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=rodinna_siet
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=secure_password
    ports:
      - "5432:5432"

  # Cache & Sessions
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  # Object Storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=secure_password
    ports:
      - "9000:9000"
      - "9001:9001"

  # LLM Server
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G

volumes:
  postgres_data:
  redis_data:
  minio_data:
  ollama_data:
```

### 📊 D. Databázová schéma (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'member',
  status JSONB,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts (Feed)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media JSONB,  -- [{type, url}, ...]
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events (Calendar)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type VARCHAR(50),
  attendees JSONB,  -- ['all', 'selected', 'me']
  selected_members UUID[],
  reminder VARCHAR(50),
  repeat VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diary entries
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  mood VARCHAR(10),
  weather JSONB,
  title VARCHAR(255),
  content TEXT NOT NULL,
  tags TEXT[],
  media JSONB,
  location JSONB,
  privacy VARCHAR(20) DEFAULT 'private',
  ai_summary TEXT,
  linked_entries JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_diary_user_date ON diary_entries(user_id, entry_date DESC);
CREATE INDEX idx_diary_tags ON diary_entries USING GIN(tags);
```

### 🔐 E. Security measures

#### 1. Network Security:

- Firewall rules (DSM firewall)
- VPN access (Synology VPN Server)
- DDoS protection (Cloudflare)
- Fail2ban (brute force protection)

#### 2. Application Security:

- JWT tokens (short-lived + refresh)
- Rate limiting (Express middleware)
- Input validation (Joi/Zod)
- SQL injection prevention (parametrized queries)
- XSS protection (helmet.js)
- CSRF tokens

#### 3. Data Security:

- Encryption at rest (Synology encryption)
- TLS/SSL (Let's Encrypt)
- Backup strategy (3-2-1 rule)
- Regular security updates

#### 4. Monitoring:

- Prometheus + Grafana
- Log aggregation (ELK stack)
- Uptime monitoring (UptimeRobot)
- Alert system (email/SMS)

---

## VII. IMPLEMENTATION ROADMAP

### 🗓️ Q1 2025 (Mesiac 1-3): Foundation

#### Sprint 1-2: UI/UX Modernizácia

- Implementovať nový dizajnový systém (colors, gradients)
- Pridať micro-interactions a animácie (Framer Motion)
- Vytvoriť Command Palette (Cmd+K)
- Glassmorphism komponenty
- Dark mode vylepšenia

#### Sprint 3-4: Kalendár Revolution

- Trojitý pohľad (Month/Week/List)
- Interaktívny mesačný kalendár
- Drag & drop udalostí
- Event templates
- Weather integration (OpenWeather API)

#### Sprint 5-6: Rodina Hub

- Family Dashboard cards
- Rich profiles
- Aktivita tracking (heat signatures)
- Roles & permissions systém

### Q2 2025 (Mesiac 4-6): Denník MVP

#### Sprint 7-8: Základný denník

- Databázová schéma (Firestore)
- Denník komponenty (Diary.jsx, DiaryEntry.jsx, ...)
- Rich text editor (Slate.js/TipTap)
- Kalendárový pohľad na záznamy
- Mood tracking
- Tagging systém

#### Sprint 9-10: Denník Features

- Templates & prompts
- Media attachments (foto, video)
- Location support
- Privacy controls (private/family/public)
- Search & filters

#### Sprint 11-12: NAS Príprava

- Synology NAS setup (Docker)
- PostgreSQL migrácia skriptov
- API layer (Express.js)
- Hybrid setup (Firebase + NAS)

### Q3 2025 (Mesiac 7-9): Smart Features

#### Sprint 13-14: Auto-agregácia

- Suggestions engine (pridať do denníka?)
- Feed posts integration
- Calendar events integration
- Chat highlights (opt-in)
- Photo timeline

#### Sprint 15-16: AI Príprava

- Ollama setup na NAS
- LLM model selection (Llama 3 8B / Mistral 7B)
- Prompt engineering
- API endpoint pre LLM

#### Sprint 17-18: NAS Migrácia Fáza 1

- Dual-write implementácia
- Redis caching layer
- MinIO storage migration
- Load testing

### Q4 2025 (Mesiac 10-12): AI & Finalizácia

#### Sprint 19-20: AI Integration

- Automatické zhrnutia (AI-powered)
- Sentiment analysis
- Auto-generované denníkové záznamy
- Smart search (semantic)
- Personálne insights

#### Sprint 21-22: Pokročilé integrácie

- News API integration
- Weather history
- Spotify/Music integration (opt-in)
- Fitness tracking (Health API)

#### Sprint 23-24: Polish & Launch

- Performance optimizácie
- Security audit
- User acceptance testing
- Documentation
- 🚀 **Production launch na NAS**

---

## VIII. TECHNOLOGIES & LIBRARIES

### 📦 Nové dependencies

```json
{
  "dependencies": {
    // Animácie
    "framer-motion": "^11.0.0",

    // Rich Text Editor
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",

    // Calendar
    "react-big-calendar": "^1.10.0",
    "date-fns": "^3.0.0",

    // Charts & Visualizations
    "recharts": "^2.10.0",
    "react-calendar-heatmap": "^1.9.0",

    // Search
    "fuse.js": "^7.0.0",
    "@algolia/client-search": "^4.20.0",

    // Image processing
    "sharp": "^0.33.0",
    "react-image-crop": "^11.0.0",

    // Markdown/Rich text
    "marked": "^11.0.0",
    "dompurify": "^3.0.0",

    // State management (optional upgrade)
    "zustand": "^4.4.0",  // lighter než Redux

    // Backend (NAS)
    "express": "^4.18.0",
    "pg": "^8.11.0",          // PostgreSQL client
    "ioredis": "^5.3.0",      // Redis client
    "minio": "^7.1.0",        // S3-compatible storage
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",

    // AI/LLM
    "langchain": "^0.1.0",    // Pre prácu s LLM
    "ollama": "^0.1.0"        // Ollama client
  }
}
```

---

## IX. ESTIMATED COSTS

### 💰 Infrastructure

**Synology DS925+ NAS:** ~€800 (one-time)
**Storage (4x 4TB NVMe):** ~€1200 (one-time)
**UPS (backup power):** ~€150 (one-time)

**Total initial:** ~€2150

**Monthly costs:**

- Electricity: ~€15/month
- Domain + SSL: ~€10/month
- Backup storage (cloud): ~€5/month

**Total monthly:** ~€30/month

**vs Firebase costs (estimate):**

- Storage: €25/month
- Functions: €50/month
- Bandwidth: €30/month

**Total:** €105/month

**ROI:** ~20 mesiacov break-even

### Development time estimate

- UI/UX Modernizácia: **80 hours**
- Kalendár Revolution: **100 hours**
- Rodina Hub: **60 hours**
- Denník MVP: **120 hours**
- Smart Features: **100 hours**
- AI Integration: **80 hours**
- NAS Migrácia: **120 hours**

**Total:** ~660 hours (4-5 mesiacov pri full-time) alebo 10-12 mesiacov pri part-time

---

## X. PRIORITIZÁCIA & ODPORÚČANIA

### 🔥 HIGH PRIORITY (Start immediately)

1. **Command Palette** - Okamžitý "wow" efekt, zlepší UX
2. **Kalendár modernizácia** - Veľký vizuálny upgrade
3. **Denník MVP** - Nová core feature
4. **Animácie** - Aplikácia bude pôsobiť živšie

### ⚡ MEDIUM PRIORITY (Q2-Q3 2025)

1. **Rodina Hub vylepšenia** - Nice-to-have features
2. **Smart agregácia** - Postupné pridávanie
3. **NAS príprava** - Hybrid setup

### 🔮 LOW PRIORITY (Q4 2025+)

1. **AI features** - Potrebuje LLM infraštruktúru
2. **Pokročilé integrácie** - Spotify, News API, ...
3. **Full NAS migrácia** - Až po stabilizácii hybrid setupu

---

## XI. RISK ASSESSMENT

### ⚠️ Technické riziká:

#### 1. LLM performance na NAS

- **Risk:** Nízka
- **Mitigation:** Quantized models (4-bit), GPU support (ak dostupné)

#### 2. Data migrácia Firebase → PostgreSQL

- **Risk:** Stredná
- **Mitigation:** Dual-write fáza, postupná migrácia

#### 3. Downtime počas migrácie

- **Risk:** Nízka
- **Mitigation:** Hybrid setup, blue-green deployment

#### 4. Storage capacity

- **Risk:** Nízka
- **Mitigation:** 16TB celkovo, kompresia médií

### User Experience riziká:

#### 1. Learning curve (nové features)

- **Risk:** Nízka
- **Mitigation:** Onboarding tour, tooltips, dokumentácia

#### 2. Performance pri väčšom počte užívateľov

- **Risk:** Stredná
- **Mitigation:** Redis caching, database indexing, lazy loading

---

## 🎯 ZÁVER A NEXT STEPS

### Kľúčové výstupy:

✅ **UI/UX Modernizácia** - Nový dizajnový jazyk "Family Flow" s gradientmi, glassmorphism a micro-interakciami

✅ **Kalendár Revolution** - Trojitý pohľad, drag & drop, smart suggestions, weather integration

✅ **Rodina Hub** - Rich profiles, family dashboard, activity tracking, roles & permissions

✅ **Denník (NOVÁ SEKCIA)** - Komplexná 3-fázová implementácia:

- **Fáza 1:** MVP denník s rich text editorom, mood tracking, taggingom
- **Fáza 2:** Smart agregácia obsahu z Feedu, Kalendára, Chatu
- **Fáza 3:** AI integration s lokálnym LLM na NAS (automatické zhrnutia, insights)

✅ **Migrácia na NAS** - Detailný technický plán s hybrid setupom a postupnou migráciou

✅ **Implementation Roadmap** - 12-mesačný plán rozdelený do sprintov

### Odporúčané kroky:

#### Option 1: Quick Wins (2-4 týždne)

1. Implementovať Command Palette (Cmd+K)
2. Pridať animácie a micro-interactions
3. Vytvoriť Denník MVP základy

#### Option 2: Major Features (2-3 mesiace)

1. Kalendár kompletná modernizácia
2. Denník MVP + smart features
3. Rodina Hub vylepšenia

#### Option 3: Full Vision (12 mesiacov)

1. Postupná implementácia podľa roadmapu
2. NAS migrácia
3. AI integration

---

**Dokument vytvoril:** Claude AI (Anthropic)
**Pre projekt:** Rodinná Sieť
**Dátum:** 15. november 2025
**Verzia:** v1.0

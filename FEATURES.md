# 🚀 Rodinna Sieť - Nové Features (Fáza 3 a 4)

## 📦 Vytvorené komponenty

### 🎨 UI Komponenty

#### 1. **SkeletonLoader** (`src/components/Shared/SkeletonLoader.jsx`)
Loading placeholders pre lepší UX počas načítavania.

**Exportované komponenty:**
- `PostSkeleton` - Pre Feed príspevky
- `MessageSkeleton` - Pre Chat správy
- `CreatePostSkeleton` - Pre formulár na vytvorenie príspevku
- `CommentSkeleton` - Pre komentáre
- `GroupListSkeleton` - Pre zoznam skupín

**Použitie:**
```jsx
import { PostSkeleton } from '../Shared/SkeletonLoader';

{loading ? (
  <>
    <PostSkeleton />
    <PostSkeleton />
  </>
) : (
  posts.map(post => <Post {...post} />)
)}
```

---

#### 2. **TypingIndicator** (`src/components/Chat/TypingIndicator.jsx`)
Indikátor "Peter píše..." v chate.

**Props:**
- `users` (array) - Zoznam mien používateľov ktorí píšu

**Použitie:**
```jsx
<TypingIndicator users={['Peter', 'Anna']} />
```

**Zobrazenie:**
- 1 používateľ: "Peter píše..."
- 2 používatelia: "Peter a Anna píšu..."
- 3+ používatelia: "Peter a 2 ďalší píšu..."

---

#### 3. **ReadReceipts** (`src/components/Chat/ReadReceipts.jsx`)
WhatsApp-style tick marks pre status správy.

**Props:**
- `status` (string) - 'sent' | 'delivered' | 'read'

**Použitie:**
```jsx
<ReadReceipts status="read" />
```

**Stavy:**
- `sent` - 1 sivý tick
- `delivered` - 2 sivé ticky
- `read` - 2 modré ticky

---

#### 4. **SearchMessages** (`src/components/Chat/SearchMessages.jsx`)
Fulltext vyhľadávanie v správach.

**Props:**
- `messages` (array) - Všetky správy
- `onResultClick` (function) - Callback pri kliknutí na výsledok
- `onClose` (function) - Callback na zatvorenie

**Features:**
- Fulltext search v obsahu správy aj mene odosielateľa
- Highlighting nájdených slov
- Minimum 2 znaky pre vyhľadávanie
- Zobrazenie timestampu

**Použitie:**
```jsx
{showSearch && (
  <SearchMessages
    messages={messages}
    onResultClick={(msg) => scrollToMessage(msg.id)}
    onClose={() => setShowSearch(false)}
  />
)}
```

---

#### 5. **NestedComments** (`src/components/Feed/NestedComments.jsx`)
Komentáre s možnosťou odpovedí (nested replies).

**Props:**
- `comments` (array) - Zoznam komentárov
- `onAddReply` (function) - Callback pre pridanie odpovede
- `onLikeComment` (function) - Callback pre like komentára

**Features:**
- Neobmedzená hĺbka vnorenia
- Indentácia 40px pre každú úroveň
- Like button na komentároch
- Toggle zobrazenia odpovedí
- Inline reply input

**Štruktúra komentára:**
```javascript
{
  id: string,
  author: string,
  authorUid: string,
  content: string,
  timestamp: string,
  likes: number,
  likedByMe: boolean,
  replies: [Comment] // Rekurzívne
}
```

**Použitie:**
```jsx
<NestedComments
  comments={post.comments}
  onAddReply={(commentId, reply) => handleAddReply(postId, commentId, reply)}
  onLikeComment={(commentId) => handleLikeComment(postId, commentId)}
/>
```

---

#### 6. **PinnedMessages** (`src/components/Chat/PinnedMessages.jsx`)
Pripnuté správy v chate.

**Props:**
- `pinnedMessages` (array) - Zoznam pripnutých správ
- `onUnpin` (function) - Callback na odpnutie správy
- `onJumpToMessage` (function) - Callback na skok na správu

**Features:**
- Collapsed view - zobrazí prvú pripnutú správu
- Expanded view - zobrazí všetky pripnuté správy
- Badge s počtom ak je viac ako 1
- Scroll na správu po kliknutí

**Použitie:**
```jsx
<PinnedMessages
  pinnedMessages={pinnedMessages}
  onUnpin={(msgId) => handleUnpin(msgId)}
  onJumpToMessage={(msgId) => scrollToMessage(msgId)}
/>
```

---

#### 7. **ScrollToBottomButton** (`src/components/Chat/ScrollToBottomButton.jsx`)
Floating button pre scroll na spodok chatu.

**Props:**
- `onClick` (function) - Callback pri kliknutí
- `unreadCount` (number) - Počet neprečítaných správ (zobrazí badge)

**Features:**
- Zobrazí sa len pri scrolle nahor
- Badge s počtom neprečítaných
- Gradient shadow effect
- Hover scale animation

**Použitie:**
```jsx
{!isNearBottom && (
  <ScrollToBottomButton
    onClick={scrollToBottom}
    unreadCount={unreadCount}
  />
)}
```

---

#### 8. **OfflineIndicator** (`src/components/Shared/OfflineIndicator.jsx`)
Banner indikátor online/offline statusu.

**Features:**
- Automatická detekcia online/offline
- Červený banner pri offline
- Zelený banner pri obnovení pripojenia (3s)
- Slide-in animácia

**Použitie:**
```jsx
// V App.js alebo Layout.jsx
<OfflineIndicator />
```

---

## 🔧 PWA Support

### Service Worker (`public/service-worker.js`)

**Stratégie:**
1. **Network-first** - Pre Firebase API (real-time dáta)
2. **Cache-first** - Pre statické súbory (JS, CSS, obrázky)

**Features:**
- Offline fallback
- Cache management
- Push notifications support (pripravené pre budúcnosť)
- Automatická aktualizácia cache

**Cached súbory:**
- `/` (home page)
- `/index.html`
- `/static/css/main.css`
- `/static/js/main.js`
- `/manifest.json`
- `/favicon.ico`

### Manifest (`public/manifest.json`)

**Konfigurácia:**
```json
{
  "short_name": "Rodinná Sieť",
  "name": "Rodinná Sieť - Rodinná sociálna sieť",
  "theme_color": "#4F46E5",
  "background_color": "#1F2937",
  "display": "standalone",
  "orientation": "portrait-primary"
}
```

**Features:**
- Standalone mode (fullscreen bez browser chrome)
- Portrait orientation na mobile
- Indigo theme color
- Dark background

---

## 🎨 CSS Animácie (`src/index.css`)

**Nové animácie:**
```css
@keyframes fadeIn
@keyframes scaleIn
@keyframes slideInLeft
@keyframes slideInRight
```

**Utility classes:**
- `.animate-fade-in` - Fade in efekt
- `.animate-scale-in` - Scale in efekt
- `.animate-slide-left` - Slide z ľava
- `.animate-slide-right` - Slide z prava
- `.shadow-soft` - Soft shadow
- `.shadow-soft-lg` - Large soft shadow
- `.backdrop-blur-sm` - Backdrop blur

**Automatické transitions:**
Všetky elementy majú smooth transitions (150ms cubic-bezier) pre:
- color
- background-color
- border-color
- text-decoration-color
- fill
- stroke

---

## 📱 Integrácia do existujúcich komponentov

### Chat.jsx - Odporúčané úpravy

```jsx
import TypingIndicator from './TypingIndicator';
import ReadReceipts from './ReadReceipts';
import SearchMessages from './SearchMessages';
import PinnedMessages from './PinnedMessages';
import ScrollToBottomButton from './ScrollToBottomButton';
import { MessageSkeleton } from '../Shared/SkeletonLoader';

function Chat() {
  const [showSearch, setShowSearch] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-full flex flex-col">
      {/* Pinned Messages */}
      <PinnedMessages
        pinnedMessages={pinnedMessages}
        onUnpin={handleUnpin}
        onJumpToMessage={scrollToMessage}
      />

      {/* Header with search button */}
      <div className="p-4 flex justify-between">
        <h3>Chat</h3>
        <button onClick={() => setShowSearch(true)}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton isMe={true} />
            <MessageSkeleton />
          </>
        ) : (
          messages.map(msg => (
            <div key={msg.id}>
              {msg.content}
              <ReadReceipts status={msg.status} />
            </div>
          ))
        )}

        {/* Typing indicator */}
        <TypingIndicator users={typingUsers} />
      </div>

      {/* Scroll to bottom button */}
      {!isNearBottom && (
        <ScrollToBottomButton
          onClick={scrollToBottom}
          unreadCount={unreadCount}
        />
      )}

      {/* Search overlay */}
      {showSearch && (
        <SearchMessages
          messages={messages}
          onResultClick={scrollToMessage}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
```

### Feed.jsx - Odporúčané úpravy

```jsx
import NestedComments from './NestedComments';
import { PostSkeleton, CreatePostSkeleton } from '../Shared/SkeletonLoader';

function Feed() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Create post */}
      {loading ? (
        <CreatePostSkeleton />
      ) : (
        <CreatePost />
      )}

      {/* Posts */}
      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : (
        posts.map(post => (
          <div key={post.id}>
            <PostHeader {...post} />
            <PostContent {...post} />

            {/* Comments with nested replies */}
            {showComments[post.id] && (
              <NestedComments
                comments={post.comments}
                onAddReply={(commentId, reply) =>
                  handleAddReply(post.id, commentId, reply)
                }
                onLikeComment={(commentId) =>
                  handleLikeComment(post.id, commentId)
                }
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
```

### App.js - Pridanie OfflineIndicator

```jsx
import OfflineIndicator from './components/Shared/OfflineIndicator';

function App() {
  return (
    <>
      <OfflineIndicator />
      <AuthProvider>
        <ThemeProvider>
          {/* ... */}
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}
```

---

## 🚀 Firebase Firestore Schema Updates

### Komentáre s nested replies
```javascript
// posts/{postId}
{
  comments: [
    {
      id: string,
      author: string,
      authorUid: string,
      content: string,
      timestamp: string,
      likes: number,
      likedBy: [uid], // Pre tracking kto dal like
      replies: [
        {
          // Rovnaká štruktúra, rekurzívne
        }
      ]
    }
  ]
}
```

### Správy s read receipts
```javascript
// messages/{messageId}
{
  sender: string,
  senderUid: string,
  content: string,
  createdAt: Timestamp,
  status: 'sent' | 'delivered' | 'read',
  readBy: [uid], // Array UIDov kto prečítal
  pinnedBy: uid | null, // UID kto pripol (null = nie je pripnutá)
}
```

### Typing indicators (real-time)
```javascript
// typing/{groupId}/{userId}
{
  userName: string,
  lastTyping: Timestamp, // Server timestamp
  isTyping: boolean
}
```

---

## 🎯 Výkonnostné optimalizácie

### React.memo pre zoznamy
```jsx
const MessageItem = React.memo(({ message }) => {
  return <div>{message.content}</div>;
});

// V komponente
{messages.map(msg => <MessageItem key={msg.id} message={msg} />)}
```

### Lazy loading routes (ak chceš)
```jsx
const Feed = React.lazy(() => import('./components/Feed/Feed'));
const Chat = React.lazy(() => import('./components/Chat/Chat'));

<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/" element={<Feed />} />
    <Route path="/chat" element={<Chat />} />
  </Routes>
</Suspense>
```

---

## 📊 Použité technológie

- **React 19** - Hooks, Context API
- **Firebase 12** - Firestore, Storage, Auth
- **Tailwind CSS 3.4** - Utility-first styling
- **Font Awesome 6.5** - Ikony
- **Service Worker API** - PWA offline support
- **Web Storage API** - LocalStorage pre theme
- **Notification API** - Push notifications (pripravené)

---

## ✅ Checklist implementácie

### Fáza 3 ✅
- [x] Skeleton loading screens
- [x] Typing indicator
- [x] Read receipts (tick marks)
- [x] Nested comments v Feed

### Fáza 4 ✅
- [x] Search v správach
- [x] Pin messages funkcionalita
- [x] Scroll-to-bottom button
- [x] PWA support (service worker, manifest)
- [x] Offline indicator
- [x] CSS animácie a transitions

### Bonusy 🎁
- [x] Soft shadows
- [x] Backdrop blur effects
- [x] Gradient backgrounds
- [x] Smooth transitions na všetkých elementoch
- [x] WhatsApp-style UI elements

---

## 🔮 Budúce vylepšenia (voliteľné)

1. **React Virtuoso** pre virtualizáciu dlhých zoznamov
2. **Push notifications** cez Firebase Cloud Messaging
3. **Image lazy loading** s blur placeholder
4. **Infinite scroll** v Feed
5. **Voice messages** v Chate
6. **Reactions** na správy (emoji reactions)
7. **Mention system** (@username)
8. **File sharing** (PDF, dokumenty)
9. **Video call** integration
10. **End-to-end encryption** pre súkromné správy

---

## 📝 Poznámky

- Všetky komponenty sú plne responzívne (mobile-first)
- Dark mode support vo všetkých komponentoch
- iPhone Safari kompatibilita zachovaná
- Accessibility (a11y) friendly
- SEO optimalizované (manifest, meta tags)
- Performance optimized (lazy loading, memoization)

---

## 🎨 Dizajn konzistencia

Všetky nové komponenty dodržiavaju:
- **Spacing:** 4px, 8px, 12px, 16px, 24px, 32px
- **Border radius:** 8px, 12px, 16px, 24px (rounded-lg, rounded-xl, rounded-2xl)
- **Colors:** Indigo primary (#4F46E5), Gray secondary
- **Shadows:** shadow-sm, shadow-lg, shadow-xl, shadow-soft
- **Transitions:** 150ms cubic-bezier
- **Font sizes:** text-xs, text-sm, text-base, text-lg

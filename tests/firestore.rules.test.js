/**
 * FIRESTORE RULES TESTY
 *
 * Tento súbor testuje bezpečnostné pravidlá pre Firestore databázu.
 * Simuluje rôzne scenáre a overuje, či pravidlá fungujú správne.
 */

const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Načítaj Firestore pravidlá zo súboru
const FIRESTORE_RULES = fs.readFileSync(
  path.resolve(__dirname, '../firestore.rules'),
  'utf8'
);

let testEnv;

/**
 * SETUP - spustí sa pred všetkými testami
 */
before(async () => {
  console.log('\n🔥 Inicializujem testové Firebase prostredie...\n');

  testEnv = await initializeTestEnvironment({
    projectId: 'rodinna-siet-test',
    firestore: {
      rules: FIRESTORE_RULES,
      host: 'localhost',
      port: 8080
    }
  });
});

/**
 * CLEANUP - spustí sa po každom teste
 */
afterEach(async () => {
  // Vyčisti databázu po každom teste
  await testEnv.clearFirestore();
});

/**
 * TEARDOWN - spustí sa po všetkých testoch
 */
after(async () => {
  console.log('\n🧹 Čistím testové prostredie...\n');
  await testEnv.cleanup();
});

// ============================================================================
// TESTY PRE CONFIG KOLEKCIU (Whitelist)
// ============================================================================

describe('📋 Config kolekcia (Whitelist)', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať whitelist', async () => {
    // Kontext: Používateľ nie je prihlásený (null)
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    // Pokús sa načítať whitelist bez prihlásenia
    const whitelistRef = unauthedDb.collection('config').doc('allowedEmails');

    // Očakávame FAIL - mal by byť zamietnutý
    await assertFails(whitelistRef.get());
  });

  it('✅ Autentifikovaný používateľ MÔŽE čítať whitelist', async () => {
    // Kontext: Prihlásený používateľ s UID 'user123'
    const authedDb = testEnv.authenticatedContext('user123').firestore();

    // Najprv vytvor whitelist dokument ako admin
    const adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
    await adminDb.collection('users').doc('admin').set({ role: 'admin' });
    await adminDb.collection('config').doc('allowedEmails').set({ emails: ['test@test.sk'] });

    // Teraz sa pokús čítať ako normálny používateľ
    const whitelistRef = authedDb.collection('config').doc('allowedEmails');

    // Očakávame SUCCESS - prihlásený používateľ môže čítať
    await assertSucceeds(whitelistRef.get());
  });

  it('❌ Normálny používateľ NEMÔŽE upravovať whitelist', async () => {
    // Používateľ bez admin role
    const userDb = testEnv.authenticatedContext('user123').firestore();
    await userDb.collection('users').doc('user123').set({ role: 'member' });

    const whitelistRef = userDb.collection('config').doc('allowedEmails');

    // Pokús sa upraviť whitelist
    await assertFails(whitelistRef.set({ emails: ['hacker@evil.com'] }));
  });

  it('✅ Admin MÔŽE upravovať whitelist', async () => {
    // Kontext: Admin používateľ
    const adminDb = testEnv.authenticatedContext('admin').firestore();
    await adminDb.collection('users').doc('admin').set({ role: 'admin' });

    const whitelistRef = adminDb.collection('config').doc('allowedEmails');

    // Admin môže upraviť whitelist
    await assertSucceeds(whitelistRef.set({ emails: ['admin@family.sk'] }));
  });
});

// ============================================================================
// TESTY PRE USERS KOLEKCIU
// ============================================================================

describe('👥 Users kolekcia', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať profily', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const userRef = unauthedDb.collection('users').doc('user123');

    await assertFails(userRef.get());
  });

  it('✅ Autentifikovaný používateľ MÔŽE čítať profily', async () => {
    const authedDb = testEnv.authenticatedContext('user123').firestore();

    // Vytvor používateľský profil
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc('otherUser').set({
        name: 'Other User',
        email: 'other@test.sk'
      });
    });

    const userRef = authedDb.collection('users').doc('otherUser');
    await assertSucceeds(userRef.get());
  });

  it('✅ Používateľ MÔŽE upravovať svoj vlastný profil', async () => {
    const userDb = testEnv.authenticatedContext('user123').firestore();
    const ownProfileRef = userDb.collection('users').doc('user123');

    await assertSucceeds(ownProfileRef.set({
      name: 'My Name',
      email: 'user123@test.sk'
    }));
  });

  it('❌ Používateľ NEMÔŽE upravovať cudzí profil', async () => {
    const userDb = testEnv.authenticatedContext('user123').firestore();
    const otherProfileRef = userDb.collection('users').doc('otherUser');

    await assertFails(otherProfileRef.set({
      name: 'Hacked Name'
    }));
  });
});

// ============================================================================
// TESTY PRE POSTS KOLEKCIU (Príspevky)
// ============================================================================

describe('📝 Posts kolekcia', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať príspevky', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const postRef = unauthedDb.collection('posts').doc('post123');

    await assertFails(postRef.get());
  });

  it('✅ Autentifikovaný používateľ MÔŽE vytvoriť príspevok', async () => {
    const userDb = testEnv.authenticatedContext('user123').firestore();

    await assertSucceeds(userDb.collection('posts').add({
      author: { uid: 'user123', name: 'Test User' },
      content: 'Testovací príspevok',
      reactions: [],
      comments: [],
      likes: 0
    }));
  });

  it('✅ Vlastník príspevku MÔŽE upraviť svoj príspevok', async () => {
    const userDb = testEnv.authenticatedContext('user123').firestore();

    // Vytvor príspevok
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('posts').doc('post123').set({
        author: { uid: 'user123', name: 'Test User' },
        content: 'Original content',
        reactions: [],
        comments: [],
        likes: 0
      });
    });

    // Uprav svoj príspevok
    const postRef = userDb.collection('posts').doc('post123');
    await assertSucceeds(postRef.update({
      content: 'Updated content'
    }));
  });

  it('✅ Iný používateľ MÔŽE pridať reakciu na cudzí príspevok', async () => {
    const ownerDb = testEnv.authenticatedContext('owner').firestore();
    const otherDb = testEnv.authenticatedContext('other').firestore();

    // Vytvor príspevok od vlastníka
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('posts').doc('post123').set({
        author: { uid: 'owner', name: 'Owner' },
        content: 'Some post',
        reactions: [],
        comments: [],
        likes: 0
      });
    });

    // Iný používateľ pridá reakciu
    const postRef = otherDb.collection('posts').doc('post123');
    await assertSucceeds(postRef.update({
      reactions: [{ emoji: '👍', userId: 'other', userName: 'Other User' }],
      likes: 1
    }));
  });

  it('❌ Iný používateľ NEMÔŽE zmeniť obsah cudzieho príspevku', async () => {
    const otherDb = testEnv.authenticatedContext('other').firestore();

    // Vytvor príspevok od iného vlastníka
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('posts').doc('post123').set({
        author: { uid: 'owner', name: 'Owner' },
        content: 'Original content',
        reactions: [],
        comments: [],
        likes: 0
      });
    });

    // Pokús sa zmeniť obsah
    const postRef = otherDb.collection('posts').doc('post123');
    await assertFails(postRef.update({
      content: 'HACKED CONTENT!'
    }));
  });

  it('✅ Vlastník MÔŽE zmazať svoj príspevok', async () => {
    const userDb = testEnv.authenticatedContext('user123').firestore();

    // Vytvor príspevok
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('posts').doc('post123').set({
        author: { uid: 'user123', name: 'Test User' },
        content: 'To be deleted'
      });
    });

    const postRef = userDb.collection('posts').doc('post123');
    await assertSucceeds(postRef.delete());
  });

  it('❌ Iný používateľ NEMÔŽE zmazať cudzí príspevok', async () => {
    const otherDb = testEnv.authenticatedContext('other').firestore();

    // Vytvor príspevok od iného vlastníka
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('posts').doc('post123').set({
        author: { uid: 'owner', name: 'Owner' },
        content: 'Protected post'
      });
    });

    const postRef = otherDb.collection('posts').doc('post123');
    await assertFails(postRef.delete());
  });
});

// ============================================================================
// TESTY PRE MESSAGES KOLEKCIU (Chat)
// ============================================================================

describe('💬 Messages kolekcia (Chat)', () => {

  it('✅ Autentifikovaný používateľ MÔŽE odoslať správu', async () => {
    const userDb = testEnv.authenticatedContext('user123').firestore();

    await assertSucceeds(userDb.collection('messages').add({
      sender: 'Test User',
      senderUid: 'user123',
      content: 'Ahoj!',
      reactions: []
    }));
  });

  it('✅ Iný používateľ MÔŽE pridať reakciu na správu', async () => {
    const otherDb = testEnv.authenticatedContext('other').firestore();

    // Vytvor správu
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('messages').doc('msg123').set({
        sender: 'Someone',
        senderUid: 'someone',
        content: 'Test message',
        reactions: []
      });
    });

    // Pridaj reakciu
    const msgRef = otherDb.collection('messages').doc('msg123');
    await assertSucceeds(msgRef.update({
      reactions: [{ emoji: '❤️', userId: 'other' }]
    }));
  });

  it('❌ Iný používateľ NEMÔŽE zmazať cudziu správu', async () => {
    const otherDb = testEnv.authenticatedContext('other').firestore();

    // Vytvor správu od iného odosielateľa
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('messages').doc('msg123').set({
        sender: 'Owner',
        senderUid: 'owner',
        content: 'My message'
      });
    });

    const msgRef = otherDb.collection('messages').doc('msg123');
    await assertFails(msgRef.delete());
  });
});

console.log('\n✅ Všetky Firestore rules testy dokončené!\n');

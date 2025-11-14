/**
 * STORAGE RULES TESTY
 *
 * Tento súbor testuje bezpečnostné pravidlá pre Firebase Storage (súbory).
 * Testuje, kto môže nahrávať, čítať a mazať súbory (fotky, videá, prílohy).
 */

const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Načítaj Storage pravidlá zo súboru
const STORAGE_RULES = fs.readFileSync(
  path.resolve(__dirname, '../storage.rules'),
  'utf8'
);

let testEnv;

/**
 * SETUP - spustí sa pred všetkými testami
 */
before(async () => {
  console.log('\n🔥 Inicializujem testové Storage prostredie...\n');

  testEnv = await initializeTestEnvironment({
    projectId: 'rodinna-siet-test',
    storage: {
      rules: STORAGE_RULES,
      host: 'localhost',
      port: 9199
    }
  });
});

/**
 * CLEANUP - spustí sa po každom teste
 */
afterEach(async () => {
  // Vyčisti storage po každom teste
  await testEnv.clearStorage();
});

/**
 * TEARDOWN - spustí sa po všetkých testoch
 */
after(async () => {
  console.log('\n🧹 Čistím testové Storage prostredie...\n');
  await testEnv.cleanup();
});

// ============================================================================
// TESTY PRE POSTS OBRÁZKY
// ============================================================================

describe('🖼️ Posts obrázky', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať post obrázky', async () => {
    const unauthedStorage = testEnv.unauthenticatedContext().storage();

    // Najprv nahraj obrázok ako prihlásený používateľ
    const authedStorage = testEnv.authenticatedContext('user123').storage();
    const fileRef = authedStorage.ref('posts/user123/photo.jpg');
    await fileRef.put(Buffer.from('fake-image-data'));

    // Pokús sa čítať bez prihlásenia
    const unauthedFileRef = unauthedStorage.ref('posts/user123/photo.jpg');
    await assertFails(unauthedFileRef.getDownloadURL());
  });

  it('✅ Autentifikovaný používateľ MÔŽE čítať post obrázky', async () => {
    const ownerStorage = testEnv.authenticatedContext('owner').storage();
    const otherStorage = testEnv.authenticatedContext('other').storage();

    // Vlastník nahrá obrázok
    const fileRef = ownerStorage.ref('posts/owner/photo.jpg');
    await assertSucceeds(fileRef.put(Buffer.from('fake-image-data')));

    // Iný prihlásený používateľ môže čítať
    const otherFileRef = otherStorage.ref('posts/owner/photo.jpg');
    await assertSucceeds(otherFileRef.getDownloadURL());
  });

  it('✅ Vlastník MÔŽE nahrať svoj post obrázok', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const fileRef = userStorage.ref('posts/user123/myPhoto.jpg');

    await assertSucceeds(fileRef.put(Buffer.from('my-photo-data')));
  });

  it('❌ Používateľ NEMÔŽE nahrať obrázok do cudzieho priečinka', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const otherFileRef = userStorage.ref('posts/otherUser/hacked.jpg');

    await assertFails(otherFileRef.put(Buffer.from('hacked-data')));
  });
});

// ============================================================================
// TESTY PRE CHAT PRÍLOHY
// ============================================================================

describe('📎 Chat prílohy', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať chat prílohy', async () => {
    const unauthedStorage = testEnv.unauthenticatedContext().storage();

    // Najprv nahraj prílohu
    const authedStorage = testEnv.authenticatedContext('user123').storage();
    await authedStorage.ref('chat/user123/attachment.jpg').put(Buffer.from('chat-image'));

    // Pokús sa čítať bez prihlásenia
    const unauthedFileRef = unauthedStorage.ref('chat/user123/attachment.jpg');
    await assertFails(unauthedFileRef.getDownloadURL());
  });

  it('✅ Autentifikovaný používateľ MÔŽE čítať chat prílohy', async () => {
    const ownerStorage = testEnv.authenticatedContext('owner').storage();
    const otherStorage = testEnv.authenticatedContext('other').storage();

    // Vlastník nahrá prílohu
    await assertSucceeds(ownerStorage.ref('chat/owner/file.pdf').put(Buffer.from('pdf-data')));

    // Iný prihlásený používateľ môže čítať
    await assertSucceeds(otherStorage.ref('chat/owner/file.pdf').getDownloadURL());
  });

  it('✅ Vlastník MÔŽE nahrať svoju chat prílohu', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const fileRef = userStorage.ref('chat/user123/myFile.jpg');

    await assertSucceeds(fileRef.put(Buffer.from('my-file-data')));
  });

  it('❌ Používateľ NEMÔŽE nahrať prílohu do cudzieho chat priečinka', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const otherFileRef = userStorage.ref('chat/otherUser/hacked.jpg');

    await assertFails(otherFileRef.put(Buffer.from('hacked-data')));
  });

  it('✅ Vlastník MÔŽE zmazať svoju prílohu', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const fileRef = userStorage.ref('chat/user123/myFile.jpg');

    // Najprv nahraj
    await assertSucceeds(fileRef.put(Buffer.from('my-file-data')));

    // Potom zmaž
    await assertSucceeds(fileRef.delete());
  });

  it('❌ Používateľ NEMÔŽE zmazať cudziu prílohu', async () => {
    const ownerStorage = testEnv.authenticatedContext('owner').storage();
    const hackerStorage = testEnv.authenticatedContext('hacker').storage();

    // Vlastník nahrá prílohu
    await assertSucceeds(ownerStorage.ref('chat/owner/file.jpg').put(Buffer.from('data')));

    // Hacker sa pokúsi zmazať
    const hackerFileRef = hackerStorage.ref('chat/owner/file.jpg');
    await assertFails(hackerFileRef.delete());
  });
});

// ============================================================================
// TESTY PRE HLASOVÉ SPRÁVY
// ============================================================================

describe('🎤 Hlasové správy', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať hlasové správy', async () => {
    const unauthedStorage = testEnv.unauthenticatedContext().storage();

    // Najprv nahraj hlasovú správu
    const authedStorage = testEnv.authenticatedContext('user123').storage();
    await authedStorage.ref('voice-messages/user123/voice.mp3').put(Buffer.from('audio-data'));

    // Pokús sa čítať bez prihlásenia
    const unauthedFileRef = unauthedStorage.ref('voice-messages/user123/voice.mp3');
    await assertFails(unauthedFileRef.getDownloadURL());
  });

  it('✅ Autentifikovaný používateľ MÔŽE čítať hlasové správy', async () => {
    const ownerStorage = testEnv.authenticatedContext('owner').storage();
    const otherStorage = testEnv.authenticatedContext('other').storage();

    // Vlastník nahrá hlasovú správu
    await assertSucceeds(ownerStorage.ref('voice-messages/owner/voice.mp3').put(Buffer.from('audio')));

    // Iný prihlásený používateľ môže čítať
    await assertSucceeds(otherStorage.ref('voice-messages/owner/voice.mp3').getDownloadURL());
  });

  it('✅ Vlastník MÔŽE nahrať hlasovú správu', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const fileRef = userStorage.ref('voice-messages/user123/myVoice.mp3');

    await assertSucceeds(fileRef.put(Buffer.from('my-audio-data')));
  });

  it('❌ Používateľ NEMÔŽE nahrať hlasovú správu do cudzieho priečinka', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const otherFileRef = userStorage.ref('voice-messages/otherUser/hacked.mp3');

    await assertFails(otherFileRef.put(Buffer.from('hacked-audio')));
  });
});

// ============================================================================
// TESTY PRE PROFILOVÉ FOTKY
// ============================================================================

describe('👤 Profilové fotky', () => {

  it('❌ Neautentifikovaný používateľ NEMÔŽE čítať profilové fotky', async () => {
    const unauthedStorage = testEnv.unauthenticatedContext().storage();

    // Najprv nahraj profilovú fotku
    const authedStorage = testEnv.authenticatedContext('user123').storage();
    await authedStorage.ref('profiles/user123/avatar.jpg').put(Buffer.from('avatar-data'));

    // Pokús sa čítať bez prihlásenia
    const unauthedFileRef = unauthedStorage.ref('profiles/user123/avatar.jpg');
    await assertFails(unauthedFileRef.getDownloadURL());
  });

  it('✅ Autentifikovaný používateľ MÔŽE čítať profilové fotky', async () => {
    const ownerStorage = testEnv.authenticatedContext('owner').storage();
    const otherStorage = testEnv.authenticatedContext('other').storage();

    // Vlastník nahrá profilovú fotku
    await assertSucceeds(ownerStorage.ref('profiles/owner/avatar.jpg').put(Buffer.from('avatar')));

    // Iný prihlásený používateľ môže čítať
    await assertSucceeds(otherStorage.ref('profiles/owner/avatar.jpg').getDownloadURL());
  });

  it('✅ Vlastník MÔŽE nahrať svoju profilovú fotku', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const fileRef = userStorage.ref('profiles/user123/myAvatar.jpg');

    await assertSucceeds(fileRef.put(Buffer.from('my-avatar-data')));
  });

  it('❌ Používateľ NEMÔŽE nahrať profilovú fotku pre iného používateľa', async () => {
    const userStorage = testEnv.authenticatedContext('user123').storage();
    const otherFileRef = userStorage.ref('profiles/otherUser/hacked.jpg');

    await assertFails(otherFileRef.put(Buffer.from('hacked-avatar')));
  });
});

console.log('\n✅ Všetky Storage rules testy dokončené!\n');

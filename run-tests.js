/**
 * Helper skript na spustenie Firebase rules testov
 * Automaticky spustí emulátory a potom testy
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

let emulatorProcess = null;

// Funkcia na spustenie emulátorov
async function startEmulators() {
  console.log('\n🔥 Spúšťam Firebase emulátory...\n');

  emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'firestore,storage'], {
    stdio: 'pipe',
    shell: true
  });

  return new Promise((resolve, reject) => {
    let output = '';

    emulatorProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);

      // Čakaj, kým emulátory naštartujú
      if (output.includes('All emulators ready')) {
        console.log('\n✅ Emulátory sú pripravené!\n');
        resolve();
      }
    });

    emulatorProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    emulatorProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout po 30 sekundách
    setTimeout(() => {
      if (!output.includes('All emulators ready')) {
        reject(new Error('Timeout: Emulátory sa nespustili do 30 sekúnd'));
      }
    }, 30000);
  });
}

// Funkcia na spustenie testov
async function runTests() {
  console.log('\n🧪 Spúšťam testy...\n');

  return new Promise((resolve, reject) => {
    const testProcess = spawn('npm', ['run', 'test:rules'], {
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Všetky testy prešli!\n');
        resolve();
      } else {
        console.log(`\n❌ Testy zlyhali s kódom ${code}\n`);
        reject(new Error(`Tests failed with code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Funkcia na zastavenie emulátorov
function stopEmulators() {
  console.log('\n🛑 Zastavujem emulátory...\n');
  if (emulatorProcess) {
    emulatorProcess.kill('SIGTERM');
  }
}

// Hlavná funkcia
async function main() {
  try {
    // 1. Spusti emulátory
    await startEmulators();

    // 2. Počkaj chvíľu (safety buffer)
    await sleep(2000);

    // 3. Spusti testy
    await runTests();

    // 4. Zastav emulátory
    stopEmulators();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Chyba:', error.message, '\n');
    stopEmulators();
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Prerušené používateľom\n');
  stopEmulators();
  process.exit(0);
});

// Spusti
main();

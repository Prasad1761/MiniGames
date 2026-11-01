const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/pnaja/.gemini/antigravity/brain/f8b9f2ed-1959-46dd-a3c3-5a2376f1874c');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function runTests() {
  console.log('--- Starting Next.js Production Server ---');
  const nextBin = path.resolve(__dirname, '../node_modules/next/dist/bin/next');
  const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', '3000'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env },
  });

  try {
    await waitForServer('http://127.0.0.1:3000');
    console.log('✓ Server is responsive at http://127.0.0.1:3000');

    console.log('--- Launching Headless Edge Browser ---');
    const browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // 1. Mobile Viewport Test: Homepage
    console.log('--- Testing Mobile Homepage ---');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle2' });
    await sleep(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_mobile_homepage.png') });
    console.log('✓ Homepage captured');

    // 2. Test Game 1: Perfect Stack
    console.log('--- Testing Game 1: Perfect Stack ---');
    await page.goto('http://127.0.0.1:3000/games/perfect-stack', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(400);
    await page.tap('canvas');
    await sleep(500);
    await page.tap('canvas');
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_game_perfect_stack.png') });
    console.log('✓ Perfect Stack gameplay captured');

    // 3. Test Game 2: Reaction Test
    console.log('--- Testing Game 2: Reaction Test ---');
    await page.goto('http://127.0.0.1:3000/games/reaction-test', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(2400);
    await page.tap('canvas');
    await sleep(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_game_reaction_test.png') });
    console.log('✓ Reaction Test gameplay captured');

    // 4. Test Game 3: Gravity Flip
    console.log('--- Testing Game 3: Gravity Flip ---');
    await page.goto('http://127.0.0.1:3000/games/gravity-flip', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(800);
    await page.tap('canvas');
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_game_gravity_flip.png') });
    console.log('✓ Gravity Flip gameplay captured');

    // 5. Test Game 4: Color Panic
    console.log('--- Testing Game 4: Color Panic ---');
    await page.goto('http://127.0.0.1:3000/games/color-panic', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_game_color_panic.png') });
    console.log('✓ Color Panic gameplay captured');

    // 6. Test Game 5: One More Jump
    console.log('--- Testing Game 5: One More Jump ---');
    await page.goto('http://127.0.0.1:3000/games/one-more-jump', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_game_one_more_jump.png') });
    console.log('✓ One More Jump gameplay captured');

    // 7. Test Game 8: Perfect Timing
    console.log('--- Testing Game 8: Perfect Timing ---');
    await page.goto('http://127.0.0.1:3000/games/perfect-timing', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_game_perfect_timing.png') });
    console.log('✓ Perfect Timing gameplay captured');

    // 8. Test Game 9: Merge Rush
    console.log('--- Testing Game 9: Merge Rush ---');
    await page.goto('http://127.0.0.1:3000/games/merge-rush', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.tap('canvas');
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_game_merge_rush.png') });
    console.log('✓ Merge Rush gameplay captured');

    // 9. Daily Challenge & Leaderboard
    console.log('--- Testing Daily Challenge & Leaderboard ---');
    await page.goto('http://127.0.0.1:3000/daily', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_daily_challenge.png') });

    await page.goto('http://127.0.0.1:3000/leaderboards', { waitUntil: 'networkidle2' });
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_global_leaderboards.png') });
    console.log('✓ Daily & Leaderboards captured');

    await browser.close();
    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    console.log('Stopping server...');
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

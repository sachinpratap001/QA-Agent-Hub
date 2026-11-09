/**
 * tools/record-demo.js — Records a real demo video of the QA Agent Hub.
 * Flow: Chat UI → live BlueprintAgent request (Ollama) → Dashboard → defect report.
 * Output: dashboard/demo/demo.webm (shown in the dashboard "Demo Recording" section).
 * Usage: (server running on :3000)  node tools/record-demo.js
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../tests/node_modules/playwright'));

const BASE = process.env.APP_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '../dashboard/demo');
const PROMPT = 'Generate 3 test cases (positive, negative, boundary) for adding an item to the cart';

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } }
  });
  const page = await context.newPage();
  const pause = (ms) => page.waitForTimeout(ms);

  // 1. Chat UI
  console.log('[demo] Chat UI');
  await page.goto(BASE + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await pause(2500);

  // 2. Live agent request
  console.log('[demo] Sending prompt to BlueprintAgent (llama3.2)...');
  await page.fill('#chat-textarea', '');
  await page.type('#chat-textarea', PROMPT, { delay: 25 });
  await pause(800);
  await page.click('#send-btn');
  const t0 = Date.now();
  await page.waitForResponse(r => r.url().includes('/api/chat') && r.request().method() === 'POST', { timeout: 180000 });
  console.log(`[demo] Agent responded in ${Math.round((Date.now() - t0) / 1000)}s`);
  await pause(1500);
  await page.evaluate(() => { const c = document.getElementById('chat-messages-container') || document.getElementById('chat-messages'); if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' }); });
  await pause(4000);

  // 3. Dashboard walkthrough
  console.log('[demo] Dashboard');
  await page.goto(BASE + '/dashboard');
  await pause(3500);
  for (let y = 400; y <= 2400; y += 400) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'smooth' }), y);
    await pause(1500);
  }

  // 4. Defect report
  console.log('[demo] Defect report');
  await page.goto(BASE + '/defects/DEF-001.md');
  await pause(3000);
  await page.goto(BASE + '/dashboard');
  await pause(2000);

  const video = page.video();
  await context.close();
  await browser.close();

  const final = path.join(OUT_DIR, 'demo.webm');
  if (fs.existsSync(final)) fs.unlinkSync(final);
  fs.renameSync(await video.path(), final);
  console.log('[demo] Saved', final);
})().catch((e) => { console.error('[demo] FAILED:', e.message); process.exit(1); });

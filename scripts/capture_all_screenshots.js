import puppeteer from 'puppeteer-core';
import path from 'path';

const OUT_DIR = 'docs/screenshots';
const TICKET_ID = '1add01c3-a208-4497-b8aa-a77b6df74652';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });

  // 1. Log in via Keycloak
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost/login', { waitUntil: 'networkidle2' });

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('SSO')) {
      await b.click();
      break;
    }
  }

  await page.waitForSelector('#username', { timeout: 10000 });
  await page.type('#username', 'manager@haui.vn');
  await page.type('#password', 'manager123');
  await page.click('#kc-login');

  await page.waitForFunction(() => window.location.pathname === '/', { timeout: 15000 });
  console.log('Successfully logged in as Manager!');

  // Helper to set theme
  async function setTheme(theme) {
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      localStorage.setItem('dxfsm-theme', t);
    }, theme);
    await new Promise(r => setTimeout(r, 600));
  }

  // Helper to set viewport
  async function setMode(mode) {
    if (mode === 'desktop') {
      await page.setViewport({ width: 1280, height: 800, isMobile: false });
    } else {
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    }
    await new Promise(r => setTimeout(r, 600));
  }

  // ─── 1. Dashboard Screenshots ───
  console.log('Capturing Dashboard...');
  await page.goto('http://localhost/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500)); // wait for charts / metric cards

  // Dashboard Light Desktop
  await setMode('desktop');
  await setTheme('light');
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-light-desktop.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ dashboard-light-desktop.jpg');

  // Dashboard Dark Desktop
  await setTheme('dark');
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-dark-desktop.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ dashboard-dark-desktop.jpg');

  // Dashboard Light Mobile
  await setMode('mobile');
  await setTheme('light');
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard-light-mobile.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ dashboard-light-mobile.jpg');

  // ─── 2. Tickets List Screenshots ───
  console.log('Capturing Tickets...');
  await setMode('desktop');
  await page.goto('http://localhost/tickets', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // Tickets Light Desktop
  await setTheme('light');
  await page.screenshot({ path: path.join(OUT_DIR, 'tickets-light-desktop.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ tickets-light-desktop.jpg');

  // Tickets Dark Desktop
  await setTheme('dark');
  await page.screenshot({ path: path.join(OUT_DIR, 'tickets-dark-desktop.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ tickets-dark-desktop.jpg');

  // Tickets Light Mobile
  await setMode('mobile');
  await setTheme('light');
  await page.screenshot({ path: path.join(OUT_DIR, 'tickets-light-mobile.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ tickets-light-mobile.jpg');

  // ─── 3. Ticket Detail Screenshots ───
  console.log('Capturing Ticket Detail...');
  await setMode('desktop');
  await page.goto(`http://localhost/tickets/${TICKET_ID}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // Ticket Detail Light Desktop
  await setTheme('light');
  await page.screenshot({ path: path.join(OUT_DIR, 'ticket-detail-light-desktop.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ ticket-detail-light-desktop.jpg');

  // Ticket Detail Dark Desktop
  await setTheme('dark');
  await page.screenshot({ path: path.join(OUT_DIR, 'ticket-detail-dark-desktop.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ ticket-detail-dark-desktop.jpg');

  // Ticket Detail Light Mobile
  await setMode('mobile');
  await setTheme('light');
  await page.screenshot({ path: path.join(OUT_DIR, 'ticket-detail-light-mobile.jpg'), type: 'jpeg', quality: 90 });
  console.log('✓ ticket-detail-light-mobile.jpg');

  await browser.close();
  console.log('\nAll 9 screenshots captured successfully!');
}

main().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

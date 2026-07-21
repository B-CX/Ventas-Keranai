const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => {
    if (request.url().includes('keranai')) {
      console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
    }
  });

  try {
    console.log("Navegando al login...");
    await page.goto('https://productos.keranai.com/login', { waitUntil: 'networkidle2' });
    
    // Login
    console.log("Llenando credenciales...");
    await page.type('input[type="email"]', 'vendedor@keranai.com'); // We'll try the known vendedor email
    await page.type('input[type="password"]', 'vendedor123'); // Assuming standard password, if it fails it fails.
    
    await page.click('button[type="submit"]');
    
    console.log("Esperando navegacion...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => console.log("Timeout navegacion login"));
    
    console.log("Yendo a clientes...");
    await page.goto('https://productos.keranai.com/admin/clientes', { waitUntil: 'networkidle2' });
    
    // wait a bit to see if error pops up
    await new Promise(r => setTimeout(r, 3000));
    
    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot guardado");

  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await browser.close();
  }
})();

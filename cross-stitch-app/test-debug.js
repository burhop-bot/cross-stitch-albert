const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1217/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    headless: true,
  });
  
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  await page.goto('http://localhost:5557/', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait a bit for React to render
  await page.waitForTimeout(5000);
  
  // Check if header exists
  const headerCount = await page.locator('header').count();
  console.log('Header count:', headerCount);
  
  // Get the page content
  const body = await page.content();
  console.log('Body length:', body.length);
  console.log('Body snippet:', body.substring(0, 500));
  
  // Get the page title
  console.log('Page title:', await page.title());
  
  // Check if there's a #root element
  const rootExists = await page.locator('#root').count();
  console.log('#root exists:', rootExists);
  
  // Check for any error messages in the page
  const errorText = await page.locator('[class*="error"], [class*="Error"]').first().textContent().catch(() => 'none');
  console.log('Error text:', errorText);
  
  await browser.close();
})();

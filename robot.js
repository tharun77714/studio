const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://google.com');
  await page.type('textarea[name="q"]', 'hi', {delay: 200});
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();

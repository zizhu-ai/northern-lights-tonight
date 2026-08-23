const { chromium } = require(
  "/Users/zizhu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright"
);

const [url, path] = process.argv.slice(2);
const executablePath =
  "/Users/zizhu/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ["--single-process", "--no-zygote", "--disable-crashpad"],
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.screenshot({ path });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
})();

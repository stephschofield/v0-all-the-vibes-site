import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const OUTPUT_DIR = './public/screenshots';

async function captureUI() {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log('📸 Capturing All The Vibes Community UI (~8 seconds)...\n');

  // Navigate to the main page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('✓ Page loaded');
  
  // Click on tabs by position (tabs are at top, around y=70-80)
  // Tab 1 is around x=350, Tab 2 around x=500, Tab 3 around x=650
  
  await page.mouse.click(500, 75);  // Second tab
  await page.waitForTimeout(1500);
  console.log('✓ Clicked tab 2');
  
  await page.mouse.click(650, 75);  // Third tab
  await page.waitForTimeout(1500);
  console.log('✓ Clicked tab 3');
  
  await page.mouse.click(350, 75);  // First tab
  await page.waitForTimeout(1500);
  console.log('✓ Clicked tab 1');
  
  // Brief final view
  await page.waitForTimeout(1000);

  console.log('\n📹 Saving video recording...');

  await page.close();
  await context.close();
  await browser.close();

  console.log('\n✅ UI capture complete!');
}

captureUI().catch(console.error);

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const OUTPUT_DIR = './public/screenshots';

async function captureUI() {
  // Ensure output directory exists
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

  console.log('📸 Capturing All The Vibes Community UI...\n');

  // Navigate to the main page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Screenshot 1: Full IDE view
  await page.screenshot({ 
    path: `${OUTPUT_DIR}/01-ide-overview.png`,
    fullPage: false 
  });
  console.log('✓ Captured IDE overview');

  // Interact with sidebar items
  const sidebarItems = await page.locator('[class*="sidebar"] button, [class*="Sidebar"] button, [role="tab"]').all();
  if (sidebarItems.length > 0) {
    await sidebarItems[0].click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // Screenshot 2: After sidebar interaction
  await page.screenshot({ 
    path: `${OUTPUT_DIR}/02-sidebar-interaction.png`,
    fullPage: false 
  });
  console.log('✓ Captured sidebar interaction');

  // Try clicking different tabs
  const tabs = await page.locator('[role="tab"], [class*="tab"]').all();
  for (let i = 0; i < Math.min(tabs.length, 3); i++) {
    await tabs[i].click().catch(() => {});
    await page.waitForTimeout(300);
  }

  // Screenshot 3: Tab switching
  await page.screenshot({ 
    path: `${OUTPUT_DIR}/03-tabs-view.png`,
    fullPage: false 
  });
  console.log('✓ Captured tab switching');

  // Navigate to topics page
  await page.goto('http://localhost:3000/topics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot 4: Topics page
  await page.screenshot({ 
    path: `${OUTPUT_DIR}/04-topics-page.png`,
    fullPage: false 
  });
  console.log('✓ Captured topics page');

  // Go back and interact more for the video
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Scroll and interact for video content
  await page.mouse.move(500, 300);
  await page.waitForTimeout(500);
  await page.mouse.move(800, 400);
  await page.waitForTimeout(500);
  
  // Click around
  await page.mouse.click(200, 300);
  await page.waitForTimeout(500);
  await page.mouse.click(400, 500);
  await page.waitForTimeout(1000);

  console.log('\n📹 Saving video recording...');

  // Close to save video
  await page.close();
  await context.close();
  await browser.close();

  console.log('\n✅ UI capture complete!');
  console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}/`);
  console.log('🎬 Video saved to same directory as .webm file');
  console.log('\n💡 Convert to GIF with: ffmpeg -i video.webm -vf "fps=10,scale=960:-1" output.gif');
}

captureUI().catch(console.error);

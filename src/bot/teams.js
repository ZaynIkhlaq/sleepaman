const SELECTORS = {
  continueOnBrowser: 'button:has-text("Continue on this browser")',
  joinOnWeb: 'a:has-text("Join on the web instead")',
  nameInput: 'input[placeholder*="name"], input[data-tid="prejoin-display-name-input"]',
  micToggle: '[data-tid="toggle-mute"], button[aria-label*="microphone"], button[aria-label*="Mic"]',
  cameraToggle: '[data-tid="toggle-video"], button[aria-label*="camera"], button[aria-label*="Camera"]',
  joinNow: 'button:has-text("Join now"), button[data-tid="prejoin-join-button"]',
};

async function tryClick(page, selector, timeout = 3000) {
  try {
    await page.click(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function joinTeams(page, url, displayName = 'Student') {
  // Force web client
  const meetUrl = new URL(url);
  meetUrl.searchParams.set('msLaunch', 'false');
  meetUrl.searchParams.set('type', 'meetup-join');
  meetUrl.searchParams.set('directDl', 'true');
  meetUrl.searchParams.set('suppressPrompt', 'true');

  await page.goto(meetUrl.toString(), { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Click "Continue on this browser" or "Join on the web"
  const clicked = await tryClick(page, SELECTORS.continueOnBrowser, 8000);
  if (!clicked) {
    await tryClick(page, SELECTORS.joinOnWeb, 5000);
  }

  await page.waitForTimeout(3000);

  // Enter display name if field is visible
  try {
    const nameInput = page.locator(SELECTORS.nameInput).first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(displayName);
    }
  } catch {}

  // Toggle camera and mic off
  await tryClick(page, SELECTORS.cameraToggle, 3000);
  await tryClick(page, SELECTORS.micToggle, 3000);

  // Join
  await tryClick(page, SELECTORS.joinNow, 8000);

  await page.waitForTimeout(2000);
  console.log('  ✓ Joined Microsoft Teams');
}

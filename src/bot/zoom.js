const SELECTORS = {
  nameInput: '#inputname, input[type="text"]',
  joinButton: '#joinBtn, button:has-text("Join"), button.submit-button',
  passcodeInput: '#inputpasscode, input[type="password"]',
  muteBtn: 'button[aria-label*="mute" i], button[aria-label*="Mute" i]',
  stopVideoBtn: 'button[aria-label*="stop" i][aria-label*="video" i], button[aria-label*="Stop Video"]',
  agreeBtn: 'button:has-text("I Agree"), #wc_agree1',
};

async function tryClick(page, selector, timeout = 3000) {
  try {
    await page.click(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function joinZoom(page, url, displayName = 'Student') {
  // Force web client
  const webUrl = url.replace(/\/j\//, '/wc/join/');

  await page.goto(webUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Accept terms if shown
  await tryClick(page, SELECTORS.agreeBtn, 3000);
  await page.waitForTimeout(1000);

  // Enter display name
  try {
    const nameInput = page.locator(SELECTORS.nameInput).first();
    if (await nameInput.isVisible({ timeout: 5000 })) {
      await nameInput.clear();
      await nameInput.fill(displayName);
    }
  } catch {}

  // Click Join
  await tryClick(page, SELECTORS.joinButton, 5000);
  await page.waitForTimeout(4000);

  // Mute mic and stop video once in meeting
  await tryClick(page, SELECTORS.muteBtn, 5000);
  await tryClick(page, SELECTORS.stopVideoBtn, 5000);

  await page.waitForTimeout(2000);
  console.log('  ✓ Joined Zoom');
}

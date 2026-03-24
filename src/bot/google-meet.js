const SELECTORS = {
  gotIt: 'button:has-text("Got it")',
  micOff: '[aria-label*="Turn off microphone"]',
  cameraOff: '[aria-label*="Turn off camera"]',
  joinNow: 'button:has-text("Join now")',
  askToJoin: 'button:has-text("Ask to join")',
  meetingEnded: 'text="You left the meeting"',
  dismissed: 'button:has-text("Dismiss")',
};

async function tryClick(page, selector, timeout = 3000) {
  try {
    await page.click(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function joinGoogleMeet(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Dismiss any popups
  await tryClick(page, SELECTORS.gotIt);
  await tryClick(page, SELECTORS.dismissed);

  // Turn off camera and mic
  await tryClick(page, SELECTORS.cameraOff, 5000);
  await tryClick(page, SELECTORS.micOff, 5000);

  // Join
  const joined = await tryClick(page, SELECTORS.joinNow, 5000);
  if (!joined) {
    await tryClick(page, SELECTORS.askToJoin, 5000);
  }

  await page.waitForTimeout(2000);
  console.log('  ✓ Joined Google Meet');
}

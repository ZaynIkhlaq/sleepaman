const EXCUSES = [
  "sory bad internet",
  "my net isnt working properly",
  "sorry sir, connection issues",
  "bad conection, cant hear properly",
  "sorrry my internet is lagging",
  "apologies, wifi is acting up",
  "sorry mam, my net keeps disconnecting",
  "having internet problms",
  "my connection is very slow today sory",
  "net issues, audio keeps cutting out",
  "sorry, internet not workng well",
  "facing network issues rn",
  "sry, bad wifi today",
  "my internet is really unstable rn",
  "sorry sir my connection droped for a bit",
  "can barely hear, net is bad",
  "aplogies, having wifi trouble",
  "internet went out for a sec, sory",
  "my network is fluctuating a lot",
  "sorry mam, facing connectivity issues",
];

const CHAT_SELECTORS = {
  'google-meet': {
    chatButton: 'button[aria-label*="Chat" i], button[aria-label*="chat with everyone" i]',
    chatInput: 'textarea[aria-label*="Send a message" i], div[contenteditable="true"][aria-label*="Send a message" i]',
    sendButton: 'button[aria-label="Send a message"], button[aria-label="Send"]',
  },
  'teams': {
    chatButton: 'button#chat-button, button[aria-label*="Chat" i], [data-tid="chat-button"]',
    chatInput: 'div[contenteditable="true"][aria-label*="Type a new message"], div[data-tid="ckeditor"]',
    sendButton: 'button[aria-label="Send"], button[data-tid="newMessageCommands-send"]',
  },
  'zoom': {
    chatButton: 'button[aria-label*="Chat" i], button.chat-button',
    chatInput: 'textarea.chat-box__chat-textarea, textarea[placeholder*="message" i]',
    sendButton: 'button.chat-box__send-btn, button[aria-label="Send"]',
  },
};

async function tryClick(page, selector, timeout = 3000) {
  try {
    await page.click(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function sendRandomMessage(page, platform) {
  const selectors = CHAT_SELECTORS[platform];
  if (!selectors) return false;

  const text = EXCUSES[Math.floor(Math.random() * EXCUSES.length)];

  try {
    // Open chat panel
    await tryClick(page, selectors.chatButton, 5000);
    await page.waitForTimeout(1500);

    // Find and fill the input
    const input = page.locator(selectors.chatInput).first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.click();

    // Type character by character for contenteditable fields (Teams)
    if (platform === 'teams') {
      await input.pressSequentially(text, { delay: 50 });
    } else {
      await input.fill(text);
    }

    await page.waitForTimeout(500);

    // Try send button, fall back to Enter
    const sent = await tryClick(page, selectors.sendButton, 2000);
    if (!sent) {
      await input.press('Enter');
    }

    console.log(`  💬 Sent: "${text}"`);
    return true;
  } catch (err) {
    console.error(`  Failed to send chat message: ${err.message}`);
    return false;
  }
}

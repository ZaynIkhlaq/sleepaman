import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, '..', '..', 'data', 'browser-profiles');

const CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--disable-notifications',
  '--disable-infobars',
  '--window-size=1280,720',
];

export async function launchBrowser(platform) {
  const userDataDir = path.join(PROFILES_DIR, platform);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: CHROME_ARGS,
    viewport: { width: 1280, height: 720 },
    permissions: ['microphone', 'camera'],
    ignoreDefaultArgs: ['--mute-audio'],
  });

  return context;
}

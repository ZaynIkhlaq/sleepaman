# sleepaman

Auto-attend your online classes. Joins Google Meet, Teams, and Zoom meetings on your behalf with camera/mic off — so you can sleep in.

## How it works

1. You add meeting links with start/end times
2. Bot opens a real browser (Playwright) using your saved login sessions
3. Joins each meeting 5 minutes after start time (to look natural)
4. Sits there with camera and mic off
5. Leaves when the meeting ends

No credentials stored. No cloud. Runs entirely on your machine using your local browser sessions.

## Setup

```bash
# Clone the repo
git clone https://github.com/your-username/amansleep.git
cd amansleep

# Install dependencies
npm install

# Install the browser (one-time)
npx playwright install chromium
```

## Usage

```bash
npm start
```

This opens an interactive menu:

```
  ╔═══════════════════════════╗
  ║  😴 amansleep              ║
  ║  auto-attend your classes  ║
  ╚═══════════════════════════╝

? What do you want to do?
  ➕  Add a meeting
  📋  View meetings
  🗑️   Remove a meeting
  🚀  Start bot
  🔧  Setup & verify logins
  🧹  Clear all meetings
  👋  Exit
```

### First time? Run setup first

Select **Setup & verify logins**. This opens a browser for each platform (Google, Teams, Zoom) so you can log in once. Your sessions are saved locally — the bot reuses them on future runs, no repeated logins or 2FA prompts.

### Add a meeting

Select **Add a meeting**, paste the link, and enter start/end times:

```
? Paste the meeting link: https://meet.google.com/abc-defg-hij
  ✓ Detected: Google Meet
? Start time (HH:MM, 24hr): 09:00
? End time (HH:MM, 24hr): 10:00

  ✓ Meeting #1 added
    Will join at 09:05 AM (5 min after start)
```

For Teams and Zoom meetings, it'll also ask for a display name.

### Start the bot

Select **Start bot** and leave it running. It handles the rest:

```
📅 Today's Schedule:

  Google Meet     09:00 - 10:00  → joining in 23 min
  Microsoft Teams 11:00 - 12:00  → joining in 143 min

Bot is running. Press Ctrl+C to stop.
```

## Supported platforms

| Platform | How it joins |
|----------|-------------|
| Google Meet | Opens link → turns off mic/camera → clicks "Join now" |
| Microsoft Teams | Forces web client → clicks "Continue on this browser" → enters name → joins |
| Zoom | Rewrites URL to web client → enters name → joins → mutes mic/camera |

## Requirements

- Node.js 18+
- npm
- A display (the browser runs in headed mode — can't be fully headless since meeting platforms detect that)

## Notes

- The bot joins **5 minutes late** to look natural
- Meetings are stored in `meetings.json` (local, gitignored)
- Browser sessions are saved in `data/browser-profiles/` (local, gitignored)
- Camera and mic are faked via Chrome flags — no real audio/video is sent
- A mouse-move keepalive runs every 30s to prevent idle kicks



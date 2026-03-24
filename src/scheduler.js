import chalk from 'chalk';
import { loadMeetings } from './store.js';
import { parseTime, formatTime, msUntil, platformLabel } from './utils.js';
import { launchBrowser } from './bot/browser.js';
import { joinGoogleMeet } from './bot/google-meet.js';
import { joinTeams } from './bot/teams.js';
import { joinZoom } from './bot/zoom.js';

const JOIN_DELAY_MS = 5 * 60 * 1000; // 5 minutes late

const activeBots = new Map();

async function joinMeeting(meeting) {
  let context;
  try {
    console.log(chalk.cyan(`\n→ Joining ${platformLabel(meeting.platform)} meeting...`));
    console.log(chalk.dim(`  URL: ${meeting.url}`));

    context = await launchBrowser(meeting.platform);
    const page = context.pages()[0] || await context.newPage();

    switch (meeting.platform) {
      case 'google-meet':
        await joinGoogleMeet(page, meeting.url);
        break;
      case 'teams':
        await joinTeams(page, meeting.url, meeting.displayName);
        break;
      case 'zoom':
        await joinZoom(page, meeting.url, meeting.displayName);
        break;
    }

    // Keep alive with mouse movement
    const keepAlive = setInterval(async () => {
      try {
        await page.mouse.move(
          100 + Math.random() * 200,
          100 + Math.random() * 200
        );
      } catch {}
    }, 30000);

    // Schedule leave
    const endTime = parseTime(meeting.endTime);
    const leaveIn = msUntil(endTime);
    const leaveMs = Math.max(leaveIn, 0);

    console.log(chalk.green(`  ✓ In meeting. Will leave at ${formatTime(endTime)}`));

    setTimeout(async () => {
      clearInterval(keepAlive);
      try {
        await page.close();
        await context.close();
      } catch {}
      activeBots.delete(meeting.id);
      console.log(chalk.yellow(`\n← Left ${platformLabel(meeting.platform)} meeting`));

      // Check if all meetings are done
      if (activeBots.size === 0) {
        console.log(chalk.green('\n✓ All meetings done for today. Exiting.'));
        process.exit(0);
      }
    }, leaveMs);

    activeBots.set(meeting.id, { context, page, keepAlive });

  } catch (err) {
    console.log(chalk.red(`\n✗ Failed to join: ${err.message}`));
    if (context) {
      try { await context.close(); } catch {}
    }
  }
}

export function startScheduler() {
  const meetings = loadMeetings();

  if (meetings.length === 0) {
    console.log(chalk.yellow('No meetings scheduled. Add one first.'));
    process.exit(0);
  }

  console.log(chalk.bold('\n📅 Today\'s Schedule:\n'));

  let allPast = true;

  for (const meeting of meetings) {
    const startTime = parseTime(meeting.startTime);
    const joinTime = new Date(startTime.getTime() + JOIN_DELAY_MS);
    const endTime = parseTime(meeting.endTime);
    const joinIn = msUntil(joinTime);

    const timeStr = `${meeting.startTime} - ${meeting.endTime}`;
    const platform = platformLabel(meeting.platform);

    if (joinIn <= 0 && msUntil(endTime) <= 0) {
      console.log(chalk.dim(`  ${platform}  ${timeStr}  (already ended)`));
      continue;
    }

    allPast = false;

    if (joinIn <= 0) {
      // Should have already started, join now
      console.log(chalk.cyan(`  ${platform}  ${timeStr}  → joining now!`));
      joinMeeting(meeting);
    } else {
      const minsUntil = Math.round(joinIn / 60000);
      console.log(chalk.white(`  ${platform}  ${timeStr}  → joining in ${minsUntil} min`));
      setTimeout(() => joinMeeting(meeting), joinIn);
    }
  }

  if (allPast) {
    console.log(chalk.yellow('\nAll meetings have already ended.'));
    process.exit(0);
  }

  console.log(chalk.dim('\nBot is running. Press Ctrl+C to stop.\n'));
}

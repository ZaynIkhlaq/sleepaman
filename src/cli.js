#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { loadMeetings, addMeeting, removeMeeting, clearMeetings } from './store.js';
import { detectPlatform, platformLabel, parseTime, formatTime } from './utils.js';
import { launchBrowser } from './bot/browser.js';
import { startScheduler } from './scheduler.js';

const BANNER = `
${chalk.bold.cyan('  ╔═══════════════════════════╗')}
${chalk.bold.cyan('  ║')}  ${chalk.bold('😴 amansleep')}              ${chalk.bold.cyan('║')}
${chalk.bold.cyan('  ║')}  ${chalk.dim('auto-attend your classes')}  ${chalk.bold.cyan('║')}
${chalk.bold.cyan('  ╚═══════════════════════════╝')}
`;

async function mainMenu() {
  console.log(BANNER);

  const meetings = loadMeetings();
  if (meetings.length > 0) {
    console.log(chalk.dim(`  ${meetings.length} meeting(s) scheduled\n`));
  }

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What do you want to do?',
    choices: [
      { name: '➕  Add a meeting', value: 'add' },
      { name: '📋  View meetings', value: 'list' },
      { name: '🗑️   Remove a meeting', value: 'remove' },
      { name: '🚀  Start bot', value: 'start' },
      { name: '🔧  Setup & verify logins', value: 'setup' },
      { name: '🧹  Clear all meetings', value: 'clear' },
      new inquirer.Separator(),
      { name: '👋  Exit', value: 'exit' },
    ],
  }]);

  switch (action) {
    case 'add': await handleAdd(); break;
    case 'list': handleList(); break;
    case 'remove': await handleRemove(); break;
    case 'start': handleStart(); return; // don't loop back
    case 'setup': await handleSetup(); break;
    case 'clear': await handleClear(); break;
    case 'exit': process.exit(0);
  }

  // Loop back to menu
  await mainMenu();
}

async function handleAdd() {
  const { url } = await inquirer.prompt([{
    type: 'input',
    name: 'url',
    message: 'Paste the meeting link:',
    validate: (input) => {
      const platform = detectPlatform(input);
      if (!platform) return 'Not a valid Google Meet, Teams, or Zoom link';
      return true;
    },
  }]);

  const platform = detectPlatform(url);
  console.log(chalk.green(`  ✓ Detected: ${platformLabel(platform)}`));

  const { startTime } = await inquirer.prompt([{
    type: 'input',
    name: 'startTime',
    message: 'Start time (HH:MM, 24hr):',
    validate: (input) => /^\d{1,2}:\d{2}$/.test(input) || 'Use format like 09:00 or 14:30',
  }]);

  const { endTime } = await inquirer.prompt([{
    type: 'input',
    name: 'endTime',
    message: 'End time (HH:MM, 24hr):',
    validate: (input) => /^\d{1,2}:\d{2}$/.test(input) || 'Use format like 10:00 or 15:30',
  }]);

  let displayName = 'Student';
  if (platform === 'teams' || platform === 'zoom') {
    const { name } = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Display name (shown in meeting):',
      default: 'Student',
    }]);
    displayName = name;
  }

  const entry = addMeeting({ url, platform, startTime, endTime, displayName });

  const joinTime = new Date(parseTime(startTime).getTime() + 5 * 60000);
  console.log(chalk.green(`\n  ✓ Meeting #${entry.id} added`));
  console.log(chalk.dim(`    Will join at ${formatTime(joinTime)} (5 min after start)\n`));
}

function handleList() {
  const meetings = loadMeetings();
  if (meetings.length === 0) {
    console.log(chalk.yellow('\n  No meetings scheduled.\n'));
    return;
  }

  console.log(chalk.bold('\n  Your meetings:\n'));
  for (const m of meetings) {
    const platform = platformLabel(m.platform).padEnd(16);
    console.log(`  ${chalk.dim(`#${m.id}`)}  ${chalk.cyan(platform)}  ${m.startTime} - ${m.endTime}`);
    console.log(chalk.dim(`      ${m.url}\n`));
  }
}

async function handleRemove() {
  const meetings = loadMeetings();
  if (meetings.length === 0) {
    console.log(chalk.yellow('\n  No meetings to remove.\n'));
    return;
  }

  const { id } = await inquirer.prompt([{
    type: 'list',
    name: 'id',
    message: 'Which meeting to remove?',
    choices: meetings.map(m => ({
      name: `#${m.id}  ${platformLabel(m.platform)}  ${m.startTime} - ${m.endTime}`,
      value: m.id,
    })),
  }]);

  removeMeeting(id);
  console.log(chalk.green(`\n  ✓ Meeting #${id} removed.\n`));
}

async function handleSetup() {
  console.log(chalk.bold('\n  🔧 Login Verification\n'));
  console.log(chalk.dim('  This will open a browser for each platform so you can'));
  console.log(chalk.dim('  verify you\'re logged in. Just close the browser when done.\n'));

  const { platforms } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'platforms',
    message: 'Which platforms to verify?',
    choices: [
      { name: 'Google Meet', value: 'google-meet', checked: true },
      { name: 'Microsoft Teams', value: 'teams', checked: true },
      { name: 'Zoom', value: 'zoom', checked: true },
    ],
  }]);

  const loginUrls = {
    'google-meet': 'https://accounts.google.com',
    'teams': 'https://teams.microsoft.com',
    'zoom': 'https://zoom.us/signin',
  };

  for (const platform of platforms) {
    const spinner = ora(`Opening ${platformLabel(platform)}...`).start();

    try {
      const context = await launchBrowser(platform);
      const page = context.pages()[0] || await context.newPage();
      await page.goto(loginUrls[platform], { waitUntil: 'networkidle', timeout: 30000 });

      spinner.succeed(`${platformLabel(platform)} browser opened`);
      console.log(chalk.dim('    → Log in if needed, then close the browser window.\n'));

      // Wait for user to close browser
      await new Promise((resolve) => {
        context.on('close', resolve);
        // Also handle if they close the last page
        page.on('close', async () => {
          try { await context.close(); } catch {}
          resolve();
        });
      });

      console.log(chalk.green(`  ✓ ${platformLabel(platform)} session saved.\n`));
    } catch (err) {
      spinner.fail(`${platformLabel(platform)} failed: ${err.message}`);
    }
  }

  console.log(chalk.green('  ✓ Setup complete! Your login sessions are saved.\n'));
  console.log(chalk.dim('    Next time the bot runs, it will use these sessions.\n'));
}

async function handleClear() {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Remove all scheduled meetings?',
    default: false,
  }]);

  if (confirm) {
    clearMeetings();
    console.log(chalk.green('\n  ✓ All meetings cleared.\n'));
  }
}

function handleStart() {
  startScheduler();
}

// Entry
mainMenu().catch((err) => {
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});

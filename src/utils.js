export function detectPlatform(url) {
  if (url.includes('meet.google.com')) return 'google-meet';
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams';
  if (url.includes('zoom.us') || url.includes('zoom.com')) return 'zoom';
  return null;
}

export function platformLabel(platform) {
  const labels = {
    'google-meet': 'Google Meet',
    'teams': 'Microsoft Teams',
    'zoom': 'Zoom',
  };
  return labels[platform] || platform;
}

export function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  return target;
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function msUntil(date) {
  return date.getTime() - Date.now();
}

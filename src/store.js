import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, '..', 'meetings.json');

export function loadMeetings() {
  if (!fs.existsSync(STORE_PATH)) return [];
  const data = fs.readFileSync(STORE_PATH, 'utf-8');
  return JSON.parse(data);
}

export function saveMeetings(meetings) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(meetings, null, 2));
}

export function addMeeting(meeting) {
  const meetings = loadMeetings();
  const id = meetings.length > 0 ? Math.max(...meetings.map(m => m.id)) + 1 : 1;
  const entry = { id, ...meeting };
  meetings.push(entry);
  saveMeetings(meetings);
  return entry;
}

export function removeMeeting(id) {
  const meetings = loadMeetings();
  const filtered = meetings.filter(m => m.id !== id);
  if (filtered.length === meetings.length) return false;
  saveMeetings(filtered);
  return true;
}

export function clearMeetings() {
  saveMeetings([]);
}

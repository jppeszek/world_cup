import { formatInTimeZone } from 'date-fns-tz';

export function getUserTimeZone(): string {
  const tz = localStorage.getItem('userTimeZone');
  if (tz) return tz;

  // Detect from browser
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localStorage.setItem('userTimeZone', detectedTz);
  return detectedTz;
}

export function formatMatchTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const tz = getUserTimeZone();

    const formatted = formatInTimeZone(date, tz, 'MMM d, yyyy HH:mm zzz');
    return formatted;
  } catch (error) {
    return isoString;
  }
}

export function getTimeUntilKickoff(isoString: string): { hours: number; minutes: number } {
  const kickoff = new Date(isoString).getTime();
  const now = Date.now();
  const diff = Math.max(0, kickoff - now);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

export function formatTimeUntilKickoff(isoString: string): string {
  const { hours, minutes } = getTimeUntilKickoff(isoString);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return 'Locked';
}

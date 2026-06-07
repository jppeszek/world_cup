import { Match } from '../types/index.js';

export function isMatchLocked(match: Match, serverTime: Date = new Date()): boolean {
  // Match is locked if kickoff time has passed (server-side check)
  return new Date(match.kickoff_utc) <= serverTime;
}

export function getMatchStatus(match: Match, serverTime: Date = new Date()): 'open' | 'locked' | 'finished' {
  if (match.score_home !== null && match.score_away !== null) {
    return 'finished';
  }

  if (isMatchLocked(match, serverTime)) {
    return 'locked';
  }

  return 'open';
}

export function getTimeToKickoff(match: Match, serverTime: Date = new Date()): number {
  const kickoffTime = new Date(match.kickoff_utc).getTime();
  const currentTime = serverTime.getTime();
  return Math.max(0, kickoffTime - currentTime);
}

export function formatTimeToKickoff(match: Match, serverTime: Date = new Date()): string {
  const ms = getTimeToKickoff(match, serverTime);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

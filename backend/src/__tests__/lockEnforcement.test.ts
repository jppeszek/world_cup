import {
  isMatchLocked,
  getMatchStatus,
  getTimeToKickoff,
  formatTimeToKickoff,
} from '../utils/lockEnforcement';
import { Match } from '../types/index';

describe('Lock Enforcement', () => {
  const now = new Date('2026-06-11T14:00:00Z');
  const futureTime = new Date('2026-06-11T16:00:00Z'); // 2 hours in future
  const pastTime = new Date('2026-06-11T12:00:00Z'); // 2 hours in past

  const createMatch = (kickoffUtc: Date, scoreHome?: number, scoreAway?: number): Match => ({
    id: 1,
    external_ref: 'test',
    stage: 'group',
    group: 'A',
    team_home: 'Team A',
    team_away: 'Team B',
    kickoff_utc: kickoffUtc,
    venue: 'Stadium',
    status: 'open',
    score_home: scoreHome,
    score_away: scoreAway,
    result_imported_at: null,
    created_at: now,
    updated_at: now,
  });

  describe('isMatchLocked', () => {
    it('should return false for future matches', () => {
      const match = createMatch(futureTime);
      const isLocked = isMatchLocked(match, now);

      expect(isLocked).toBe(false);
    });

    it('should return true for past matches (after kickoff)', () => {
      const match = createMatch(pastTime);
      const isLocked = isMatchLocked(match, now);

      expect(isLocked).toBe(true);
    });

    it('should return true at exact kickoff time', () => {
      const match = createMatch(now);
      const isLocked = isMatchLocked(match, now);

      expect(isLocked).toBe(true);
    });

    it('should return false 1 second before kickoff', () => {
      const oneSecondBefore = new Date(now.getTime() - 1000);
      const match = createMatch(now);
      const isLocked = isMatchLocked(match, oneSecondBefore);

      expect(isLocked).toBe(false);
    });

    it('should return true 1 second after kickoff', () => {
      const oneSecondAfter = new Date(now.getTime() + 1000);
      const match = createMatch(now);
      const isLocked = isMatchLocked(match, oneSecondAfter);

      expect(isLocked).toBe(true);
    });
  });

  describe('getMatchStatus', () => {
    it('should return "open" for future matches without result', () => {
      const match = createMatch(futureTime);
      const status = getMatchStatus(match, now);

      expect(status).toBe('open');
    });

    it('should return "locked" for past matches without result', () => {
      const match = createMatch(pastTime);
      const status = getMatchStatus(match, now);

      expect(status).toBe('locked');
    });

    it('should return "finished" when match has final score', () => {
      const match = createMatch(pastTime, 2, 1);
      const status = getMatchStatus(match, now);

      expect(status).toBe('finished');
    });

    it('should return "finished" even for future time if score exists', () => {
      const match = createMatch(futureTime, 2, 1);
      const status = getMatchStatus(match, now);

      expect(status).toBe('finished');
    });
  });

  describe('getTimeToKickoff', () => {
    it('should return correct time in milliseconds for future match', () => {
      const match = createMatch(futureTime);
      const timeMs = getTimeToKickoff(match, now);

      // futureTime is 2 hours = 7200000 ms ahead
      expect(timeMs).toBeCloseTo(7200000, -3); // Allow 1 second variance
    });

    it('should return 0 for past match', () => {
      const match = createMatch(pastTime);
      const timeMs = getTimeToKickoff(match, now);

      expect(timeMs).toBe(0);
    });

    it('should return 0 at exact kickoff time', () => {
      const match = createMatch(now);
      const timeMs = getTimeToKickoff(match, now);

      expect(timeMs).toBe(0);
    });
  });

  describe('formatTimeToKickoff', () => {
    it('should format time for 2 hour future match', () => {
      const match = createMatch(futureTime);
      const formatted = formatTimeToKickoff(match, now);

      expect(formatted).toBe('2h 0m');
    });

    it('should format time with minutes for partial hour', () => {
      const minuteTime = new Date(now.getTime() + 90 * 60 * 1000); // 1.5 hours
      const match = createMatch(minuteTime);
      const formatted = formatTimeToKickoff(match, now);

      expect(formatted).toBe('1h 30m');
    });

    it('should format time in minutes only for < 1 hour', () => {
      const minuteTime = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes
      const match = createMatch(minuteTime);
      const formatted = formatTimeToKickoff(match, now);

      expect(formatted).toBe('45m');
    });

    it('should return "Locked" for past matches', () => {
      const match = createMatch(pastTime);
      const formatted = formatTimeToKickoff(match, now);

      expect(formatted).toBe('Locked');
    });

    it('should return "Locked" at exact kickoff', () => {
      const match = createMatch(now);
      const formatted = formatTimeToKickoff(match, now);

      expect(formatted).toBe('Locked');
    });
  });

  describe('Edge Cases', () => {
    it('should handle DST boundaries correctly', () => {
      // This is more of a sanity check - real DST testing would need more setup
      const dstTime = new Date('2026-03-29T01:00:00Z'); // DST boundary (approximate)
      const match = createMatch(dstTime);

      expect(isMatchLocked(match, new Date('2026-03-29T00:59:00Z'))).toBe(false);
      expect(isMatchLocked(match, new Date('2026-03-29T01:01:00Z'))).toBe(true);
    });

    it('should handle matches near UTC midnight', () => {
      const midnightMatch = new Date('2026-06-12T00:00:00Z');
      const beforeMidnight = new Date('2026-06-11T23:59:59Z');
      const afterMidnight = new Date('2026-06-12T00:00:01Z');

      const match = createMatch(midnightMatch);

      expect(isMatchLocked(match, beforeMidnight)).toBe(false);
      expect(isMatchLocked(match, afterMidnight)).toBe(true);
    });

    it('should be consistent across multiple calls', () => {
      const match = createMatch(futureTime);

      const status1 = getMatchStatus(match, now);
      const status2 = getMatchStatus(match, now);
      const status3 = getMatchStatus(match, now);

      expect(status1).toBe(status2);
      expect(status2).toBe(status3);
      expect(status1).toBe('open');
    });
  });
});

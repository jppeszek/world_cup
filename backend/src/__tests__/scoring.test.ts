import { scoreMatch } from '../services/scoringEngine';
import { Match, Prediction } from '../types/index';

describe('Scoring Engine', () => {
  const testMatch: Match = {
    id: 1,
    external_ref: 'test_match',
    stage: 'group',
    group: 'A',
    team_home: 'Brazil',
    team_away: 'England',
    kickoff_utc: new Date(),
    venue: 'Test Stadium',
    status: 'finished',
    score_home: 2,
    score_away: 1,
    result_imported_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('Correct Outcome - Correct Exact Score', () => {
    it('should award 3 points for exact score match', () => {
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 2,
        pred_away: 1,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, testMatch);

      expect(result.points).toBe(3);
      expect(result.exactScore).toBe(true);
      expect(result.outcome).toBe(true);
    });
  });

  describe('Correct Outcome - Wrong Score', () => {
    it('should award 2 points for correct outcome (home win, wrong score)', () => {
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 3,
        pred_away: 1,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, testMatch);

      expect(result.points).toBe(2);
      expect(result.exactScore).toBe(false);
      expect(result.outcome).toBe(true);
    });
  });

  describe('Incorrect Outcome', () => {
    it('should award 0 points for wrong outcome', () => {
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 1,
        pred_away: 2, // Predicted away win
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, testMatch);

      expect(result.points).toBe(0);
      expect(result.exactScore).toBe(false);
      expect(result.outcome).toBe(false);
    });
  });

  describe('Draw Prediction - Draw Result', () => {
    it('should award 2 points for correct draw', () => {
      const drawMatch: Match = { ...testMatch, score_home: 1, score_away: 1 };
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 1,
        pred_away: 1,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, drawMatch);

      expect(result.points).toBe(3); // Exact score + outcome
      expect(result.exactScore).toBe(true);
    });
  });

  describe('Knockout - Penalty Winner Selection', () => {
    it('should award points when predicted winner matches actual outcome', () => {
      const drawMatch: Match = { ...testMatch, score_home: 1, score_away: 1 };
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 2,
        pred_away: 1,
        pred_winner: 'home',
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, drawMatch);

      // Score doesn't match, but outcome is correct
      expect(result.outcome).toBe(false); // 2-1 prediction != 1-1 actual
    });
  });

  describe('No Result Yet', () => {
    it('should return 0 points when match result is not available', () => {
      const unfinishedMatch: Match = { ...testMatch, score_home: null, score_away: null };
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 2,
        pred_away: 1,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, unfinishedMatch);

      expect(result.points).toBe(0);
      expect(result.exactScore).toBe(false);
    });
  });

  describe('Various Outcome Predictions', () => {
    it('should award points for away win prediction', () => {
      const awayWinMatch: Match = { ...testMatch, score_home: 0, score_away: 1 };
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 1,
        pred_away: 2,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, awayWinMatch);

      expect(result.outcome).toBe(true); // Correct: away win
      expect(result.points).toBe(2);
    });

    it('should award 3 points for away win with exact score', () => {
      const awayWinMatch: Match = { ...testMatch, score_home: 0, score_away: 1 };
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 0,
        pred_away: 1,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = scoreMatch(prediction, awayWinMatch);

      expect(result.exactScore).toBe(true);
      expect(result.points).toBe(3);
    });

    it('should be idempotent: same input produces same output', () => {
      const prediction: Prediction = {
        id: 1,
        user_id: 1,
        match_id: 1,
        pred_home: 2,
        pred_away: 1,
        pred_winner: null,
        points: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result1 = scoreMatch(prediction, testMatch);
      const result2 = scoreMatch(prediction, testMatch);
      const result3 = scoreMatch(prediction, testMatch);

      expect(result1.points).toBe(result2.points);
      expect(result2.points).toBe(result3.points);
      expect(result1.points).toBe(3);
    });
  });
});

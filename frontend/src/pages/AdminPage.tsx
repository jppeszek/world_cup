import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { isPlayoffStage } from '../utils/stageUtils';

interface Invite {
  id: number;
  email: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

interface Match {
  id: number;
  team_home: string;
  team_away: string;
  kickoff_utc: string;
  stage: string;
  status: string;
  score_home?: number | null;
  score_away?: number | null;
}

export function AdminPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Score entry state
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [penaltyWinner, setPenaltyWinner] = useState<'home' | 'away' | ''>('');
  const [settingScore, setSettingScore] = useState(false);

  // Team edit state
  const [editingTeamsMatchId, setEditingTeamsMatchId] = useState<number | null>(null);
  const [editTeamHome, setEditTeamHome] = useState('');
  const [editTeamAway, setEditTeamAway] = useState('');

  // Kickoff edit state
  const [editingKickoffMatchId, setEditingKickoffMatchId] = useState<number | null>(null);
  const [editKickoffTime, setEditKickoffTime] = useState('');
  const [editingTeams, setEditingTeams] = useState(false);
  const [editingKickoff, setEditingKickoff] = useState(false);

  // Predictions view state
  const [selectedPredictionsMatchId, setSelectedPredictionsMatchId] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    loadInvites();
    loadMatches();
  }, []);

  const loadInvites = async () => {
    try {
      const response = await api.getInvites();
      setInvites(response.data.invites);
    } catch (err) {
      setError('Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const response = await api.getMatches();
      const allMatches: Match[] = [];

      // Response has {matches: {date: [matches]}} structure
      const matchesByDate = response.data.matches;
      if (matchesByDate && typeof matchesByDate === 'object') {
        Object.values(matchesByDate).forEach((dayMatches: any) => {
          if (Array.isArray(dayMatches)) {
            allMatches.push(...dayMatches);
          }
        });
      }

      setMatches(allMatches.sort((a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
      ));
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!inviteEmail) {
      setError('Email required');
      return;
    }

    try {
      await api.createInvite({ email: inviteEmail });
      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      await loadInvites();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create invite');
    }
  };

  const handleSetScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedMatchId || scoreHome === '' || scoreAway === '') {
      setError('Match and scores required');
      return;
    }

    setSettingScore(true);

    try {
      const scoreData: any = {
        score_home: parseInt(scoreHome),
        score_away: parseInt(scoreAway),
      };

      // Add penalty winner if match is a draw and one is selected
      if (parseInt(scoreHome) === parseInt(scoreAway) && penaltyWinner) {
        scoreData.penalty_winner = penaltyWinner;
      }

      const response = await api.setMatchScore(selectedMatchId, scoreData);
      setSuccess(`Score updated: ${scoreHome}-${scoreAway}${penaltyWinner ? ` (Penalty: ${penaltyWinner})` : ''}`);
      setSelectedMatchId(null);
      setScoreHome('');
      setScoreAway('');
      setPenaltyWinner('');
      await loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set score');
    } finally {
      setSettingScore(false);
    }
  };

  const handleClearScore = async () => {
    if (!selectedMatchId) {
      setError('Select a match first');
      return;
    }

    setSettingScore(true);
    setError('');
    setSuccess('');

    try {
      await api.setMatchScore(selectedMatchId, { clear: true });
      setSuccess('Score cleared');
      setSelectedMatchId(null);
      setScoreHome('');
      setScoreAway('');
      setPenaltyWinner('');
      await loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear score');
    } finally {
      setSettingScore(false);
    }
  };

  const handleImportResults = async () => {
    setError('');
    setSuccess('');
    setImporting(true);

    try {
      const response = await api.importResults();
      setSuccess(response.data.message || 'Results imported successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import results');
    } finally {
      setImporting(false);
    }
  };

  const handleSeedFixtures = async () => {
    setError('');
    setSuccess('');
    setSeeding(true);

    try {
      const response = await api.seedFixtures();
      setSuccess(response.data.message || 'Fixtures seeded successfully');
      await loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to seed fixtures');
    } finally {
      setSeeding(false);
    }
  };

  const handleEditTeams = (match: Match) => {
    setEditingTeamsMatchId(match.id);
    setEditTeamHome(match.team_home);
    setEditTeamAway(match.team_away);
  };

  const handleUpdateTeams = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingTeamsMatchId || !editTeamHome || !editTeamAway) {
      setError('Both team names required');
      return;
    }

    setEditingTeams(true);

    try {
      await api.updateMatchTeams(editingTeamsMatchId, {
        team_home: editTeamHome,
        team_away: editTeamAway,
      });
      setSuccess(`Teams updated: ${editTeamHome} vs ${editTeamAway}`);
      setEditingTeamsMatchId(null);
      setEditTeamHome('');
      setEditTeamAway('');
      await loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update teams');
    } finally {
      setEditingTeams(false);
    }
  };

  const handleUpdateKickoff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editingKickoffMatchId || !editKickoffTime) {
      setError('Kickoff time required');
      return;
    }

    setEditingKickoff(true);

    try {
      await api.updateMatchKickoff(editingKickoffMatchId, {
        kickoff_utc: editKickoffTime,
      });
      setSuccess(`Kickoff time updated`);
      setEditingKickoffMatchId(null);
      setEditKickoffTime('');
      await loadMatches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update kickoff time');
    } finally {
      setEditingKickoff(false);
    }
  };

  const loadPredictions = async (matchId: number) => {
    setLoadingPredictions(true);
    setError('');

    try {
      const response = await api.getMatchPredictions(matchId);
      setPredictions(response.predictions);
      setSelectedPredictionsMatchId(matchId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load predictions');
    } finally {
      setLoadingPredictions(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-lg">Loading admin page...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Invite Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Create Invite</h2>

          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Send Invite
            </button>
          </form>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Recent Invites</h3>

            {invites.length === 0 ? (
              <p className="text-gray-500 text-sm">No invites sent yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className={`p-3 rounded border ${
                      invite.status === 'accepted'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{invite.email}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          invite.status === 'accepted'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {invite.status === 'accepted' ? '✓ Accepted' : 'Pending'}
                      </span>
                    </div>
                    {invite.status === 'sent' && (
                      <div className="text-xs bg-white bg-opacity-50 p-2 rounded font-mono break-all">
                        Token: {invite.token}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Manual Score Entry */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Set Match Score</h2>

          <form onSubmit={handleSetScore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Match</label>
              <select
                value={selectedMatchId || ''}
                onChange={(e) => setSelectedMatchId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team_home} vs {match.team_away} ({new Date(match.kickoff_utc).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Home Score</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={scoreHome}
                  onChange={(e) => setScoreHome(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Away Score</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={scoreAway}
                  onChange={(e) => setScoreAway(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {scoreHome !== '' && scoreAway !== '' && parseInt(scoreHome) === parseInt(scoreAway) && selectedMatchId && isPlayoffStage(matches.find(m => m.id === selectedMatchId)?.stage || '') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Penalty Winner (Draw detected)</label>
                <select
                  value={penaltyWinner}
                  onChange={(e) => setPenaltyWinner(e.target.value as 'home' | 'away' | '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                >
                  <option value="">— Select penalty winner —</option>
                  <option value="home">Home (Penalties)</option>
                  <option value="away">Away (Penalties)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select which team won on penalties</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={settingScore}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition ${
                  settingScore
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {settingScore ? 'Saving...' : 'Set Score'}
              </button>
              <button
                type="button"
                disabled={settingScore || !selectedMatchId}
                onClick={handleClearScore}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition ${
                  settingScore || !selectedMatchId
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {settingScore ? 'Saving...' : 'Clear Score'}
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 mt-4">
            💡 Manually enter match results. Predictions will be auto-scored.
          </p>
        </div>

        {/* Edit Team Names */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Edit Match Teams</h2>

          <form onSubmit={handleUpdateTeams} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Match</label>
              <select
                value={editingTeamsMatchId || ''}
                onChange={(e) => {
                  const matchId = e.target.value ? parseInt(e.target.value) : null;
                  if (matchId) {
                    const match = matches.find(m => m.id === matchId);
                    if (match) {
                      handleEditTeams(match);
                    }
                  } else {
                    setEditingTeamsMatchId(null);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team_home} vs {match.team_away}
                  </option>
                ))}
              </select>
            </div>

            {editingTeamsMatchId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Home Team</label>
                  <input
                    type="text"
                    value={editTeamHome}
                    onChange={(e) => setEditTeamHome(e.target.value)}
                    placeholder="Team name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Away Team</label>
                  <input
                    type="text"
                    value={editTeamAway}
                    onChange={(e) => setEditTeamAway(e.target.value)}
                    placeholder="Team name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={editingTeams}
                  className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${
                    editingTeams
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {editingTeams ? 'Updating...' : 'Update Teams'}
                </button>
              </>
            )}
          </form>

          <p className="text-xs text-gray-500 mt-4">
            💡 Use this to rename knockout matches with actual team names (e.g., "Winner A" → "Argentina").
          </p>
        </div>

        {/* Edit Match Kickoff Time */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Edit Match Kickoff Time</h2>

          <form onSubmit={handleUpdateKickoff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Match</label>
              <select
                value={editingKickoffMatchId || ''}
                onChange={(e) => {
                  const matchId = e.target.value ? parseInt(e.target.value) : null;
                  if (matchId) {
                    const match = matches.find(m => m.id === matchId);
                    if (match) {
                      setEditingKickoffMatchId(matchId);
                      setEditKickoffTime(match.kickoff_utc);
                    }
                  } else {
                    setEditingKickoffMatchId(null);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a match...</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team_home} vs {match.team_away} ({new Date(match.kickoff_utc).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {editingKickoffMatchId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kickoff Time (UTC)</label>
                  <input
                    type="datetime-local"
                    value={editKickoffTime.slice(0, 16)}
                    onChange={(e) => setEditKickoffTime(e.target.value + ':00Z')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DDTHH:MM:SSZ</p>
                </div>

                <button
                  type="submit"
                  disabled={editingKickoff}
                  className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${
                    editingKickoff
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {editingKickoff ? 'Updating...' : 'Update Kickoff Time'}
                </button>
              </>
            )}
          </form>

          <p className="text-xs text-gray-500 mt-4">
            💡 Fix incorrect match times without affecting scores.
          </p>
        </div>

        {/* Results Import Section */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Result Import</h2>

          <p className="text-gray-600 text-sm mb-4">
            Import match results from API-Football and automatically calculate scores.
          </p>

          <button
            onClick={handleImportResults}
            disabled={importing}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
              importing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {importing ? 'Importing...' : 'Import Results'}
          </button>

          <div className="mt-4 border-t pt-4">
            <p className="text-gray-600 text-sm mb-2">
              Add missing fixtures to the database. Safe to run multiple times — existing matches are not affected.
            </p>
            <button
              onClick={handleSeedFixtures}
              disabled={seeding}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                seeding
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {seeding ? 'Seeding...' : 'Seed Missing Fixtures'}
            </button>
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h3>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Fetches latest match results from API-Football</li>
              <li>Updates finished matches with final scores</li>
              <li>Automatically calculates points for all predictions</li>
              <li>Updates leaderboard rankings</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            💡 This runs automatically every 5 minutes during the tournament via GitHub Actions.
            You can manually trigger it here anytime.
          </p>
        </div>

        {/* View Predictions for Finished Matches */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Predictions for Finished Matches</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select a finished match</label>
            <select
              value={selectedPredictionsMatchId || ''}
              onChange={(e) => {
                const matchId = e.target.value ? parseInt(e.target.value) : null;
                if (matchId) {
                  loadPredictions(matchId);
                } else {
                  setSelectedPredictionsMatchId(null);
                  setPredictions([]);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a match...</option>
              {matches
                .filter(m => m.status === 'finished')
                .map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.team_home} {match.score_home}-{match.score_away} {match.team_away}
                  </option>
                ))}
            </select>
          </div>

          {loadingPredictions && <p className="text-center text-gray-600">Loading predictions...</p>}

          {selectedPredictionsMatchId && !loadingPredictions && predictions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left px-4 py-2 font-semibold">User</th>
                    <th className="text-center px-4 py-2 font-semibold">Prediction</th>
                    <th className="text-center px-4 py-2 font-semibold">Actual Score</th>
                    <th className="text-center px-4 py-2 font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr key={pred.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{pred.nickname}</td>
                      <td className="text-center px-4 py-3">{pred.pred_home}-{pred.pred_away}</td>
                      <td className="text-center px-4 py-3 font-semibold">{pred.score_home}-{pred.score_away}</td>
                      <td className={`text-center px-4 py-3 font-bold ${
                        pred.points === 3 ? 'text-green-600' : pred.points === 1 ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {pred.points || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedPredictionsMatchId && !loadingPredictions && predictions.length === 0 && (
            <p className="text-center text-gray-500 py-4">No predictions for this match</p>
          )}

          <p className="text-xs text-gray-500 mt-4">
            💡 View all user predictions for finished matches. Points: 3 for exact score, 1 for correct outcome.
          </p>
        </div>
      </div>
    </div>
  );
}

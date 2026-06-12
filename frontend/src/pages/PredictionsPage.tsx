import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Prediction {
  id: number;
  nickname: string;
  pred_home: number;
  pred_away: number;
  score_home: number | null;
  score_away: number | null;
  points: number | null;
}

interface Match {
  id: number;
  team_home: string;
  team_away: string;
  kickoff_utc: string;
  status: string;
  score_home?: number | null;
  score_away?: number | null;
}

export function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setError('');
      const response = await api.getMatches({ status: 'finished' });
      console.log('Full response:', response);

      // API returns response.data.matches (axios wraps the response)
      const matchesObj = response.data?.matches || response.matches;
      let allMatches: Match[] = [];

      if (matchesObj && typeof matchesObj === 'object' && !Array.isArray(matchesObj)) {
        // Grouped by date
        allMatches = Object.values(matchesObj).flat();
        console.log('Finished matches found:', allMatches.length);
      } else if (Array.isArray(matchesObj)) {
        // Already an array
        allMatches = matchesObj;
      }

      setMatches(allMatches);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setError('Failed to load matches');
      setLoading(false);
    }
  };

  const loadPredictions = async (matchId: number) => {
    setLoadingPredictions(true);
    setError('');

    try {
      const response = await api.getMatchPredictions(matchId);
      console.log('Predictions:', response.predictions);
      setPredictions(response.predictions || []);
      setSelectedMatchId(matchId);
    } catch (error) {
      console.error('Failed to load predictions:', error);
      setError('Failed to load predictions');
    } finally {
      setLoadingPredictions(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-lg">Loading...</p>
      </div>
    );
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-blue-900 mb-8">Predictions by Match</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No finished matches yet</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Matches list */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Finished Matches</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matches.map((match) => (
                    <button
                      key={match.id}
                      onClick={() => loadPredictions(match.id)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedMatchId === match.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-semibold">
                        {match.team_home} {match.score_home}-{match.score_away} {match.team_away}
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(match.kickoff_utc).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Predictions table */}
            <div className="lg:col-span-2">
              {selectedMatch ? (
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    {selectedMatch.team_home} vs {selectedMatch.team_away}
                  </h2>

                  <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedMatch.score_home}-{selectedMatch.score_away}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Final Score</div>
                    </div>
                  </div>

                  {loadingPredictions ? (
                    <p className="text-center text-gray-600">Loading predictions...</p>
                  ) : predictions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100 border-b-2">
                            <th className="text-left px-4 py-3 font-semibold text-gray-700">Player</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-700">Prediction</th>
                            <th className="text-center px-4 py-3 font-semibold text-gray-700">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictions
                            .sort((a, b) => (b.points || 0) - (a.points || 0))
                            .map((pred) => (
                              <tr key={pred.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{pred.nickname}</td>
                                <td className="text-center px-4 py-3 font-mono text-gray-600">
                                  {pred.pred_home}-{pred.pred_away}
                                </td>
                                <td className={`text-center px-4 py-3 font-bold text-lg ${
                                  pred.points === 3 ? 'text-green-600' :
                                  pred.points === 1 ? 'text-blue-600' :
                                  'text-gray-400'
                                }`}>
                                  {pred.points ?? '-'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No predictions for this match</p>
                  )}

                  <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600">
                    <div className="font-semibold text-gray-700 mb-2">Scoring:</div>
                    <div>🟢 3 points = Exact score</div>
                    <div>🔵 1 point = Correct outcome</div>
                    <div>⚪ 0 points = Incorrect prediction</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
                  <p className="text-gray-500">Select a match to view predictions</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

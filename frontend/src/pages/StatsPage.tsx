import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatMatchTime } from '../utils/timezone';

interface Stats {
  total_score: number;
  matches_scored: number;
  exact_score_hits: number;
  matches_predicted: number;
  rank: number | null;
}

interface Prediction {
  id: number;
  pred_home: number;
  pred_away: number;
  team_home: string;
  team_away: string;
  kickoff_utc: string;
  score_home: number | null;
  score_away: number | null;
  points: number | null;
  status: string;
}

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, predsRes] = await Promise.all([
        api.getUserStats(),
        api.getUserPredictions(),
      ]);
      setStats(statsRes.data.stats);
      setPredictions(predsRes.data.predictions);
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-lg">Loading stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-8">
        <p className="text-center text-lg text-red-600">Failed to load stats</p>
      </div>
    );
  }

  const avgPoints =
    stats.matches_scored > 0 ? (stats.total_score / stats.matches_scored).toFixed(2) : '0';

  return (
    <div className="container py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">My Stats</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-gray-600 text-sm font-medium">Total Score</p>
          <p className="text-4xl font-bold text-blue-600">{stats.total_score}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-gray-600 text-sm font-medium">Rank</p>
          <p className="text-4xl font-bold text-green-600">
            {stats.rank ? `#${stats.rank}` : 'N/A'}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <p className="text-gray-600 text-sm font-medium">Exact Predictions</p>
          <p className="text-4xl font-bold text-purple-600">{stats.exact_score_hits}</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <p className="text-gray-600 text-sm font-medium">Avg Points</p>
          <p className="text-4xl font-bold text-orange-600">{avgPoints}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8">
        <p className="text-gray-700">
          <strong>{stats.matches_predicted}</strong> predictions • <strong>{stats.matches_scored}</strong> matches scored
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Prediction History</h2>

      {predictions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No predictions yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Match</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-center">Your Prediction</th>
                <th className="px-4 py-3 text-center">Result</th>
                <th className="px-4 py-3 text-center">Points</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred) => (
                <tr key={pred.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {pred.team_home} vs {pred.team_away}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatMatchTime(pred.kickoff_utc)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {pred.pred_home}-{pred.pred_away}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pred.score_home !== null && pred.score_away !== null ? (
                      <span className="font-semibold">
                        {pred.score_home}-{pred.score_away}
                      </span>
                    ) : (
                      <span className="text-gray-500">TBA</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pred.points !== null ? (
                      <span className="font-bold text-green-600">+{pred.points}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

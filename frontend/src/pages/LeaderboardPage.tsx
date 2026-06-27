import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface LeaderboardEntry {
  user_id: number;
  nickname: string;
  total_score: number;
  exact_score_hits: number;
  matches_predicted: number;
  matches_scored: number;
  rank: number;
  position_change?: number;
}

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await api.getLeaderboard();
      const currentLeaderboard = response.data.leaderboard;

      // Get stored leaderboard snapshot from localStorage
      const storedData = localStorage.getItem('leaderboard_snapshot');
      const stored = storedData ? JSON.parse(storedData) : null;
      const previousLeaderboard = stored?.data || null;

      // Create a hash of current leaderboard to detect changes
      const currentHash = JSON.stringify(currentLeaderboard.map((e: LeaderboardEntry) => ({
        user_id: e.user_id,
        rank: e.rank
      })));
      const storedHash = stored?.hash;

      // If leaderboard has changed, update the snapshot
      if (currentHash !== storedHash) {
        localStorage.setItem('leaderboard_snapshot', JSON.stringify({
          hash: currentHash,
          data: currentLeaderboard
        }));
      }

      // Calculate position changes from previous snapshot
      const leaderboardWithChanges = currentLeaderboard.map((entry: LeaderboardEntry) => {
        if (!previousLeaderboard) {
          return { ...entry, position_change: 0 };
        }
        const previousEntry = previousLeaderboard.find((p: LeaderboardEntry) => p.user_id === entry.user_id);
        const change = previousEntry ? previousEntry.rank - entry.rank : 0;
        return { ...entry, position_change: change };
      });

      setLeaderboard(leaderboardWithChanges);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-lg">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      {leaderboard.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No players yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center">Change</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Attempted</th>
                <th className="px-4 py-3 text-right">Winning Predictions</th>
                <th className="px-4 py-3 text-right">Exact Predictions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.user_id}
                  className={`border-b border-gray-200 ${
                    user?.id === entry.user_id ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-lg font-bold text-blue-600">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.nickname}
                    {user?.id === entry.user_id && <span className="ml-2 text-sm text-gray-600">(You)</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.position_change && entry.position_change > 0 ? (
                      <span className="text-green-600 font-semibold">
                        ↑ +{entry.position_change}
                      </span>
                    ) : entry.position_change && entry.position_change < 0 ? (
                      <span className="text-red-600 font-semibold">
                        ↓ {entry.position_change}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-blue-600">{entry.total_score}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.matches_predicted}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.matches_scored}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{entry.exact_score_hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

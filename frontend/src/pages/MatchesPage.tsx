import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatMatchTime, formatTimeUntilKickoff, getTimeUntilKickoff } from '../utils/timezone';

interface Match {
  id: number;
  team_home: string;
  team_away: string;
  kickoff_utc: string;
  venue: string;
  stage: string;
  group?: string;
  score_home?: number;
  score_away?: number;
  status: string;
}

interface Prediction {
  id: number;
  pred_home: number;
  pred_away: number;
  pred_winner?: string;
  points?: number;
}

export function MatchesPage() {
  const [matchesByDate, setMatchesByDate] = useState<{ [key: string]: Match[] }>({});
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ home: '', away: '', winner: '' });
  const { user } = useAuth();
  const dateRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    loadMatches();
    loadPredictions();
    // Refresh time display every 30 seconds without re-fetching data
    const interval = setInterval(() => {
      setMatchesByDate(prev => ({ ...prev }));
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]); // Reload when user changes

  // Scroll to current date when matches load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dateRef = dateRefs.current[today];
    if (dateRef) {
      setTimeout(() => {
        dateRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [matchesByDate]);

  const loadMatches = async () => {
    try {
      const response = await api.getMatches();
      setMatchesByDate(response.data.matches);
    } catch (err) {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await api.getUserPredictions();
      const map = new Map();
      response.data.predictions.forEach((p: any) => {
        map.set(p.match_id, p);
      });
      setPredictions(map);
    } catch (err) {
      console.error('Failed to load predictions');
    }
  };

  const handleEditMatch = (match: Match, prediction?: Prediction) => {
    setEditingMatchId(match.id);
    setFormData({
      home: prediction ? String(prediction.pred_home) : '',
      away: prediction ? String(prediction.pred_away) : '',
      winner: prediction?.pred_winner || '',
    });
  };

  const handleSubmitPrediction = async (match: Match) => {
    const home = parseInt(formData.home);
    const away = parseInt(formData.away);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setError('Please enter valid scores');
      return;
    }

    try {
      const prediction = predictions.get(match.id);
      const data = {
        match_id: match.id,
        pred_home: home,
        pred_away: away,
        pred_winner: formData.winner || undefined,
      };

      if (prediction) {
        await api.updatePrediction(prediction.id, data);
      } else {
        await api.createPrediction(data);
      }

      setEditingMatchId(null);
      await loadPredictions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save prediction');
    }
  };

  const getStatusColor = (match: Match) => {
    const kickoff = new Date(match.kickoff_utc).getTime();
    const now = Date.now();

    if (match.score_home !== undefined && match.score_away !== undefined) {
      return 'bg-gray-100';
    }
    if (kickoff <= now) {
      return 'bg-yellow-50';
    }
    return 'bg-white';
  };

  const getStatusBadge = (match: Match) => {
    // Check if match has a result
    if (match.score_home !== null && match.score_home !== undefined &&
        match.score_away !== null && match.score_away !== undefined) {
      return <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs">Finished</span>;
    }

    const kickoff = new Date(match.kickoff_utc).getTime();
    const now = Date.now();

    if (kickoff <= now) {
      return <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs">Locked</span>;
    }

    const { hours, minutes } = getTimeUntilKickoff(match.kickoff_utc);
    return (
      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
        Closes in {hours}h {minutes}m
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-center text-lg">Loading matches...</p>
      </div>
    );
  }

  const dates = Object.keys(matchesByDate).sort();

  return (
    <div className="container py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Matches</h1>

      {dates.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No matches found</p>
      ) : (
        dates.map((date) => (
          <div
            key={date}
            ref={(el) => {
              if (el) dateRefs.current[date] = el;
            }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>

            <div className="space-y-4">
              {matchesByDate[date].map((match) => {
                const prediction = predictions.get(match.id);
                const isEditing = editingMatchId === match.id;
                const kickoffTime = new Date(match.kickoff_utc).getTime();
                const now = Date.now();
                const hasScores = match.score_home !== null && match.score_home !== undefined &&
                                  match.score_away !== null && match.score_away !== undefined;
                const isLocked = kickoffTime <= now || hasScores;

                console.log(`Match ${match.team_home} vs ${match.team_away}: kickoff=${kickoffTime}, now=${now}, locked=${isLocked}, hasScores=${hasScores}`);

                return (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border border-gray-200 ${getStatusColor(match)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {match.team_home} vs {match.team_away}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatMatchTime(match.kickoff_utc)} at {match.venue || 'TBA'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {match.group ? `Group ${match.group}` : match.stage}
                        </p>
                      </div>
                      <div>{getStatusBadge(match)}</div>
                    </div>

                    {match.score_home !== null && match.score_home !== undefined && match.score_away !== null && match.score_away !== undefined ? (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="flex items-center justify-center gap-4 mb-2">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{match.score_home}</p>
                            <p className="text-xs text-gray-600">{match.team_home}</p>
                          </div>
                          <p className="text-gray-400">-</p>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{match.score_away}</p>
                            <p className="text-xs text-gray-600">{match.team_away}</p>
                          </div>
                        </div>
                        {prediction && (
                          <p className="text-xs text-center">
                            Your prediction: {prediction.pred_home}-{prediction.pred_away}
                            {prediction.points !== undefined && (
                              <span className="ml-2 font-semibold text-green-600">
                                +{prediction.points} pts
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    ) : isEditing ? (
                      <div className="bg-gray-50 p-4 rounded border border-gray-300 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {match.team_home}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={formData.home}
                              onChange={(e) =>
                                setFormData({ ...formData, home: e.target.value })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <div className="flex items-end justify-center">
                            <p className="text-gray-500">-</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {match.team_away}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={formData.away}
                              onChange={(e) => setFormData({ ...formData, away: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                        </div>

                        {parseInt(formData.home) === parseInt(formData.away) &&
                        match.stage !== 'group' ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              In case of draw in extra time who wins on penalties
                            </label>
                            <select
                              value={formData.winner}
                              onChange={(e) =>
                                setFormData({ ...formData, winner: e.target.value })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select winner</option>
                              <option value="home">{match.team_home} wins</option>
                              <option value="away">{match.team_away} wins</option>
                            </select>
                          </div>
                        ) : null}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmitPrediction(match)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-sm font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMatchId(null)}
                            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {prediction ? (
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-100 px-4 py-2 rounded">
                              <p className="text-sm font-semibold">
                                {prediction.pred_home} - {prediction.pred_away}
                              </p>
                              <p className="text-xs text-gray-600">Your prediction</p>
                            </div>
                            {!isLocked && (
                              <button
                                onClick={() => handleEditMatch(match, prediction)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No prediction yet</p>
                        )}
                        {!isLocked && (
                          <button
                            onClick={() => handleEditMatch(match)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                          >
                            {prediction ? 'Change' : 'Predict'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

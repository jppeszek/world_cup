import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Invite {
  id: number;
  email: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

export function AdminPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadInvites();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <div className="flex items-center justify-between">
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
                  </div>
                ))}
              </div>
            )}
          </div>
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
      </div>
    </div>
  );
}

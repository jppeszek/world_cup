import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold">
            ⚽ World Cup 2026
          </Link>

          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/matches" className="hover:text-blue-200">
                Matches
              </Link>
              <Link to="/leaderboard" className="hover:text-blue-200">
                Leaderboard
              </Link>
              <Link to="/stats" className="hover:text-blue-200">
                My Stats
              </Link>
              <Link to="/predictions" className="hover:text-blue-200">
                Predictions
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="hover:text-blue-200 font-semibold">
                  Admin
                </Link>
              )}

              <div className="flex items-center gap-4 border-l border-blue-400 pl-4">
                <span className="text-sm">{user.nickname}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-blue-200">
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

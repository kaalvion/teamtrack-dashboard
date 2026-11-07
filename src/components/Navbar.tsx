import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, LogOut, CheckSquare } from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';

export const Navbar: React.FC = () => {
  const { userProfile, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Team Member';
  
  // Calculate initials for avatar (e.g. "John Doe" -> "JD" or "Member" -> "M")
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'TM';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">TeamTrack</h1>
            <p className="text-xs text-slate-500">Business Daily Portal</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </NavLink>

          {/* User profile with initials avatar & logout */}
          <div className="ml-2 flex items-center gap-3 border-l border-slate-200 pl-3 sm:ml-4 sm:pl-4">
            <div className="flex items-center gap-2.5">
              <div 
                title={displayName} 
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs ring-2 ring-indigo-200"
              >
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-800 leading-none">{displayName}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-none">{currentUser?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { DashboardPage, HistoryPage, LoginPage } from './pages';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import { useAuth } from './firebase/AuthContext';

export const App: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar is only visible to authenticated users on portal pages */}
      {currentUser && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Public login route: If logged in, redirects automatically to Dashboard */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes: Any unauthenticated visit redirects to /login */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route redirects back to root (which triggers auth guard) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

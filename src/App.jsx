import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Lazy loaded page components
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Keywords = lazy(() => import('./pages/Keywords').then(m => ({ default: m.Keywords })));
const KeywordTracker = lazy(() => import('./pages/KeywordTracker'));
const AddKeywordPage = lazy(() => import('./pages/AddKeywordPage').then(m => ({ default: m.AddKeywordPage })));
const Rankings = lazy(() => import('./pages/Rankings').then(m => ({ default: m.Rankings })));
const SiteAudit = lazy(() => import('./pages/SiteAudit').then(m => ({ default: m.SiteAudit })));
const OnPageSEO = lazy(() => import('./pages/OnPageSEO').then(m => ({ default: m.OnPageSEO })));
const Backlinks = lazy(() => import('./pages/Backlinks').then(m => ({ default: m.Backlinks })));
const Performance = lazy(() => import('./pages/Performance').then(m => ({ default: m.Performance })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const AddWebsite = lazy(() => import('./pages/AddWebsite').then(m => ({ default: m.AddWebsite })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

// Loading Fallback Component
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 rounded-full border-3 border-indigo-500/20 border-t-indigo-600 animate-spin" />
      <span className="text-xs font-semibold text-slate-400">Loading intelligence view...</span>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Something went wrong rendering this view</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md font-mono bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1
    }
  }
});

export default function App() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('rankpulse_theme');
      localStorage.removeItem('syscorp_theme');
    } catch {}
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Authenticated Application Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/keywords" element={<Keywords />} />
                <Route path="/keyword-tracker" element={<KeywordTracker />} />
                <Route path="/keywords/new" element={<AddKeywordPage />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/site-audit" element={<SiteAudit />} />
                <Route path="/on-page-seo" element={<OnPageSEO />} />
                <Route path="/backlinks" element={<Backlinks />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/users" element={<Users />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/add-website" element={<AddWebsite />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>

        {/* Global Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#ffffff',
              color: '#0a1629',
              border: '1px solid #d2e3fc',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 98, 255, 0.1)'
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

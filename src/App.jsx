import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ColorSchemeSync from './components/ColorSchemeSync';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import PublicLayout from '@/components/layout/PublicLayout';
// Add page imports here
import AppLayout from '@/components/layout/AppLayout';
import PageLoader from '@/components/common/PageLoader';

// Route-level code splitting: every page (and the heavy libraries it imports,
// e.g. recharts) loads as its own chunk on first visit.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));
const Home = lazy(() => import('@/pages/Home'));
const AITools = lazy(() => import('@/pages/AITools'));
const ToolDetail = lazy(() => import('@/pages/ToolDetail'));
const ToolFinder = lazy(() => import('@/pages/ToolFinder'));
const Learn = lazy(() => import('@/pages/Learn'));
const CodingPractice = lazy(() => import('@/pages/CodingPractice'));
const CodingProblemDetail = lazy(() => import('@/pages/CodingProblemDetail'));
const HackathonHub = lazy(() => import('@/pages/HackathonHub'));
const ProjectBuilder = lazy(() => import('@/pages/ProjectBuilder'));
const Prompts = lazy(() => import('@/pages/Prompts'));
const Mentor = lazy(() => import('@/pages/Mentor'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Toolkit = lazy(() => import('@/pages/Toolkit'));
const Profile = lazy(() => import('@/pages/Profile'));
const Admin = lazy(() => import('@/pages/Admin'));
const Search = lazy(() => import('@/pages/Search'));
const TopicGuide = lazy(() => import('@/pages/TopicGuide'));
const Team = lazy(() => import('@/pages/Team'));
const Workspace = lazy(() => import('@/pages/Workspace'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const ContentUpdates = lazy(() => import('@/pages/ContentUpdates'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<PublicLayout />}>
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/ai-tools/:slug" element={<ToolDetail />} />
          <Route path="/tool-finder" element={<ToolFinder />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/coding-practice" element={<CodingPractice />} />
          <Route path="/coding-practice/:id" element={<CodingProblemDetail />} />
          <Route path="/hackathon-hub" element={<HackathonHub />} />
          <Route path="/project-builder" element={<ProjectBuilder />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/mentor" element={<Mentor />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/toolkit" element={<Toolkit />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/content-updates" element={<ContentUpdates />} />
          <Route path="/search" element={<Search />} />
          <Route path="/guide/:slug" element={<TopicGuide />} />
          <Route path="/team" element={<Team />} />
          <Route path="/workspace" element={<Workspace />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ColorSchemeSync />
          <ScrollToTop />
          <LanguageProvider>
            <AuthenticatedApp />
          </LanguageProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
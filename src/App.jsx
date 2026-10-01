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
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OAuthConsent from '@/pages/OAuthConsent';
import PublicLayout from '@/components/layout/PublicLayout';
// Add page imports here
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import AITools from '@/pages/AITools';
import ToolDetail from '@/pages/ToolDetail';
import ToolFinder from '@/pages/ToolFinder';
import Learn from '@/pages/Learn';
import CodingPractice from '@/pages/CodingPractice';
import CodingProblemDetail from '@/pages/CodingProblemDetail';
import HackathonHub from '@/pages/HackathonHub';
import ProjectBuilder from '@/pages/ProjectBuilder';
import Prompts from '@/pages/Prompts';
import Mentor from '@/pages/Mentor';
import Dashboard from '@/pages/Dashboard';
import Toolkit from '@/pages/Toolkit';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import Search from '@/pages/Search';
import TopicGuide from '@/pages/TopicGuide';
import Team from '@/pages/Team';
import Workspace from '@/pages/Workspace';
import About from '@/pages/About';
import Contact from '@/pages/Contact';

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
          <Route path="/search" element={<Search />} />
          <Route path="/guide/:slug" element={<TopicGuide />} />
          <Route path="/team" element={<Team />} />
          <Route path="/workspace" element={<Workspace />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { AnimatePresence, motion } from 'motion/react';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

import Layout from './components/Layout';
import SessionTracker from './components/SessionTracker';
import Entrance from './components/Entrance';

const ChatBot = lazy(() => import('./components/ChatBot'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ExperiencePage = lazy(() => import('./pages/ExperiencePage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const BlogsPage = lazy(() => import('./pages/BlogsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function RouteLoader() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" aria-label="Loading page" />
    </div>
  );
}

function RequireAdmin() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <RouteLoader />;
  }

  return user ? <AdminPage /> : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();

  // Redirect if id/blog param is present and path is not /blog
  const params = new URLSearchParams(location.search);
  if ((params.has('id') || params.has('blog')) && location.pathname !== '/blog') {
    return <Navigate to={`/blog${location.search}`} replace />;
  }

  // Redirect if project/projectId param is present and path is not /projects
  if ((params.has('project') || params.has('projectId')) && location.pathname !== '/projects') {
    return <Navigate to={`/projects${location.search}`} replace />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<AboutPage />} />
            <Route path="/blog" element={<BlogsPage />} />
            <Route path="/experience" element={<ExperiencePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/arsenal" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<RequireAdmin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Entrance />
          <SessionTracker />
          <Layout>
            <AnimatedRoutes />
          </Layout>
          <Suspense fallback={null}>
            <ChatBot />
          </Suspense>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

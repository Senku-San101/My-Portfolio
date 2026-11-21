import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { AnimatePresence, motion } from 'motion/react';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

import Entrance from './components/Entrance';
import Layout from './components/Layout';
import CyberTransition from './components/CyberTransition';
import SessionTracker from './components/SessionTracker';

// Route-level & heavy widget code splitting for faster initial load
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

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes({ user }: { user: any }) {
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
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route
            path="/"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <AboutPage />
              </motion.div>
            }
          />
          <Route
            path="/blog"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <BlogsPage />
              </motion.div>
            }
          />
          <Route
            path="/experience"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <ExperiencePage />
              </motion.div>
            }
          />
          <Route
            path="/projects"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <ProjectsPage />
              </motion.div>
            }
          />
          <Route
            path="/certificates"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <CertificatesPage />
              </motion.div>
            }
          />
          <Route
            path="/skills"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <SkillsPage />
              </motion.div>
            }
          />
          <Route
            path="/contact"
            element={
              <motion.div
                key={location.pathname}
                exit={{ x: 50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <CyberTransition />
                <ContactPage />
              </motion.div>
            }
          />
          <Route
            path="/arsenal"
            element={user ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(5px)' }}
                transition={{ duration: 0.5 }}
              >
                <LoginPage />
              </motion.div>
            }
          />
          <Route
            path="/admin"
            element={
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {user ? <AdminPage /> : <Navigate to="/login" />}
              </motion.div>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

export default function App() {
  const [entranceDismissed, setEntranceDismissed] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('id') || params.has('blog') || params.has('project') || params.has('projectId')) {
      return true;
    }
    const path = window.location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/login')) {
      return true;
    }
    return false;
  });

  const [entranceEnabled, setEntranceEnabled] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('portfolio_entrance_enabled');
      if (cached === 'false') return false;
    } catch {}
    return true;
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    // Clean up legacy session suppression if present
    try {
      sessionStorage.removeItem('portfolio_entered');
    } catch {}

    const fallbackTimer = setTimeout(() => {
      setSettingsLoaded(true);
    }, 2500);

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'config'),
      (snap) => {
        clearTimeout(fallbackTimer);
        if (snap.exists()) {
          const data = snap.data();
          const enabled = data?.showTerminalEntrance !== false;
          setEntranceEnabled(enabled);
          try {
            localStorage.setItem('portfolio_entrance_enabled', String(enabled));
          } catch {}
        }
        setSettingsLoaded(true);
      },
      () => {
        clearTimeout(fallbackTimer);
        setSettingsLoaded(true);
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const showEntrance = entranceEnabled && !entranceDismissed;

  const handleEntranceComplete = () => {
    setEntranceDismissed(true);
  };

  if (loading || !settingsLoaded) {
    return (
      <div className="min-h-dvh bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <SessionTracker />
          {!showEntrance && (
            <Suspense fallback={null}>
              <ChatBot />
            </Suspense>
          )}
          <AnimatePresence mode="wait">
            {showEntrance ? (
              <motion.div key="entrance" exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <Entrance onComplete={handleEntranceComplete} />
              </motion.div>
            ) : (
              <Layout>
                <AnimatedRoutes user={user} />
              </Layout>
            )}
          </AnimatePresence>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

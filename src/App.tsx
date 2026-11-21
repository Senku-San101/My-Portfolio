import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { AnimatePresence, motion } from 'motion/react';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

import Entrance from './components/Entrance';
import Layout from './components/Layout';
import CyberTransition from './components/CyberTransition';
import SessionTracker from './components/SessionTracker';
import ChatBot from './components/ChatBot';
import AboutPage from './pages/AboutPage';
import ExperiencePage from './pages/ExperiencePage';
import ProjectsPage from './pages/ProjectsPage';
import CertificatesPage from './pages/CertificatesPage';
import SkillsPage from './pages/SkillsPage';
import BlogsPage from './pages/BlogsPage';
import ContactPage from './pages/ContactPage';
import ArsenalPage from './pages/ArsenalPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

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
          element={
            <motion.div 
              key={location.pathname} 
              exit={{ x: 50, opacity: 0 }} 
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <CyberTransition />
              <ArsenalPage />
            </motion.div>
          } 
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
  );
}

export default function App() {
  const [showEntrance, setShowEntrance] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !(params.has('id') || params.has('blog') || params.has('project') || params.has('projectId'));
  });
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <SessionTracker />
          <ChatBot />
          <AnimatePresence mode="wait">
            {showEntrance ? (
              <motion.div key="entrance" exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                <Entrance onComplete={() => setShowEntrance(false)} />
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

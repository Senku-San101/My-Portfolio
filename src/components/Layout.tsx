import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, ReactNode, useRef } from 'react';
import { Shield, Briefcase, Award, FolderCode, User, Cog, LogOut, Sun, Moon, BookOpen, FileText, Menu, Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface LayoutProps {
  children: ReactNode;
}

const sectionDefinitions: Record<string, { labelKey: string; path: string; icon: any }> = {
  about: { labelKey: 'about', path: '/', icon: User },
  blog: { labelKey: 'blog', path: '/blog', icon: BookOpen },
  experience: { labelKey: 'experience', path: '/experience', icon: Briefcase },
  projects: { labelKey: 'projects', path: '/projects', icon: FolderCode },
  certificates: { labelKey: 'certificates', path: '/certificates', icon: Award },
  skills: { labelKey: 'skills', path: '/skills', icon: Cog },
  contact: { labelKey: 'contactNav', path: '/contact', icon: Mail },
};

const sectionDescriptions: Record<string, { en: string; ar: string }> = {
  about: { en: 'Personal profile & core background', ar: 'الملف الشخصي والخلفية التعريفية' },
  blog: { en: 'Cybersecurity insights & writeups', ar: 'أبحاث ومقالات الأمن السيبراني' },
  experience: { en: 'Professional career & work history', ar: 'المسيرة المهنية والخبرات العملية' },
  projects: { en: 'Interactive apps & tactical console', ar: 'منصة المشاريع والتطبيقات التفاعلية' },
  certificates: { en: 'Verified credentials & achievements', ar: 'الشهادات والاعتمادات الأمنية المعتمدة' },
  skills: { en: 'Technical services & specialties', ar: 'الخدمات والمهارات والأدوات التقنية' },
  contact: { en: 'Secure channel & direct communication', ar: 'اتصال مباشر وقنوات التواصل الاجتماعي' },
};

export default function Layout({ children }: LayoutProps) {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isNavExpanded) return;

    const handleScroll = () => {
      setIsNavExpanded(false);
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNavExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNavExpanded]);

  // Device Responsive check to prevent touchscreen hover bugs
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      }
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
    return () => {
      unsubProfile();
      unsubSettings();
    };
  }, []);

  const defaultDesktopNav = ['about', 'blog', 'experience', 'projects', 'certificates', 'skills', 'contact'];
  
  // Always include contact if missing from customized order, exclude arsenal from public nav
  const desktopOrderKeys = settings?.desktopNavOrder && settings.desktopNavOrder.length > 0 
    ? [
        ...settings.desktopNavOrder.filter((k: string) => k !== 'arsenal'), 
        !settings.desktopNavOrder.includes('contact') && 'contact'
      ].filter(Boolean) as string[]
    : defaultDesktopNav;

  const navItems = desktopOrderKeys
    .map((key: string) => {
      const def = sectionDefinitions[key];
      if (!def) return null;
      return { 
        key,
        label: t(def.labelKey), 
        path: def.path, 
        icon: def.icon,
        desc: sectionDescriptions[key]?.[language] || ''
      };
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] selection:bg-blue-500/30 overflow-x-clip flex flex-col">
      {/* Background Gradients and Grid */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* ========================================================= */}
      {/* UNIFIED STICKY TOP HEADER */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 group"
        >
          <motion.div
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.35 }}
            className="p-2 bg-blue-500/10 text-blue-500 rounded-xl flex-shrink-0"
          >
            <Shield className="w-4.5 h-4.5 text-blue-500" />
          </motion.div>
          <span className="font-black tracking-wider text-xs text-gray-900 dark:text-white uppercase font-sans">
            AK.SEC
          </span>
        </Link>

        {/* Sections Navigator for Desktop/PC view */}
        <nav className="hidden lg:flex items-center gap-5">
          {navItems.map((item) => {
            if (!item) return null;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-xs font-semibold whitespace-nowrap shrink-0 py-1.5 transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-underline"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute bottom-0 inset-x-0 h-[2px] rounded-full bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer overflow-hidden"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
                transition={{ duration: 0.16 }}
                className="flex items-center justify-center"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          {/* Language Toggle */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleLanguage}
            className="min-w-[40px] min-h-[40px] px-2.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-[10px] font-black uppercase tracking-wider cursor-pointer"
            aria-label="Toggle language"
          >
            {language === 'en' ? 'AR' : 'EN'}
          </motion.button>

          {/* Admin and LogOut buttons */}
          {user && (
            <div className="flex items-center gap-1.5 border-s border-gray-200 dark:border-white/10 ps-2.5 md:ps-3">
              <Link
                to="/admin"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                title={t('admin')}
                aria-label={t('admin')}
              >
                <Cog className="w-4 h-4" />
              </Link>
              <button
                onClick={() => auth.signOut()}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all cursor-pointer"
                title={t('signOut')}
                aria-label={t('signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* FLOATING CENTERED DOCK (Aligned on the Right Side) */}
      {/* ========================================================= */}
      <motion.nav 
        ref={navRef}
        initial={{ x: 50, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isNavExpanded ? (isDesktop ? 180 : 150) : (isDesktop ? 56 : 48)
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
        className={`fixed end-3 md:end-6 top-1/2 -translate-y-1/2 z-50 flex lg:hidden flex-col items-center p-1.5 md:p-2 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800/60 ${
          isNavExpanded ? 'rounded-[2rem]' : 'rounded-full'
        } shadow-lg dark:shadow-none space-y-2 md:space-y-2.5 select-none transition-all duration-300`}
        id="unified-sidebar-nav"
      >
        {/* Three lines menu toggle button */}
        <button
          onClick={() => setIsNavExpanded(!isNavExpanded)}
          className={`min-w-[36px] min-h-[36px] p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
            isNavExpanded 
              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
          title={isNavExpanded ? "Hide Section Names" : "Show Section Names"}
          aria-label={isNavExpanded ? "Collapse navigation" : "Expand navigation"}
        >
          <Menu className="w-4 h-4 md:w-4.5 md:h-4.5" />
        </button>

        <div className="w-full h-px bg-gray-100 dark:bg-zinc-800/40 my-0.5 md:my-1" />

        {navItems.map((item) => {
          if (!item) return null;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsNavExpanded(false)}
              className={`group relative p-2 md:p-2.5 transition-all duration-300 flex items-center ${
                isNavExpanded 
                  ? 'justify-start w-full gap-2.5 md:gap-3 rounded-2xl px-3 md:px-4' 
                  : 'justify-center rounded-full w-9 h-9 md:w-10 md:h-10'
              } ${
                isActive 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/25 scale-105' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-transparent hover:bg-gray-100/50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <item.icon className="w-4 h-4 md:w-4.5 md:h-4.5 flex-shrink-0" />
              
              {/* Dynamic Animated Label Text Beside the Icon */}
              <AnimatePresence initial={false}>
                {isNavExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.12 }}
                    className={`text-[10px] md:text-xs font-black uppercase tracking-wider whitespace-nowrap overflow-hidden block ${
                      isActive ? 'text-white' : 'text-gray-800 dark:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip (Only shown when NOT expanded, on hover) */}
              {!isNavExpanded && (
                <div className="absolute end-full me-3.5 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-zinc-950 text-white dark:text-zinc-200 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-gray-800 dark:border-zinc-800/50 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 shadow-xl hidden md:block whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </motion.nav>

      {/* ========================================================= */}
      {/* CENTRALIZED MAIN CONTENT CONTAINER */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between transition-all duration-300">
        
        {/* Floating Download CV Button (Always visible neatly on the bottom left) */}
        {profile?.cvUrl && !location.pathname.startsWith('/admin') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-6 start-4 md:start-8 z-40"
          >
            <a
              href={profile.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="Abdulrahman Kamal CV.pdf"
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 outline-none text-white font-bold py-3 px-4 sm:px-5 rounded-full shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.6)] transition-all transform hover:-translate-y-0.5 group active:scale-95 text-xs uppercase tracking-wider font-sans cursor-pointer"
              id="download-cv-button"
            >
              <FileText className="w-4 h-4 text-white" />
              <span className="text-white hidden sm:inline">{t('downloadMyCv')}</span>
            </a>
          </motion.div>
        )}

        {/* Dynamic page main route rendering */}
        <main className="pt-6 md:pt-10 pb-24 md:pb-32 px-4 max-w-5xl mx-auto w-full">
          {children}
        </main>

        <footer className="py-12 px-4 border-t border-gray-100 dark:border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Abdulrahman Kamal. {t('rights')}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

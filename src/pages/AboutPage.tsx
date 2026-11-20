import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Linkedin, Github, Briefcase, Award, FolderCode, Cog, BookOpen, ChevronRight, FileText, Eye, Download, X as XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Profile, AppSettings, Specialization } from '../types';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import ScrambleHeader from '../components/ScrambleHeader';
import { useLanguage } from '../context/LanguageContext';

function CVViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const embedUrl = isMobile
    ? `https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`
    : `${url}#toolbar=0`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-2xl"
    >
      <button
        onClick={onClose}
        className="absolute top-4 end-4 md:top-8 md:end-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110] cursor-pointer"
        aria-label="Close CV viewer"
      >
        <XIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
      </button>

      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.97 }}
        className="w-full max-w-5xl h-[85vh] md:h-[90vh] bg-white dark:bg-[#0c0c0e] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-gray-200 dark:border-white/10"
      >
        {isMobile ? (
          <div className="p-4 bg-[#1C1C1E] dark:bg-[#0c0c0e] border-b border-gray-200 dark:border-white/10 flex flex-col gap-3">
            <div className="text-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                {language === 'en' ? 'Curriculum Vitae' : 'السيرة الذاتية'}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 px-4 leading-normal">
                {language === 'en'
                  ? 'Mobile browsers may restrict inline PDF viewing. Use the options below for full zoom:'
                  : 'قد تفرض متصفحات الهاتف قيودًا على عرض ملفات PDF. استخدم الخيارات أدناه للتكبير الكامل:'}
              </p>
            </div>

            <div className="flex gap-2 w-full">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center"
              >
                <Eye className="w-4 h-4" />
                <span>{language === 'en' ? 'Open Fullscreen' : 'فتح ملء الشاشة'}</span>
              </a>
              <a
                href={url}
                download="Abdulrahman Kamal CV.pdf"
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center border border-white/10"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'en' ? 'Download PDF' : 'تحميل الملف'}</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="absolute top-4 start-4 flex gap-2 z-10">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-black/85 backdrop-blur-md hover:bg-black text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-lg flex items-center gap-1.5 transition-all"
              title="Open in new tab"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </a>
            <a
              href={url}
              download="Abdulrahman Kamal CV.pdf"
              className="px-3 py-1.5 bg-black/85 backdrop-blur-md hover:bg-black text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-lg flex items-center gap-1.5 transition-all"
              title="Download CV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        )}

        <div className="flex-1 w-full h-full relative bg-gray-50 dark:bg-black/40">
          <iframe
            src={embedUrl}
            className="w-full h-full border-none"
            title="CV Viewer"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

const DEFAULT_PROFILE: Profile = {
  name: 'Abdulrahman Kamal',
  title: 'Cybersecurity Engineer',
  bio: 'Dedicated professional focused on advancing national cybersecurity through robust infrastructure frameworks, strict policies, and defensive operations.',
  location: 'Aden, Yemen',
  email: 'Abdulrahmankamal609@gmail.com',
  phone: '',
  linkedin: 'https://linkedin.com/in/abdulrahman-kamal/',
  github: 'https://github.com/GIGA-YZ',
  photoUrl: '',
  cvUrl: '',
};

export default function AboutPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [specsLoaded, setSpecsLoaded] = useState(false);
  const [showCV, setShowCV] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Portfolio';

    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as Profile);
        setAvatarFailed(false);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'profile/main'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data() as AppSettings);
    }, (err) => {
      console.warn('Settings fetch failed, using fallbacks', err);
    });

    const qSpecs = query(collection(db, 'specializations'), orderBy('order', 'asc'));
    const unsubSpecs = onSnapshot(qSpecs, (snapshot) => {
      setSpecializations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Specialization)));
      setSpecsLoaded(true);
    }, (err) => {
      console.warn('Specializations fetch failed, using fallbacks', err);
      setSpecsLoaded(true);
    });

    return () => {
      unsubProfile();
      unsubSettings();
      unsubSpecs();
    };
  }, []);

  const data: Profile = profile || DEFAULT_PROFILE;
  const nameParts = data.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  return (
    <PageWrapper className="max-w-5xl mx-auto space-y-24 sm:space-y-32">
      {/* Centered Hero Section */}
      <section id="profile-hero" className="flex flex-col items-center text-center gap-10 sm:gap-12 pt-6 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Outer orbital ring */}
          <div className="hidden sm:block absolute -inset-3 rounded-full border border-dashed border-blue-500/30 animate-spin-slow pointer-events-none" />
          <div className="w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full overflow-hidden glass-md p-1.5 relative group shadow-xl shadow-blue-500/10">
            {data.photoUrl && !avatarFailed ? (
              <img
                src={data.photoUrl}
                alt={data.name}
                fetchPriority="high"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600/15 to-indigo-600/15 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Shield className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
            )}
          </div>
        </motion.div>

        <div className="space-y-6 w-full">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="inline-flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{t('liveFeed')}</span>
          </motion.p>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-[0.92] text-[#1D1D1F] dark:text-white flex flex-col items-center text-balance">
            <ScrambleHeader text={firstName} as="span" delay={40} duration={360} />
            {lastName && (
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                className="relative mt-1 pb-2 px-3 inline-block"
              >
                <ScrambleHeader text={lastName} as="span" delay={90} duration={400} />
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.22, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-0 inset-x-0 h-[2px] origin-center bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"
                />
              </motion.span>
            )}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 dark:text-gray-300 font-bold tracking-tight">
              {data.title}
            </p>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {data.bio}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap justify-center items-center gap-4 pt-4"
          >
            {data.email && (
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openLink(`mailto:${data.email}`)}
                className="glass-sm px-7 py-3.5 rounded-full hover:bg-blue-500/10 hover:border-blue-500/40 transition-colors flex items-center gap-2.5 shadow-sm cursor-pointer"
              >
                <Mail className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{t('establishLink')}</span>
              </motion.button>
            )}

            <div className="flex items-center gap-3">
              {data.linkedin && (
                <motion.button
                  whileHover={{ y: -2, scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => openLink(data.linkedin!)}
                  className="glass-sm min-w-[44px] min-h-[44px] p-3 rounded-full hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="LinkedIn profile"
                  title="LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>
              )}
              {data.github && (
                <motion.button
                  whileHover={{ y: -2, scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => openLink(data.github!)}
                  className="glass-sm min-w-[44px] min-h-[44px] p-3 rounded-full hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="GitHub profile"
                  title="GitHub"
                >
                  <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.button>
              )}
            </div>

            {data.cvUrl && (
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowCV(true)}
                  className="glass-sm px-7 py-3.5 rounded-full hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
                  title={language === 'en' ? 'View My CV' : 'عرض سيرتي الذاتية'}
                >
                  <Eye className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap">
                    {t('downloadCv')}
                  </span>
                </motion.button>
                <motion.a
                  whileHover={{ y: -2, scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  href={data.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Abdulrahman Kamal CV.pdf"
                  className="glass-sm min-w-[44px] min-h-[44px] p-3 rounded-full hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
                  title={language === 'en' ? 'Download CV' : 'تحميل سيرتي الذاتية'}
                  aria-label="Download CV"
                >
                  <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.a>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Interactive section navigator */}
      <MobileExploreNavigation settings={settings} />

      <section id="specializations" className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase text-gray-900 dark:text-white">
            {t('specializations')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {specializations.length > 0 ? (
            specializations.map((spec, i) => (
              <motion.div
                key={spec.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.06, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5 }}
                className="glass-sm p-7 sm:p-9 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-colors duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6 gap-4">
                    <div className="w-10 h-1 bg-blue-500/40 group-hover:w-16 transition-all duration-300 rounded-full flex-shrink-0" />
                    {spec.imageUrl && (
                      <ImageViewer images={[spec.imageUrl]} label={spec.title}>
                        <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 bg-gray-100 dark:bg-black/40 relative shadow-sm hover:border-blue-500/50 transition-colors">
                          <img
                            src={spec.imageUrl}
                            alt={spec.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </ImageViewer>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight leading-snug text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                    {spec.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
                    {spec.description}
                  </p>
                </div>
              </motion.div>
            ))
          ) : !specsLoaded ? (
            [0, 1, 2].map((skeletonIdx) => (
              <div key={skeletonIdx} className="glass-sm p-7 sm:p-9 rounded-3xl animate-pulse space-y-4">
                <div className="h-1 w-12 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-7 w-3/4 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))
          ) : (
            [
              { title: t('soc'), desc: t('socDesc') },
              { title: t('forensics'), desc: t('forensicsDesc') },
              { title: t('linux'), desc: t('linuxDesc') },
            ].map((spec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ delay: i * 0.06, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5 }}
                className="glass-sm p-7 sm:p-9 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-colors duration-300 group"
              >
                <div className="w-10 h-1 bg-blue-500/40 mb-6 group-hover:w-16 transition-all duration-300 rounded-full" />
                <h3 className="text-2xl font-bold mb-4 tracking-tight leading-snug text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {spec.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
                  {spec.desc}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <AnimatePresence>
        {showCV && data.cvUrl && (
          <CVViewer url={data.cvUrl} onClose={() => setShowCV(false)} />
        )}
      </AnimatePresence>

      {/* Contact Section */}
      <section id="contact" className="space-y-12 py-16 border-t border-gray-200/80 dark:border-white/5">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-[0.25em]">
            <Shield className="w-4 h-4" />
            <span>{t('contact')}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
            {t('contactTitle')}
          </h2>
        </div>

        <div className="max-w-xl mx-auto">
          <ContactForm />
        </div>
      </section>
    </PageWrapper>
  );
}

const sectionDefinitions: Record<string, { labelKey: string; path: string; icon: any; color: string }> = {
  experience: { labelKey: 'experience', path: '/experience', icon: Briefcase, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  projects: { labelKey: 'projects', path: '/projects', icon: FolderCode, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  certificates: { labelKey: 'certificates', path: '/certificates', icon: Award, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  skills: { labelKey: 'skills', path: '/skills', icon: Cog, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
  blog: { labelKey: 'blog', path: '/blog', icon: BookOpen, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' },
  contact: { labelKey: 'contactNav', path: '/contact', icon: Mail, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

function MobileExploreNavigation({ settings }: { settings: AppSettings | null }) {
  const { t } = useLanguage();

  const defaultDesktopNav = ['about', 'blog', 'experience', 'projects', 'certificates', 'skills', 'contact'];
  const desktopOrderKeys = settings?.desktopNavOrder && settings.desktopNavOrder.length > 0
    ? [...settings.desktopNavOrder, !settings.desktopNavOrder.includes('contact') && 'contact'].filter(Boolean) as string[]
    : defaultDesktopNav;

  const filteredKeys = desktopOrderKeys.filter((key: string) => key !== 'about');

  const sections = filteredKeys
    .map((key: string) => {
      const def = sectionDefinitions[key];
      if (!def) return null;
      return {
        label: t(def.labelKey),
        path: def.path,
        icon: def.icon,
        color: def.color,
      };
    })
    .filter(Boolean);

  return (
    <section className="w-full space-y-8 py-12 border-t border-gray-200/80 dark:border-white/5 text-center">
      <div className="space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
          {t('exploreMore')}
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          {t('wantToSee')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 max-w-5xl mx-auto text-start">
        {sections.map((sec, i) => {
          if (!sec) return null;
          return (
            <motion.div
              key={sec.path}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
            >
              <Link
                to={sec.path}
                className="flex items-center justify-between p-4 glass-sm rounded-2xl hover:bg-gray-100/80 dark:hover:bg-white/10 active:scale-[0.98] transition-all group shadow-sm h-full"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border ${sec.color} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <sec.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                    {sec.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'messages'), data);
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(t('contactError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="glass-md p-8 rounded-3xl text-center space-y-4"
      >
        <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('contactSuccess')}</h3>
        <button onClick={() => setSuccess(false)} className="text-blue-600 dark:text-blue-400 font-mono text-xs uppercase tracking-widest hover:underline cursor-pointer">
          {t('sendAnother')}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 ps-2 block">{t('contactName')}</label>
        <input
          required
          name="name"
          type="text"
          className="w-full glass-md px-5 py-3.5 rounded-2xl focus:border-blue-500 outline-none transition-colors text-gray-900 dark:text-white placeholder:text-gray-400"
          placeholder={t('placeholderName')}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 ps-2 block">{t('contactEmail')}</label>
        <input
          required
          name="email"
          type="email"
          className="w-full glass-md px-5 py-3.5 rounded-2xl focus:border-blue-500 outline-none transition-colors text-gray-900 dark:text-white placeholder:text-gray-400"
          placeholder={t('placeholderEmail')}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 ps-2 block">{t('contactMessage')}</label>
        <textarea
          required
          name="message"
          rows={4}
          className="w-full glass-md px-5 py-3.5 rounded-2xl focus:border-blue-500 outline-none transition-colors text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
          placeholder={t('placeholderMessage')}
        />
      </div>

      {error && <p className="text-red-500 text-xs font-mono text-center">{error}</p>}

      <button
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl transition-colors font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
      >
        <span>{loading ? t('placeholderTransmitting') : t('contactSend')}</span>
        {!loading && <Shield className="w-4.5 h-4.5" />}
      </button>
    </form>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Linkedin, Github, MapPin, Globe, Briefcase, Award, FolderCode, Cog, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, collection, addDoc, query, orderBy } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Profile, AppSettings, Specialization } from '../types';
import Typewriter from '../components/Typewriter';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Eye, Download, X as XIcon } from 'lucide-react';

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
        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110]"
        title="Close"
      >
        <XIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
      </button>

      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[85vh] md:h-[90vh] bg-white dark:bg-[#0c0c0e] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-gray-200 dark:border-white/10"
      >
        {isMobile ? (
          <div className="p-4 bg-[#1C1C1E] dark:bg-[#0c0c0e] border-b border-gray-200 dark:border-white/10 flex flex-col gap-3">
            <div className="text-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                {language === 'en' ? 'Curriculum Vitae' : 'السيرة الذاتية'}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 px-4 leading-normal">
                {language === 'en' 
                  ? 'Mobile browsers may restrict inline PDF viewing. For the absolute best reading experience with full pinch-to-zoom, use the options below:' 
                  : 'قد تفرض متصفحات الهاتف قيودًا على عرض ملفات PDF. للحصول على أفضل تجربة قراءة مع ميزة التكبير والتصغير الكاملة، استخدم الخيارات أدناه:'}
              </p>
            </div>
            
            <div className="flex gap-2 w-full">
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center"
              >
                <Eye className="w-4 h-4" />
                <span>{language === 'en' ? 'Open Fullscreen' : 'فتح ملء الشاشة'}</span>
              </a>
              <a 
                href={url}
                download="Abdulrahman Kamal CV.pdf"
                className="flex-1 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center border border-white/10"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'en' ? 'Download PDF' : 'تحميل الملف'}</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="absolute top-4 left-4 flex gap-2 z-10">
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

        {!isMobile && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10 pointer-events-none">
            Document Viewer
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function GloriousName({ text }: { text: string }) {
  return (
    <div className="relative inline-block group px-4">
      {/* Glitch Layers */}
      <div className="relative z-10">
        <div className="absolute inset-0 text-red-500 mix-blend-screen font-black pointer-events-none glitch-red opacity-0 group-hover:opacity-100 transition-opacity">
          {text}
        </div>
        
        <div className="absolute inset-0 text-cyan-400 mix-blend-screen font-black pointer-events-none glitch-cyan opacity-0 group-hover:opacity-100 transition-opacity">
          {text}
        </div>

        {/* Main Text */}
        <motion.h2 
          animate={{ 
            opacity: [1, 0.98, 1, 0.95, 1],
            skewX: [0, 0.5, 0, -0.5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative text-[#1D1D1F] dark:text-white font-black"
        >
          {text}
        </motion.h2>
      </div>

      {/* Underline Accents */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent mt-2"
      />
    </div>
  );
}

export default function AboutPage() {
  const [profile, setProfile] = useState<Profile| null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [showCV, setShowCV] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Portfolio';

    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (snapshot) => {
      if (snapshot.exists()) setProfile(snapshot.data() as Profile);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'profile/main'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.data() as AppSettings);
      setLoading(false);
    }, (err) => {
      console.warn("Settings fetch failed, using fallbacks", err);
      setLoading(false);
    });

    const qSpecs = query(collection(db, 'specializations'), orderBy('order', 'asc'));
    const unsubSpecs = onSnapshot(qSpecs, (snapshot) => {
      setSpecializations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Specialization)));
    }, (err) => {
      console.warn("Specializations fetch failed, using fallbacks", err);
    });

    return () => {
      unsubProfile();
      unsubSettings();
      unsubSpecs();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('initializing')} speed={20} />
      </div>
    );
  }

  const data: Profile = profile || {
    name: 'Abdulrahman Kamal',
    title: 'Cybersecurity Engineer',
    bio: 'Dedicated professional focused on advancing national cybersecurity through robust infrastructure frameworks, strict policies, and defensive operations.',
    location: 'Aden, Yemen',
    email: 'Abdulrahmankamal609@gmail.com',
    phone: '',
    linkedin: 'https://linkedin.com/in/abdulrahman-kamal/',
    github: 'https://github.com/GIGA-YZ',
    photoUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    cvUrl: ''
  };

  const nameParts = data.name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  return (
    <PageWrapper className="max-w-5xl mx-auto space-y-32">
      {/* Centered Hero Section */}
      <section className="flex flex-col items-center text-center gap-16 pt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden glass-md p-1.5 relative group">
            <img 
              src={data.photoUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full transition-all duration-1000 scale-105 group-hover:scale-100"
            />
            <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-blue-500/20 rounded-full pointer-events-none"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8 w-full"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mx-auto">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Shield className="w-3.5 h-3.5" />
            </motion.div>
            <span>{t('liveFeed')}</span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85] flex flex-col items-center">
            <div className="overflow-hidden py-2">
              <motion.div
                initial={{ y: 150 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <GloriousName text={firstName} />
              </motion.div>
            </div>
            <div className="overflow-hidden py-2">
              <motion.div
                initial={{ y: 150 }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <GloriousName text={lastName} />
              </motion.div>
            </div>
          </h1>

          <div className="space-y-4 max-w-2xl mx-auto">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-2xl md:text-3xl text-gray-400 dark:text-gray-500 font-bold tracking-tight"
            >
               {data.title}
            </motion.p>
            <div className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              <Typewriter text={data.bio} delay={1200} speed={40} />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex flex-wrap justify-center gap-6 pt-8"
          >
            {data.email && (
              <button onClick={() => openLink(`mailto:${data.email}`)} className="glass-sm px-8 py-4 rounded-full hover:scale-105 transition-all hover:bg-blue-500/10 flex items-center space-x-3 border border-blue-500/20 shadow-xl group">
                <Mail className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-black uppercase tracking-widest">{t('establishLink')}</span>
              </button>
            )}
            <div className="flex space-x-4">
              {data.linkedin && (
                <button onClick={() => openLink(data.linkedin!)} className="glass-sm p-4 rounded-full hover:scale-110 transition-all hover:bg-blue-500/10 border border-white/10">
                  <Linkedin className="w-6 h-6 text-gray-500" />
                </button>
              )}
              {data.github && (
                <button onClick={() => openLink(data.github!)} className="glass-sm p-4 rounded-full hover:scale-110 transition-all hover:bg-blue-500/10 border border-white/10">
                  <Github className="w-6 h-6 text-gray-500" />
                </button>
              )}
            </div>

            {data.cvUrl && (
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowCV(true)}
                  className="flex-1 md:flex-initial glass-sm px-8 py-4 rounded-full hover:scale-[1.03] active:scale-[0.98] transition-all bg-white/5 border border-white/10 flex items-center justify-center space-x-3 group shadow-xl hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer"
                  title={language === 'en' ? 'View My CV' : 'عرض سيرتي الذاتية'}
                >
                  <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap">
                    {t('downloadCv')}
                  </span>
                </button>
                <a 
                  href={data.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Abdulrahman Kamal CV.pdf"
                  className="glass-sm p-4 rounded-full hover:scale-[1.08] active:scale-[0.95] transition-all bg-white/5 border border-white/10 flex items-center justify-center group shadow-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 flex-shrink-0 cursor-pointer"
                  title={language === 'en' ? 'Download CV' : 'تحميل سيرتي الذاتية'}
                >
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Mobile view interactive navigation suggesting next sections */}
      <MobileExploreNavigation />

      <section className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black tracking-tighter uppercase italic text-blue-500/20 dark:text-white/10">{t('specializations')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specializations && specializations.length > 0 ? (
            specializations.map((spec, i) => (
              <motion.div
                key={spec.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -15, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                className="glass-sm p-12 rounded-[3rem] border border-white/10 shadow-2xl group transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="w-12 h-1 bg-blue-500/30 group-hover:w-20 transition-all duration-700 flex-shrink-0" />
                    {spec.imageUrl && (
                      <ImageViewer images={[spec.imageUrl]} label={spec.title}>
                        <div className="w-28 sm:w-32 md:w-36 aspect-video rounded-2xl overflow-hidden glass-sm border border-white/10 flex-shrink-0 bg-black/40 relative shadow-lg group/img hover:border-blue-500/50 transition-all duration-300">
                          <img 
                            src={spec.imageUrl} 
                            alt={spec.title} 
                            className="w-full h-full object-cover rounded-2xl group-hover/img:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-blue-500/0 group-hover/img:bg-blue-500/15 transition-colors duration-300 pointer-events-none" />
                        </div>
                      </ImageViewer>
                    )}
                  </div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight leading-none italic group-hover:text-blue-500 transition-colors uppercase break-words">{spec.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium text-lg">{spec.description}</p>
                </div>
              </motion.div>
            ))
          ) : (
            [t('soc'), t('forensics'), t('linux')].map((spec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -15, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                className="glass-sm p-12 rounded-[3rem] border border-white/10 shadow-2xl group transition-all duration-500"
              >
                <div className="w-12 h-1 bg-blue-500/30 mb-8 group-hover:w-full transition-all duration-700" />
                <h3 className="text-3xl font-black mb-6 tracking-tight leading-none italic group-hover:text-blue-500 transition-colors uppercase">{spec}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium text-lg">Detailed proficiency in {spec.toLowerCase()} operational frameworks.</p>
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
      <section id="contact" className="space-y-16 py-20 border-t border-gray-100 dark:border-white/5">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center space-x-2 text-blue-500 font-mono text-xs uppercase tracking-[0.3em]"
          >
            <Shield className="w-4 h-4" />
            <span>{t('contact')}</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">{t('contactTitle')}</h2>
        </div>

        <div className="max-w-xl mx-auto">
          <ContactForm />
        </div>
      </section>
    </PageWrapper>
  );
}

const sectionDefinitions: Record<string, { labelKey: string; path: string; icon: any; color: string }> = {
  experience: { labelKey: 'experience', path: '/experience', icon: Briefcase, color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20' },
  projects: { labelKey: 'projects', path: '/projects', icon: FolderCode, color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20' },
  certificates: { labelKey: 'certificates', path: '/certificates', icon: Award, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20' },
  skills: { labelKey: 'skills', path: '/skills', icon: Cog, color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20' },
  blog: { labelKey: 'blog', path: '/blog', icon: BookOpen, color: 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20' },
  contact: { labelKey: 'contactNav', path: '/contact', icon: Mail, color: 'text-blue-600 bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20' },
};

function MobileExploreNavigation() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
    return () => unsub();
  }, []);

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
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-8 py-16 border-t border-gray-100 dark:border-white/5 text-center mt-12"
    >
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 animate-pulse">
          {t('exploreMore')}
        </span>
        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
          {t('wantToSee')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 max-w-5xl mx-auto px-4 text-start">
        {sections.map((sec, i) => {
          if (!sec) return null;
          return (
            <motion.div
              key={sec.path}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                to={sec.path}
                className="flex items-center justify-between p-4 bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl hover:bg-gray-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all group shadow-sm"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className={`p-3 rounded-2xl border border-white/5 ${sec.color}`}>
                    <sec.icon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {sec.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-md p-8 rounded-3xl text-center space-y-4"
      >
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold uppercase tracking-tight">{t('contactSuccess')}</h3>
        <button onClick={() => setSuccess(false)} className="text-blue-500 font-mono text-xs uppercase tracking-widest hover:underline">
          {t('sendAnother')}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 pl-4">{t('contactName')}</label>
        <input 
          required
          name="name"
          type="text"
          className="w-full glass-md px-6 py-4 rounded-2xl border-transparent focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400"
          placeholder={t('placeholderName')}
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 pl-4">{t('contactEmail')}</label>
        <input 
          required
          name="email"
          type="email"
          className="w-full glass-md px-6 py-4 rounded-2xl border-transparent focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400"
          placeholder={t('placeholderEmail')}
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 pl-4">{t('contactMessage')}</label>
        <textarea 
          required
          name="message"
          rows={5}
          className="w-full glass-md px-6 py-4 rounded-3xl border-transparent focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400 resize-none"
          placeholder={t('placeholderMessage')}
        />
      </div>
      
      {error && <p className="text-red-500 text-xs font-mono text-center">{error}</p>}

      <button 
        disabled={loading}
        className="w-full glass-md px-8 py-6 rounded-3xl hover:bg-blue-500 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 group"
      >
        <span>{loading ? t('placeholderTransmitting') : t('contactSend')}</span>
        {!loading && <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
      </button>
    </form>
  );
}


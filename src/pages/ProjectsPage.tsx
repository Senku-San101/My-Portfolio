import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ExternalLink, 
  Github, 
  Shield, 
  LayoutGrid, 
  Terminal, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Sparkles,
  Share2,
  Check,
  Play,
  Video
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Project, AppSettings } from '../types';
import Typewriter from '../components/Typewriter';
import ScrambleHeader from '../components/ScrambleHeader';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import { useLanguage } from '../context/LanguageContext';
import { getProjectDisplayMedia, isVideoMedia } from '../lib/videoUtils';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'console' | 'grid'>('console');
  const [activeIndex, setActiveIndex] = useState(0);
  const { t, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detectedVideos, setDetectedVideos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/projects/all-detected-videos')
      .then(r => r.json())
      .then(map => {
        if (map && typeof map === 'object') {
          setDetectedVideos(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qProjects = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError("Failed to load project database.");
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'projects');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn("Settings fetch failed, using fallbacks", err);
    });

    return () => {
      unsubProjects();
      unsubSettings();
    };
  }, []);

  // Safe bounds guard for activeIndex if projects database updates in real-time
  const safeActiveIndex = Math.max(0, Math.min(activeIndex, projects.length - 1));
  const activeProject = projects[safeActiveIndex];

  // Helper function to find a project by ID or key terms
  const findProjectIndex = (queryStr: string): number => {
    if (!queryStr || projects.length === 0) return -1;
    const q = queryStr.toLowerCase().trim();
    // 1. Direct ID match
    const exactId = projects.findIndex(p => p.id === queryStr);
    if (exactId !== -1) return exactId;

    // 2. Exact or partial title / keywords match
    return projects.findIndex(p => {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      if (title.includes(q)) return true;
      if (q === 'misbar' && title.includes('misbar')) return true;
      if ((q === 'tor' || q === 'tor-chat' || q === 'chat') && (title.includes('tor') || title.includes('chat'))) return true;
      if ((q === 'the-right-text' || q === 'right-text' || q === 'rtl') && (title.includes('right') || title.includes('rtl'))) return true;
      if ((q === 'ip-helper' || q === 'ip') && (title.includes('ip') || title.includes('helper'))) return true;
      if ((q === 'security-lab' || q === 'lab' || q === 'proxmox') && (title.includes('lab') || desc.includes('proxmox'))) return true;
      return false;
    });
  };

  // Sync URL query params with active project on load and whenever searchParams change
  useEffect(() => {
    if (!loading && projects.length > 0) {
      const projectId = searchParams.get('project') || searchParams.get('projectId');
      if (projectId) {
        const foundIndex = findProjectIndex(projectId);
        if (foundIndex !== -1) {
          setViewMode('console');
          setActiveIndex(foundIndex);
          // Trigger smooth scroll to the active project console
          setTimeout(() => {
            const el = document.getElementById('active-project-console');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('cyber-teleport-glow');
              setTimeout(() => el.classList.remove('cyber-teleport-glow'), 3500);
            }
          }, 250);
        }
      }
      setIsInitialized(true);
    }
  }, [loading, projects, searchParams]);

  // Sync state back to URL when activeIndex changes
  useEffect(() => {
    if (loading || projects.length === 0 || !isInitialized) return;
    const activeProj = projects[safeActiveIndex];
    if (activeProj) {
      const currentParam = searchParams.get('project') || searchParams.get('projectId');
      if (currentParam !== activeProj.id) {
        setSearchParams({ project: activeProj.id! }, { replace: true });
      }
    }
  }, [safeActiveIndex, projects, loading, searchParams, setSearchParams, isInitialized]);

  // Dynamically update document title based on viewMode and active project
  useEffect(() => {
    if (viewMode === 'console' && activeProject) {
      document.title = `Projects | ${activeProject.title}`;
    } else {
      document.title = 'Abdulrahman Kamal | Projects';
    }
  }, [viewMode, activeProject]);

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/projects?project=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrev = () => {
    setActiveIndex(prev => (prev === 0 ? projects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev === projects.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('accessingDatabase')} speed={20} />
      </div>
    );
  }

  return (
    <PageWrapper className="space-y-16 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic">
          <ScrambleHeader text={t('secLab')} />
        </h1>
        <div className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
          <Typewriter key={settings?.projectsSubtitle || "default"} text={settings?.projectsSubtitle || "A showcase of specialized environments and tools built to simulate, detect, and respond to modern cyber threats."} delay={800} />
        </div>
      </div>

      {/* Switcher Controls */}
      <div className="flex justify-center pt-2">
        <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center space-x-1">
          <button
            onClick={() => setViewMode('console')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${
              viewMode === 'console' ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {viewMode === 'console' && (
              <motion.div
                layoutId="active-view-tab"
                className="absolute inset-0 bg-blue-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              {language === 'en' ? 'Tactical Console' : 'منصة التحكم'}
            </span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${
              viewMode === 'grid' ? 'text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {viewMode === 'grid' && (
              <motion.div
                layoutId="active-view-tab"
                className="absolute inset-0 bg-blue-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4" />
              {language === 'en' ? 'Bento Grid' : 'شبكة العناصر'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Display Area */}
      {projects.length === 0 ? (
        <div className="text-center py-20 font-mono text-xs uppercase tracking-widest text-gray-500">
          No system records configured yet.
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'console' ? (
            <motion.div
              key="console-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
            >
              {/* DESKTOP SIDEBAR SWITCHER (md and up only) */}
              <div className="hidden md:block md:col-span-4 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-[10px] font-black tracking-[0.3em] uppercase text-gray-400 dark:text-gray-500 px-4 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  <span>PROJECT DIRECTORY</span>
                </div>
                {projects.map((proj, idx) => {
                  const isActive = idx === safeActiveIndex;
                  return (
                    <button
                      key={proj.id || idx}
                      onClick={() => setActiveIndex(idx)}
                      className="w-full text-left relative transition-all duration-300"
                    >
                      <div className={`p-5 rounded-2xl border text-left transition-all duration-300 ${
                        isActive 
                          ? 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-500 shadow-lg shadow-blue-500/10 text-gray-900 dark:text-white ring-2 ring-blue-500/25' 
                          : 'bg-white dark:bg-zinc-900/40 hover:bg-gray-50 dark:hover:bg-zinc-900 border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-sm'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black font-mono tracking-widest text-blue-500">
                            NODE_{String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {(proj.videoUrl || (proj.images && proj.images.some(isVideoMedia))) && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                                <Play className="w-2 h-2 fill-current" /> Video
                              </span>
                            )}
                            {proj.inProgress && (
                              <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/10">
                                WIP
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className={`font-bold text-base mt-2 transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'} line-clamp-1`}>
                          {proj.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 font-medium">
                          {proj.technologies?.slice(0, 3).join(' • ') || 'Technologies'}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div 
                          layoutId="active-console-indicator"
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-l-full"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE DETAILS PANEL (Desktop: 8-cols, Mobile: swipe deck) */}
              <div id="active-project-console" className="col-span-1 md:col-span-8">
                {/* Horizontal swipeable project directory for Mobile */}
                <div className="flex md:hidden overflow-x-auto gap-2.5 pb-4 pt-1 mb-2 px-1 scrollbar-none snap-x snap-mandatory">
                  {projects.map((proj, idx) => {
                    const isActive = idx === safeActiveIndex;
                    return (
                      <button
                        key={`mob-proj-${proj.id || idx}`}
                        onClick={() => {
                          setActiveIndex(idx);
                        }}
                        className={`flex-shrink-0 px-4.5 py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 snap-start flex items-center gap-2 ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/25 scale-102'
                            : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-blue-500'}`} />
                        <span>{proj.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile top pager dots and arrows overlay */}
                <div className="flex md:hidden items-center justify-between p-4 glass-md rounded-2xl border border-white/5 mb-6">
                  <button 
                    onClick={handlePrev}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-gray-700 dark:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="text-center font-mono text-xs uppercase tracking-wider">
                    <span className="text-blue-500 font-bold">{safeActiveIndex + 1}</span>
                    <span className="text-gray-500 px-1">/</span>
                    <span className="text-gray-400">{projects.length}</span>
                  </div>

                  <button 
                    onClick={handleNext}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-gray-700 dark:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Card Console container */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProject?.id || safeActiveIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="glass-md rounded-[2.5rem] border border-blue-500/15 overflow-hidden shadow-2xl relative"
                  >
                    {/* Laser line status scan */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500" />

                    {activeProject?.inProgress && (
                      <div className="absolute top-6 right-6 z-20">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
                          {t('inProgress')}
                        </span>
                      </div>
                    )}

                    {/* Multimedia Gallery Container */}
                    {(() => {
                      if (!activeProject) return null;
                      const displayMedia = getProjectDisplayMedia(
                        activeProject, 
                        settings?.showVideoThumbnailAsProjectImage,
                        activeProject.id ? detectedVideos[activeProject.id] : undefined
                      );
                      const videoIdx = displayMedia.allMedia.findIndex(isVideoMedia);

                      return (
                        <div className="aspect-video md:aspect-[21/9] bg-zinc-900 relative overflow-hidden group">
                          {displayMedia.pictureUrl ? (
                            <ImageViewer 
                              images={displayMedia.allMedia} 
                              label="Project Showcase"
                              initialIndex={displayMedia.hasVideo && videoIdx >= 0 ? videoIdx : 0}
                            >
                              <div className="relative w-full h-full cursor-pointer overflow-hidden">
                                {displayMedia.isDirectVideo ? (
                                  <video 
                                    src={`${displayMedia.pictureUrl}#t=0.001`} 
                                    preload="metadata" 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
                                  />
                                ) : (
                                  <img 
                                    src={displayMedia.pictureUrl} 
                                    alt={activeProject?.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                  />
                                )}
                                {displayMedia.hasVideo && (
                                  <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center gap-1.5 shadow-lg">
                                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Video Stream</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
                                  <div className="p-3.5 bg-black/70 rounded-full border border-white/20 scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    {displayMedia.hasVideo ? (
                                      <Play className="w-6 h-6 text-blue-400 fill-blue-400 ml-0.5" />
                                    ) : (
                                      <Sparkles className="w-6 h-6 text-blue-400" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </ImageViewer>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center opacity-20 text-white p-8">
                              <Shield className="w-16 h-16 text-blue-500 animate-pulse" />
                              <span className="text-[10px] uppercase tracking-[0.3em] font-mono mt-4">NO MEDIA ATTACHED</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Console Info */}
                    <div className="p-8 md:p-10 space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-black font-mono tracking-widest uppercase bg-blue-500/10 text-blue-500 px-3 py-1 rounded-md border border-blue-500/10">
                            {language === 'en' ? 'Active Target' : 'الهدف الحالي'}
                          </span>
                          <span className="text-[10px] font-black font-mono tracking-widest uppercase text-gray-400">
                            NODE_{String(safeActiveIndex + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                          {activeProject?.title}
                        </h3>

                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed max-w-3xl">
                          {activeProject?.description}
                        </p>
                      </div>

                      {/* Tech Spec Grid */}
                      <div className="pt-6 border-t border-white/5 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-500" />
                          <span>{language === 'en' ? 'System Specifications' : 'مواصفات النظام'}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(activeProject?.technologies || []).map((tag) => (
                            <span 
                              key={tag} 
                              className="text-[10px] font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Launch Actions */}
                      <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Gallery / Video toggle built inside if available */}
                        {(() => {
                          if (!activeProject) return null;
                          const displayMedia = getProjectDisplayMedia(
                            activeProject, 
                            settings?.showVideoThumbnailAsProjectImage,
                            activeProject.id ? detectedVideos[activeProject.id] : undefined
                          );
                          if (displayMedia.allMedia.length === 0) return null;
                          const videoIdx = displayMedia.allMedia.findIndex(isVideoMedia);
                          return (
                            <div className="flex items-center">
                              <ImageViewer 
                                images={displayMedia.allMedia} 
                                label="Project Gallery" 
                                initialIndex={displayMedia.hasVideo && videoIdx >= 0 ? videoIdx : 0}
                                triggerText={
                                  displayMedia.hasVideo
                                    ? (language === 'en' ? 'Watch Video & Gallery' : 'مشاهدة الفيديو والمعرض')
                                    : (language === 'en' ? 'Show Telemetry Gallery' : 'عرض معرض الصور')
                                } 
                              />
                            </div>
                          );
                        })()}

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:ml-auto justify-end">
                          {activeProject && (
                            <button 
                              onClick={() => copyShareLink(activeProject.id!)}
                              className="flex-1 sm:flex-initial px-5 py-3.5 flex items-center justify-center gap-2 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all border border-gray-300 dark:border-white/10 text-xs font-black uppercase tracking-wider h-[50px] rounded-2xl text-gray-800 dark:text-white shadow-sm hover:shadow"
                              title={language === 'en' ? 'Copy Share Link' : 'نسخ رابط المشاركة'}
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4 text-green-500 animate-pulse" />
                                  <span className="text-green-500">{language === 'en' ? 'Copied' : 'تم النسخ'}</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  <span>{language === 'en' ? 'Share' : 'مشاركة'}</span>
                                </>
                              )}
                            </button>
                          )}
                          {activeProject?.link?.url && (
                            <button 
                              onClick={() => openLink(activeProject.link!.url)} 
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider px-8 py-3.5 h-[50px] rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:opacity-95 transition-all shadow-[0_8px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.55)] hover:-translate-y-0.5 active:scale-95 duration-200"
                            >
                              <span>{activeProject.link.text || t('demo')}</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {activeProject?.githubLink && (
                            <button 
                              onClick={() => openLink(activeProject.githubLink!)} 
                              className="h-[50px] w-[50px] flex items-center justify-center bg-gray-950 hover:bg-black dark:bg-white/10 dark:hover:bg-white/15 border border-transparent dark:border-white/10 rounded-2xl text-white transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm hover:shadow"
                              title={language === 'en' ? 'Open Repository' : 'افتح كود المصدر'}
                            >
                              <Github className="w-5 h-5 text-gray-400 dark:text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* BENTO GRID MATRIX MODE */
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {projects.map((project, i) => {
                const displayMedia = getProjectDisplayMedia(
                  project, 
                  settings?.showVideoThumbnailAsProjectImage,
                  project.id ? detectedVideos[project.id] : undefined
                );
                const videoIdx = displayMedia.allMedia.findIndex(isVideoMedia);

                // First project takes slightly larger span on large screens for an asymmetric bento layout
                const isFeatured = i === 0 && projects.length > 1;

                return (
                  <motion.div
                    key={project.id || i}
                    id={`project-${project.id}`}
                    data-project-id={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                    className={`glass-md overflow-hidden rounded-[2.5rem] border border-white/5 flex flex-col h-full hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 group relative ${
                      isFeatured ? 'md:col-span-2' : ''
                    }`}
                  >
                    {project.inProgress && (
                      <div className="absolute inset-0 bg-[#0a0a0c]/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2.5rem]">
                        <div className="bg-blue-600 dark:bg-blue-500 text-white font-mono font-black text-xs uppercase tracking-[0.25em] px-5 py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                          {t('inProgress')}
                        </div>
                      </div>
                    )}

                    <div className="aspect-video bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                       {displayMedia.pictureUrl ? (
                         <ImageViewer 
                           images={displayMedia.allMedia} 
                           label="Project"
                           initialIndex={displayMedia.hasVideo && videoIdx >= 0 ? videoIdx : 0}
                         >
                           <div className="relative w-full h-full cursor-pointer overflow-hidden group">
                             {displayMedia.isDirectVideo ? (
                               <video 
                                 src={`${displayMedia.pictureUrl}#t=0.001`} 
                                 preload="metadata" 
                                 muted 
                                 playsInline 
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
                               />
                             ) : (
                               <img 
                                 src={displayMedia.pictureUrl} 
                                 alt={project.title} 
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                               />
                             )}
                             {displayMedia.hasVideo && (
                               <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center gap-1.5 shadow-lg">
                                 <Play className="w-3 h-3 fill-white text-white" />
                                 <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Video</span>
                               </div>
                             )}
                             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                               <div className="p-3 bg-black/70 rounded-full border border-white/20 scale-90 group-hover:scale-100 transition-all duration-300">
                                 {displayMedia.hasVideo ? <Play className="w-5 h-5 text-blue-400 fill-blue-400 ml-0.5" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
                               </div>
                             </div>
                           </div>
                         </ImageViewer>
                       ) : (
                         <div className="w-full h-full flex items-center justify-center opacity-20">
                           <Shield className="w-16 h-16" />
                         </div>
                       )}
                    </div>

                    <div className="p-8 flex-1 space-y-6 flex flex-col">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black font-mono tracking-widest text-blue-500">
                            NODE_{String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">
                            #{project.order ?? i}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      <div className="pt-4 flex flex-wrap gap-1.5">
                        {(project.technologies || []).slice(0, 5).map((tag) => (
                          <span 
                            key={tag} 
                            className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-4 flex flex-col space-y-4 border-t border-white/5">
                        {displayMedia.allMedia.length > 0 && (
                          <ImageViewer 
                            images={displayMedia.allMedia} 
                            label="Project" 
                            initialIndex={displayMedia.hasVideo && videoIdx >= 0 ? videoIdx : 0}
                            triggerText={
                              displayMedia.hasVideo
                                ? (language === 'en' ? 'Watch Video & Gallery' : 'مشاهدة الفيديو والمعرض')
                                : (language === 'en' ? 'Show Gallery' : 'عرض معرض الصور')
                            } 
                          />
                        )}
                        
                        <div className="flex items-center justify-between">
                          {project.link?.url && (
                            <button 
                              onClick={() => openLink(project.link!.url)} 
                              className="flex items-center space-x-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-colors"
                            >
                              <span>{project.link.text || t('demo')}</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {project.githubLink && (
                            <button 
                              onClick={() => openLink(project.githubLink!)} 
                              className="p-2 glass-sm rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all ml-auto"
                              title="GitHub Code"
                            >
                              <Github className="w-5 h-5 text-gray-700 dark:text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </PageWrapper>
  );
}

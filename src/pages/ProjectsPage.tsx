import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  Github,
  Shield,
  LayoutGrid,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Share2,
  Check,
  Play,
  ZoomIn
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Project, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import ScrambleHeader from '../components/ScrambleHeader';
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
      setError('Failed to load project database.');
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'projects');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn('Settings fetch failed, using fallbacks', err);
    });

    return () => {
      unsubProjects();
      unsubSettings();
    };
  }, []);

  const safeActiveIndex = Math.max(0, Math.min(activeIndex, projects.length - 1));
  const activeProject = projects[safeActiveIndex];

  const findProjectIndex = (queryStr: string): number => {
    if (!queryStr || projects.length === 0) return -1;
    const q = queryStr.toLowerCase().trim();
    const exactId = projects.findIndex(p => p.id === queryStr);
    if (exactId !== -1) return exactId;

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

  useEffect(() => {
    if (!loading && projects.length > 0) {
      const projectId = searchParams.get('project') || searchParams.get('projectId');
      if (projectId) {
        const foundIndex = findProjectIndex(projectId);
        if (foundIndex !== -1) {
          setViewMode('console');
          setActiveIndex(foundIndex);
          setTimeout(() => {
            const el = document.getElementById('active-project-console');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('cyber-teleport-glow');
              setTimeout(() => el.classList.remove('cyber-teleport-glow'), 3500);
            }
          }, 200);
        }
      }
      setIsInitialized(true);
    }
  }, [loading, projects, searchParams]);

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

  return (
    <PageWrapper className="space-y-12 py-6 sm:py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase text-gray-900 dark:text-white">
          <ScrambleHeader text={t('secLab')} as="span" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.34 }}
          className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium text-sm sm:text-base"
        >
          {settings?.projectsSubtitle || 'A showcase of specialized environments and tools built to simulate, detect, and respond to modern cyber threats.'}
        </motion.p>
      </div>

      {/* Switcher Controls */}
      <div className="flex justify-center pt-1">
        <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center gap-1">
          <button
            onClick={() => setViewMode('console')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
              viewMode === 'console' ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {viewMode === 'console' && (
              <motion.div
                layoutId="active-view-tab"
                className="absolute inset-0 bg-blue-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <Terminal className="w-4 h-4" />
              {language === 'en' ? 'Console View' : 'منصة العرض'}
            </span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors relative cursor-pointer ${
              viewMode === 'grid' ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {viewMode === 'grid' && (
              <motion.div
                layoutId="active-view-tab"
                className="absolute inset-0 bg-blue-600 rounded-xl"
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <LayoutGrid className="w-4 h-4" />
              {language === 'en' ? 'Grid View' : 'عرض الشبكة'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="text-center text-sm text-red-500 font-medium">{error}</div>
      )}

      {/* Primary Display Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="hidden md:block md:col-span-4 space-y-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="glass-sm p-5 rounded-2xl animate-pulse space-y-2.5">
                <div className="h-3 w-12 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-white/10 rounded" />
              </div>
            ))}
          </div>
          <div className="col-span-1 md:col-span-8 glass-md rounded-3xl overflow-hidden animate-pulse">
            <div className="aspect-video md:aspect-[21/9] bg-gray-200 dark:bg-white/5" />
            <div className="p-6 sm:p-8 space-y-4">
              <div className="h-8 w-2/3 bg-gray-200 dark:bg-white/10 rounded-lg" />
              <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 font-mono text-xs uppercase tracking-widest text-gray-500">
          No projects configured yet.
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'console' ? (
            <motion.div
              key="console-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
            >
              {/* DESKTOP SIDEBAR SWITCHER (md and up only) */}
              <div className="hidden md:block md:col-span-4 space-y-3 max-h-[600px] overflow-y-auto pe-2 custom-scrollbar">
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 px-2 mb-3">
                  Project Directory
                </div>
                {projects.map((proj, idx) => {
                  const isActive = idx === safeActiveIndex;
                  return (
                    <motion.button
                      key={proj.id || idx}
                      whileHover={{ x: language === 'ar' ? -4 : 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActiveIndex(idx)}
                      className="w-full text-start relative transition-colors duration-200 cursor-pointer block"
                    >
                      <div className={`relative p-5 rounded-2xl border text-start transition-colors duration-200 ${
                        isActive
                          ? 'border-blue-500 shadow-md text-gray-900 dark:text-white'
                          : 'bg-white dark:bg-zinc-900/40 hover:bg-gray-50 dark:hover:bg-zinc-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                      }`}>
                        {isActive && (
                          <motion.div
                            layoutId="active-project-dir"
                            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                            className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-blue-500/12 pointer-events-none"
                          />
                        )}
                        <div className="relative z-10 flex justify-between items-center gap-2 text-xs font-mono">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                            {(proj.videoUrl || (proj.images && proj.images.some(isVideoMedia))) && (
                              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
                                <Play className="w-3 h-3 fill-current" /> Video
                              </span>
                            )}
                            {proj.inProgress && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                In Progress
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className={`relative z-10 font-bold text-base mt-2 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'} line-clamp-1`}>
                          {proj.title}
                        </h4>
                        <p className="relative z-10 text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {proj.technologies?.slice(0, 3).join(' · ') || 'Project'}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* ACTIVE DETAILS PANEL */}
              <div id="active-project-console" className="col-span-1 md:col-span-8">
                {/* Horizontal swipeable project directory for Mobile */}
                <div className="flex md:hidden overflow-x-auto gap-2.5 pb-3 mb-2 px-1 no-scrollbar snap-x snap-mandatory">
                  {projects.map((proj, idx) => {
                    const isActive = idx === safeActiveIndex;
                    return (
                      <button
                        key={`mob-proj-${proj.id || idx}`}
                        onClick={() => setActiveIndex(idx)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors snap-start cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-blue-600 text-white border-transparent shadow-md'
                            : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {proj.title}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile top pager */}
                <div className="flex md:hidden items-center justify-between p-3 glass-md rounded-2xl border border-gray-200 dark:border-white/10 mb-5">
                  <button
                    onClick={handlePrev}
                    className="p-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl active:scale-95 transition-all text-gray-700 dark:text-white cursor-pointer"
                    aria-label="Previous project"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="text-center font-mono text-xs tabular-nums">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{safeActiveIndex + 1}</span>
                    <span className="text-gray-400 px-1">/</span>
                    <span className="text-gray-500 dark:text-gray-400">{projects.length}</span>
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl active:scale-95 transition-all text-gray-700 dark:text-white cursor-pointer"
                    aria-label="Next project"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Card Console container */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProject?.id || safeActiveIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="glass-md rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl relative"
                  >
                    <div className="h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />

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
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                  />
                                ) : (
                                  <img
                                    src={displayMedia.pictureUrl}
                                    alt={activeProject?.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                )}
                                {displayMedia.hasVideo && (
                                  <div className="absolute top-4 start-4 z-20 px-3 py-1 rounded-lg bg-black/80 text-white flex items-center gap-1.5 text-xs font-mono">
                                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                                    <span>Video</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors duration-300 flex items-center justify-center">
                                  <div className="p-3 bg-black/75 rounded-full border border-white/20 scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    {displayMedia.hasVideo ? (
                                      <Play className="w-6 h-6 text-blue-400 fill-blue-400" />
                                    ) : (
                                      <ZoomIn className="w-6 h-6 text-white" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </ImageViewer>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8">
                              <Shield className="w-14 h-14 text-blue-500/40" />
                              <span className="text-xs font-mono mt-3 text-gray-400">No media attached</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Console Info */}
                    <div className="p-6 sm:p-8 md:p-10 space-y-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {String(safeActiveIndex + 1).padStart(2, '0')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{language === 'en' ? 'Project Overview' : 'تفاصيل المشروع'}</span>
                          {activeProject?.inProgress && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">{t('inProgress')}</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                          {activeProject?.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed max-w-3xl">
                          {activeProject?.description}
                        </p>
                      </div>

                      {/* Tech Spec */}
                      <div className="pt-5 border-t border-gray-200/80 dark:border-white/10 space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{language === 'en' ? 'Technologies' : 'التقنيات المستخدمة'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-mono text-gray-700 dark:text-gray-300">
                          {(activeProject?.technologies || []).map((tag, idx) => (
                            <span key={tag} className="inline-flex items-center gap-3">
                              {idx > 0 && <span className="text-gray-400" aria-hidden="true">·</span>}
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Launch Actions */}
                      <div className="pt-5 border-t border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                    : (language === 'en' ? 'Show Gallery' : 'عرض معرض الصور')
                                }
                              />
                            </div>
                          );
                        })()}

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:ms-auto justify-end">
                          {activeProject && (
                            <button
                              onClick={() => copyShareLink(activeProject.id!)}
                              className="flex-1 sm:flex-initial px-5 py-3 flex items-center justify-center gap-2 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider h-[46px] rounded-xl text-gray-800 dark:text-white cursor-pointer"
                              title={language === 'en' ? 'Copy Share Link' : 'نسخ رابط المشاركة'}
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">{language === 'en' ? 'Copied' : 'تم النسخ'}</span>
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
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider px-6 py-3 h-[46px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                              <span>{activeProject.link.text || t('demo')}</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {activeProject?.githubLink && (
                            <button
                              onClick={() => openLink(activeProject.githubLink!)}
                              className="h-[46px] w-[46px] flex items-center justify-center bg-gray-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/15 border border-transparent dark:border-white/10 rounded-xl text-white transition-colors cursor-pointer"
                              title={language === 'en' ? 'Open Repository' : 'افتح كود المصدر'}
                              aria-label="Open GitHub repository"
                            >
                              <Github className="w-5 h-5" />
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
            /* GRID MODE */
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {projects.map((project, i) => {
                const displayMedia = getProjectDisplayMedia(
                  project,
                  settings?.showVideoThumbnailAsProjectImage,
                  project.id ? detectedVideos[project.id] : undefined
                );
                const videoIdx = displayMedia.allMedia.findIndex(isVideoMedia);
                const isFeatured = i === 0 && projects.length > 1;

                return (
                  <motion.div
                    key={project.id || i}
                    id={`project-${project.id}`}
                    data-project-id={project.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{ delay: (i % 3) * 0.05, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -5 }}
                    className={`glass-md overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col h-full hover:shadow-xl hover:border-blue-500/40 transition-colors duration-300 group relative ${
                      isFeatured ? 'md:col-span-2' : ''
                    }`}
                  >
                    {project.inProgress && (
                      <div className="absolute top-3 end-3 z-20 bg-amber-500 text-white font-mono font-bold text-[11px] uppercase px-3 py-1 rounded-lg shadow">
                        {t('inProgress')}
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
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                              />
                            ) : (
                              <img
                                src={displayMedia.pictureUrl}
                                alt={project.title}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                            {displayMedia.hasVideo && (
                              <div className="absolute top-3 start-3 z-10 px-2.5 py-1 rounded-lg bg-black/80 text-white flex items-center gap-1.5 text-[11px] font-mono">
                                <Play className="w-3 h-3 fill-white text-white" />
                                <span>Video</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="p-3 bg-black/75 rounded-full border border-white/20">
                                {displayMedia.hasVideo ? <Play className="w-5 h-5 text-blue-400 fill-blue-400" /> : <ZoomIn className="w-5 h-5 text-white" />}
                              </div>
                            </div>
                          </div>
                        </ImageViewer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Shield className="w-12 h-12 opacity-30" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 sm:p-8 flex-1 space-y-5 flex flex-col">
                      <div className="flex-1 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-mono text-gray-500 dark:text-gray-400 tabular-nums">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>#{project.order ?? i}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                      </div>

                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2.5 gap-y-1">
                        {(project.technologies || []).slice(0, 5).map((tag, idx) => (
                          <span key={tag} className="inline-flex items-center gap-2.5">
                            {idx > 0 && <span aria-hidden="true">·</span>}
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>

                      <div className="pt-4 flex flex-col space-y-3 border-t border-gray-200/80 dark:border-white/10">
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
                              className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              <span>{project.link.text || t('demo')}</span>
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {project.githubLink && (
                            <button
                              onClick={() => openLink(project.githubLink!)}
                              className="p-2 glass-sm rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ms-auto cursor-pointer"
                              title="GitHub Code"
                              aria-label="Open GitHub repository"
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

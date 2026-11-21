import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, MapPin, Calendar, CheckCircle2, ExternalLink } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Experience, AppSettings } from '../types';
import Typewriter from '../components/Typewriter';
import ScrambleHeader from '../components/ScrambleHeader';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import { useLanguage } from '../context/LanguageContext';

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Experience';

    const q = query(collection(db, 'experiences'), orderBy('order', 'asc'));
    const unsubExp = onSnapshot(q, (snapshot) => {
      setExperiences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Experience)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError("Failed to load experience data.");
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'experiences');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn("Settings fetch failed, using fallbacks", err);
    });

    return () => {
      unsubExp();
      unsubSettings();
    };
  }, []);

  // Handle deep-link scrolling via query parameter ?exp=...
  useEffect(() => {
    if (!loading && experiences.length > 0) {
      const expParam = searchParams.get('exp');
      if (expParam) {
        const target = expParam.toLowerCase().trim();
        setTimeout(() => {
          let el = document.getElementById(`exp-${target}`) || 
                   document.querySelector(`[data-exp-alias="${target}"]`) ||
                   document.querySelector(`[data-exp-name*="${target}"]`);
          
          if (!el) {
            if (target.includes('solar') || target.includes('aidaroos')) el = document.getElementById('exp-solar');
            else if (target.includes('tamkeen')) el = document.getElementById('exp-tamkeen');
            else if (target.includes('newtek')) el = document.getElementById('exp-newtek');
          }

          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('cyber-teleport-glow');
            setTimeout(() => el.classList.remove('cyber-teleport-glow'), 3500);
          }
        }, 300);
      }
    }
  }, [loading, experiences, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('retrievingExperience')} speed={20} />
      </div>
    );
  }

  return (
    <PageWrapper className="max-w-6xl mx-auto space-y-12 md:space-y-16 py-8 md:py-12 px-2 sm:px-4 overflow-hidden">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic">
          <ScrambleHeader text={t('journey')} />
        </h1>
        <div className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-medium text-sm md:text-base">
          <Typewriter key={settings?.experienceSubtitle || "default"} text={settings?.experienceSubtitle || "Establishing secure foundations and optimizing technical operations across various environments."} delay={800} />
        </div>
      </div>

      {/* Beautiful Vertical Alternating Timeline Container */}
      <div className="relative w-full max-w-5xl mx-auto py-6 md:py-12">
        {/* Central Vertical Line Track (shifts to left on mobile) */}
        <div className="absolute left-4 sm:left-8 md:left-1/2 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-500/10 via-blue-500/50 to-blue-500/10 -translate-x-1/2 shadow-[0_0_12px_rgba(59,130,246,0.25)]" />

        <div className="space-y-12 sm:space-y-16 md:space-y-24 relative">
          {experiences.map((exp, i) => {
            const isLeft = i % 2 === 0;

            return (
              <div 
                key={exp.id || i} 
                className="relative min-h-[160px] flex items-center"
              >
                {/* Center Node Dot */}
                <div className="absolute left-4 sm:left-8 md:left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F2F2F7] dark:bg-[#0c0c0e] border border-blue-500/20 dark:border-blue-500/40 shadow-xl flex items-center justify-center">
                    <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-500 border-2 border-white dark:border-black shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse" />
                  </div>
                </div>

                {/* Symmetrical Grid for Left/Right Alternation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-24 w-full">
                  
                  {/* Left Column Card Container */}
                  <div className={`pl-11 sm:pl-16 md:pl-0 flex justify-end items-center ${
                    isLeft ? 'order-1' : 'order-2 md:opacity-0 pointer-events-none hidden md:flex'
                  }`}>
                    {isLeft && (
                      <motion.div
                        id={((exp.company || '').toLowerCase().includes('solar') || (exp.company || '').toLowerCase().includes('aidaroos')) ? 'exp-solar' : ((exp.company || '').toLowerCase().includes('tamkeen')) ? 'exp-tamkeen' : ((exp.company || '').toLowerCase().includes('newtek')) ? 'exp-newtek' : `exp-${exp.id || i}`}
                        data-exp-alias={((exp.company || '').toLowerCase().includes('solar') || (exp.company || '').toLowerCase().includes('aidaroos')) ? 'exp-solar' : ((exp.company || '').toLowerCase().includes('tamkeen')) ? 'exp-tamkeen' : ((exp.company || '').toLowerCase().includes('newtek')) ? 'exp-newtek' : `exp-${exp.id || i}`}
                        data-exp-name={(exp.company || '').toLowerCase()}
                        initial={{ opacity: 0, x: -50, scale: 0.95 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        viewport={{ once: false, margin: "-10%" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-lg relative"
                      >
                        {/* Horizontal connector line for desktop linking card to the central track */}
                        <div className="absolute right-[-48px] top-1/2 -translate-y-1/2 w-[48px] h-[2px] bg-gradient-to-r from-blue-500/30 to-blue-500 hidden md:block" />
                        
                        <div className="glass-md p-5 sm:p-6 rounded-3xl sm:rounded-[2rem] hover:shadow-2xl hover:border-blue-500/20 dark:hover:border-blue-500/30 transition-all duration-300 space-y-4 border border-gray-200/80 dark:border-white/5 bg-white/75 dark:bg-white/[0.02] text-start">
                          <div className="flex items-start gap-4">
                            {exp.imageUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden glass-sm flex-shrink-0 bg-gray-50 dark:bg-white/5 flex items-center justify-center p-1.5 border border-gray-200 dark:border-white/10">
                                <img src={exp.imageUrl} alt={exp.company} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-extrabold text-blue-500 leading-tight uppercase tracking-tight">{exp.position}</h3>
                              <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-0.5">{exp.company}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-white/5 pb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>{exp.period}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{exp.location}</span>
                            </div>
                          </div>

                          <div className="space-y-3 pt-1">
                            {(exp.bullets || []).map((bullet, j) => (
                              <div key={j} className="flex items-start space-x-2.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>

                          {exp.description && (
                            <p className="text-xs text-gray-500 italic border-l-2 border-blue-500/20 pl-3 py-0.5 leading-relaxed">
                              {exp.description}
                            </p>
                          )}

                          {exp.images && exp.images.length > 0 && (
                            <div className="pt-2">
                              <ImageViewer images={exp.images} label="Experience" triggerText="Show Experience Documents" />
                            </div>
                          )}

                          {exp.link?.url && (
                            <div className="pt-2">
                              <button 
                                onClick={() => openLink(exp.link!.url)} 
                                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
                              >
                                <span>{exp.link.text || 'View Resources'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column Card Container */}
                  <div className={`pl-11 sm:pl-16 md:pl-0 flex justify-start items-center ${
                    !isLeft ? 'order-2' : 'order-1 md:opacity-0 pointer-events-none hidden md:flex'
                  }`}>
                    {!isLeft && (
                      <motion.div
                        id={((exp.company || '').toLowerCase().includes('solar') || (exp.company || '').toLowerCase().includes('aidaroos')) ? 'exp-solar' : ((exp.company || '').toLowerCase().includes('tamkeen')) ? 'exp-tamkeen' : ((exp.company || '').toLowerCase().includes('newtek')) ? 'exp-newtek' : `exp-${exp.id || i}`}
                        data-exp-alias={((exp.company || '').toLowerCase().includes('solar') || (exp.company || '').toLowerCase().includes('aidaroos')) ? 'exp-solar' : ((exp.company || '').toLowerCase().includes('tamkeen')) ? 'exp-tamkeen' : ((exp.company || '').toLowerCase().includes('newtek')) ? 'exp-newtek' : `exp-${exp.id || i}`}
                        data-exp-name={(exp.company || '').toLowerCase()}
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        whileInView={{ opacity: 1, x: 0, scale: 1 }}
                        viewport={{ once: false, margin: "-10%" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-lg relative"
                      >
                        {/* Horizontal connector line for desktop linking card to the central track */}
                        <div className="absolute left-[-48px] top-1/2 -translate-y-1/2 w-[48px] h-[2px] bg-gradient-to-l from-blue-500/30 to-blue-500 hidden md:block" />

                        <div className="glass-md p-5 sm:p-6 rounded-3xl sm:rounded-[2rem] hover:shadow-2xl hover:border-blue-500/20 dark:hover:border-blue-500/30 transition-all duration-300 space-y-4 border border-gray-200/80 dark:border-white/5 bg-white/75 dark:bg-white/[0.02] text-start">
                          <div className="flex items-start gap-4">
                            {exp.imageUrl && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden glass-sm flex-shrink-0 bg-gray-50 dark:bg-white/5 flex items-center justify-center p-1.5 border border-gray-200 dark:border-white/10">
                                <img src={exp.imageUrl} alt={exp.company} loading="lazy" decoding="async" className="w-full h-full object-contain" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-extrabold text-blue-500 leading-tight uppercase tracking-tight">{exp.position}</h3>
                              <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-0.5">{exp.company}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-white/5 pb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>{exp.period}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{exp.location}</span>
                            </div>
                          </div>

                          <div className="space-y-3 pt-1">
                            {(exp.bullets || []).map((bullet, j) => (
                              <div key={j} className="flex items-start space-x-2.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>

                          {exp.description && (
                            <p className="text-xs text-gray-500 italic border-l-2 border-blue-500/20 pl-3 py-0.5 leading-relaxed">
                              {exp.description}
                            </p>
                          )}

                          {exp.images && exp.images.length > 0 && (
                            <div className="pt-2">
                              <ImageViewer images={exp.images} label="Experience" triggerText="Show Experience Documents" />
                            </div>
                          )}

                          {exp.link?.url && (
                            <div className="pt-2">
                              <button 
                                onClick={() => openLink(exp.link!.url)} 
                                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
                              >
                                <span>{exp.link.text || 'View Resources'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-sm p-8 rounded-3xl text-center border-dashed border-2 border-gray-200 dark:border-white/10 max-w-4xl mx-auto">
        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl w-fit mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 italic">
          Additional roles and projects available upon request as part of the full laboratory experience.
        </p>
      </div>
    </PageWrapper>
  );
}

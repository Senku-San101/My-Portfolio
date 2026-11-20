import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, MapPin, Calendar, CheckCircle2, ExternalLink } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Experience, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import ScrambleHeader from '../components/ScrambleHeader';
import { useLanguage } from '../context/LanguageContext';

function getExpAlias(exp: Experience, i: number) {
  const company = (exp.company || '').toLowerCase();
  if (company.includes('solar') || company.includes('aidaroos')) return 'exp-solar';
  if (company.includes('tamkeen')) return 'exp-tamkeen';
  if (company.includes('newtek')) return 'exp-newtek';
  return `exp-${exp.id || i}`;
}

function ExperienceCard({ exp }: { exp: Experience }) {
  return (
    <div className="glass-md p-6 rounded-3xl hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 space-y-4 border border-gray-200 dark:border-white/10 text-start">
      <div className="flex items-start gap-4">
        {exp.imageUrl && (
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5 flex items-center justify-center p-1.5 border border-gray-200 dark:border-white/10">
            <img src={exp.imageUrl} alt={exp.company} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-extrabold text-blue-600 dark:text-blue-400 leading-tight uppercase tracking-tight">{exp.position}</h3>
          <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-0.5">{exp.company}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200/70 dark:border-white/10 pb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
          <span>{exp.period}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <span>{exp.location}</span>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {(exp.bullets || []).map((bullet, j) => (
          <div key={j} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>

      {exp.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-gray-100/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/5 rounded-xl px-3.5 py-2.5 leading-relaxed">
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span>{exp.link.text || 'View Resources'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Experience';

    const q = query(collection(db, 'experiences'), orderBy('order', 'asc'));
    const unsubExp = onSnapshot(q, (snapshot) => {
      setExperiences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Experience)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'experiences');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn('Settings fetch failed, using fallbacks', err);
    });

    return () => {
      unsubExp();
      unsubSettings();
    };
  }, []);

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
        }, 200);
      }
    }
  }, [loading, experiences, searchParams]);

  return (
    <PageWrapper className="max-w-6xl mx-auto space-y-14 py-8 px-4 overflow-x-clip">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase text-gray-900 dark:text-white">
          <ScrambleHeader text={t('journey')} as="span" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto font-medium text-sm md:text-base"
        >
          {settings?.experienceSubtitle || 'Establishing secure foundations and optimizing technical operations across various environments.'}
        </motion.p>
      </div>

      {/* Vertical Alternating Timeline Container */}
      <div className="relative w-full max-w-5xl mx-auto py-8">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="origin-top absolute start-6 md:start-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/15 via-blue-500/50 to-blue-500/15 -translate-x-1/2 rtl:translate-x-1/2"
        />

        {loading ? (
          <div className="space-y-10 relative ps-14 md:ps-0">
            {[0, 1].map((idx) => (
              <div key={idx} className="max-w-lg glass-md p-6 rounded-3xl animate-pulse space-y-4">
                <div className="h-5 w-1/2 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12 md:space-y-20 relative">
            {experiences.map((exp, i) => {
              const isLeft = i % 2 === 0;
              const alias = getExpAlias(exp, i);
              const slideOffset = isLeft ? (isRtl ? 26 : -26) : (isRtl ? -26 : 26);

              return (
                <div
                  key={exp.id || i}
                  className="relative min-h-[140px] flex items-center"
                >
                  {/* Center Node Dot */}
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="absolute start-6 md:start-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-20 flex items-center justify-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#F2F2F7] dark:bg-[#0c0c0e] border border-blue-500/30 shadow-md flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-black" />
                    </div>
                  </motion.div>

                  {/* Symmetrical Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 w-full">
                    {/* Start Column */}
                    <div className={`ps-14 md:ps-0 flex justify-end items-center ${
                      isLeft ? 'order-1' : 'order-2 md:opacity-0 pointer-events-none hidden md:flex'
                    }`}>
                      {isLeft && (
                        <motion.div
                          id={alias}
                          data-exp-alias={alias}
                          data-exp-name={(exp.company || '').toLowerCase()}
                          initial={{ opacity: 0, x: slideOffset, y: 12 }}
                          whileInView={{ opacity: 1, x: 0, y: 0 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                          whileHover={{ y: -4 }}
                          className="w-full max-w-lg relative"
                        >
                          <div className="hidden md:block absolute end-[-48px] top-1/2 -translate-y-1/2 w-[48px] h-[2px] bg-blue-500/40" />
                          <ExperienceCard exp={exp} />
                        </motion.div>
                      )}
                    </div>

                    {/* End Column */}
                    <div className={`ps-14 md:ps-0 flex justify-start items-center ${
                      !isLeft ? 'order-2' : 'order-1 md:opacity-0 pointer-events-none hidden md:flex'
                    }`}>
                      {!isLeft && (
                        <motion.div
                          id={alias}
                          data-exp-alias={alias}
                          data-exp-name={(exp.company || '').toLowerCase()}
                          initial={{ opacity: 0, x: slideOffset, y: 12 }}
                          whileInView={{ opacity: 1, x: 0, y: 0 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                          whileHover={{ y: -4 }}
                          className="w-full max-w-lg relative"
                        >
                          <div className="hidden md:block absolute start-[-48px] top-1/2 -translate-y-1/2 w-[48px] h-[2px] bg-blue-500/40" />
                          <ExperienceCard exp={exp} />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-sm p-8 rounded-3xl text-center border-dashed border-2 border-gray-200 dark:border-white/10 max-w-4xl mx-auto">
        <div className="p-3.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mx-auto mb-3">
          <Briefcase className="w-7 h-7 text-gray-500 dark:text-gray-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 italic text-sm">
          Additional roles and projects available upon request as part of the full laboratory experience.
        </p>
      </div>
    </PageWrapper>
  );
}

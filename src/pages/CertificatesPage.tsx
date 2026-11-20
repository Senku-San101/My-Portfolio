import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Calendar, ExternalLink, ShieldCheck, Eye, BookOpen, X, DollarSign } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Certificate, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import ScrambleHeader from '../components/ScrambleHeader';
import { useLanguage } from '../context/LanguageContext';

function AnimatedCounter({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 600;
    let rafId = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      setCount(Math.floor(value * easeOutQuad(progressRatio)));

      if (progress < duration) {
        rafId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return <span className="tabular-nums">{prefix}{count.toLocaleString()}</span>;
}

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const getCertAnchor = (cert: Certificate) => {
    const name = (cert.name || '').toLowerCase();
    if (name.includes('mcbta') || name.includes('multi-cloud')) return 'cert-mcbta';
    if (name.includes('c3sa') || name.includes('certified cyber security analyst')) return 'cert-c3sa';
    if (name.includes('btf') || name.includes('blue team fundamentals')) return 'cert-btf';
    if (name.includes('apisec') || name.includes('api')) return 'cert-apisec';
    if (name.includes('jvp') || name.includes('junior vulnerability')) return 'cert-jvp';
    return `cert-${cert.id || name.replace(/[^a-z0-9]/g, '-')}`;
  };

  useEffect(() => {
    if (selectedCert) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCert]);

  useEffect(() => {
    const q = query(collection(db, 'certificates'), orderBy('order', 'asc'));
    const unsubCerts = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certificate)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'certificates');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn('Settings fetch failed, using fallbacks', err);
    });

    return () => {
      unsubCerts();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!loading && items.length > 0) {
      const certParam = searchParams.get('cert') || searchParams.get('id');
      if (certParam) {
        const q = certParam.toLowerCase().trim();
        setTimeout(() => {
          let el = document.getElementById(`cert-${q}`) ||
                   document.querySelector(`[data-cert-alias="${q}"]`) ||
                   document.querySelector(`[data-cert-name*="${q}"]`);

          if (!el) {
            if (q.includes('mcbta') || q.includes('multi-cloud')) el = document.getElementById('cert-mcbta');
            else if (q.includes('c3sa')) el = document.getElementById('cert-c3sa');
            else if (q.includes('btf')) el = document.getElementById('cert-btf');
            else if (q.includes('apisec') || q.includes('api')) el = document.getElementById('cert-apisec');
            else if (q.includes('jvp')) el = document.getElementById('cert-jvp');
          }

          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('cyber-teleport-glow');
            setTimeout(() => el.classList.remove('cyber-teleport-glow'), 3500);
          }
        }, 200);
      }
    }
  }, [loading, items, searchParams]);

  useEffect(() => {
    if (selectedCert) {
      document.title = `Certificates | ${selectedCert.name}`;
    } else {
      document.title = 'Abdulrahman Kamal | Certificates';
    }
  }, [selectedCert]);

  const certCount = items.length;
  const totalWorth = items.reduce((acc, c) => acc + (c.worth || 0), 0);

  return (
    <PageWrapper className="space-y-12 py-6 sm:py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase text-gray-900 dark:text-white">
          <ScrambleHeader text={t('verifiedCerts')} as="span" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.34 }}
          className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium text-sm sm:text-base"
        >
          {settings?.certificatesSubtitle || 'Continual professional development and validation of expertise in cybersecurity and systems engineering.'}
        </motion.p>
      </div>

      {/* Stats Counter Section */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 max-w-xl mx-auto">
        <motion.div
          id="stat-count-certs"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.32 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="glass-md w-full sm:w-1/2 p-6 rounded-3xl border border-gray-200 dark:border-blue-500/15 flex flex-col items-center justify-center text-center space-y-2 hover:border-blue-500/35 transition-colors"
        >
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
            <AnimatedCounter value={certCount} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {language === 'en' ? 'Verified Credentials' : 'شهادات معتمدة'}
          </p>
        </motion.div>

        <motion.div
          id="stat-worth-certs"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.32 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="glass-md w-full sm:w-1/2 p-6 rounded-3xl border border-gray-200 dark:border-emerald-500/15 flex flex-col items-center justify-center text-center space-y-2 hover:border-emerald-500/35 transition-colors"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            <AnimatedCounter value={totalWorth} prefix="$" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {language === 'en' ? 'Worth' : 'القيمة'}
          </p>
        </motion.div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="glass-md rounded-3xl overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-white/5" />
              <div className="p-6 sm:p-8 space-y-4">
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded" />
                <div className="h-10 w-full bg-gray-200 dark:bg-white/10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {items.map((cert, i) => {
            const anchorId = getCertAnchor(cert);
            const imagesList = cert.images && cert.images.length > 0
              ? cert.images
              : (cert.imageUrl ? [cert.imageUrl] : []);

            return (
              <motion.div
                key={cert.id}
                id={anchorId}
                data-cert-alias={anchorId}
                data-cert-name={(cert.name || '').toLowerCase()}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ delay: (i % 3) * 0.05, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5 }}
                className="glass-md overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 flex flex-col hover:shadow-xl hover:border-blue-500/35 transition-colors duration-300 group relative"
              >
                {cert.inProgress && (
                  <div className="absolute top-3 end-3 z-20 bg-amber-500 text-white font-mono font-bold text-[11px] uppercase px-3 py-1 rounded-lg shadow">
                    {t('inProgress')}
                  </div>
                )}

                <div className="h-48 bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                  {imagesList.length > 0 ? (
                    <ImageViewer images={imagesList} label="Certificate">
                      <img
                        src={imagesList[0]}
                        alt={cert.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </ImageViewer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Award className="w-16 h-16 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-4 start-4 glass-xl p-2 rounded-xl text-blue-600 dark:text-blue-400 z-20 pointer-events-none">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold leading-snug text-gray-900 dark:text-white">{cert.name}</h3>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">{cert.issuer}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{cert.date}</span>
                    </div>
                    {cert.credentialId && (
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 p-2.5 rounded-lg break-all">
                        ID: {cert.credentialId}
                      </p>
                    )}

                    <div className="pt-2 flex flex-col gap-2.5">
                      {imagesList.length > 0 && (
                        <ImageViewer images={imagesList} label="Certificate">
                          <button className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98] text-gray-900 dark:text-gray-100 font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-wider border border-gray-200 dark:border-white/10">
                            <Eye className="w-4 h-4" />
                            <span>Show Certificate/Badge</span>
                          </button>
                        </ImageViewer>
                      )}

                      {cert.description && (
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer shadow-md text-xs uppercase tracking-wider"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {cert.link?.url && (
                    <div className="mt-5 pt-4 border-t border-gray-200/70 dark:border-white/10">
                      <button
                        onClick={() => openLink(cert.link!.url)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <span>{cert.link.text || 'Verify Credential'}</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Certificate Details Modal Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedCert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSelectedCert(null);
              }}
              tabIndex={0}
            >
              <button
                onClick={() => setSelectedCert(null)}
                className="fixed top-4 end-4 sm:top-6 sm:end-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110] cursor-pointer"
                aria-label="Close certificate details"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </button>

              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="w-full max-w-4xl h-[90vh] bg-white dark:bg-[#0c0c0e] rounded-3xl overflow-y-auto shadow-2xl relative border border-gray-200 dark:border-white/10 flex flex-col custom-scrollbar"
              >
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {(() => {
                    const imagesList = selectedCert.images && selectedCert.images.length > 0
                      ? selectedCert.images
                      : (selectedCert.imageUrl ? [selectedCert.imageUrl] : []);

                    return (
                      <div className="flex flex-col">
                        {imagesList.length > 0 && (
                          <div className="w-full h-[38vh] sm:h-[45vh] bg-gray-100 dark:bg-white/5 relative overflow-hidden border-b border-gray-200 dark:border-white/10 flex items-center justify-center p-6 md:p-10">
                            <img
                              src={imagesList[0]}
                              alt={selectedCert.name}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                            />
                          </div>
                        )}

                        <div className="p-6 sm:p-8 md:p-12 space-y-8">
                          <div className="space-y-4 border-b border-gray-200 dark:border-white/10 pb-6">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                              <span className="text-blue-600 dark:text-blue-400 uppercase">{selectedCert.issuer}</span>
                              {selectedCert.inProgress && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-600 dark:text-amber-400 uppercase">In Progress</span>
                                </>
                              )}
                              {selectedCert.worth && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">Value: ${selectedCert.worth}</span>
                                </>
                              )}
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                              {selectedCert.name}
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>{selectedCert.date}</span>
                              </div>
                              {selectedCert.credentialId && (
                                <div className="font-mono text-xs bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md text-gray-700 dark:text-gray-300">
                                  Credential ID: {selectedCert.credentialId}
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedCert.description && (
                            <div className="markdown-body prose dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ ...props }) => <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-white/10 pb-2" {...props} />,
                                  h2: ({ ...props }) => <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white mt-7 mb-3 border-b border-gray-200 dark:border-white/5 pb-1" {...props} />,
                                  h3: ({ ...props }) => <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-5 mb-2" {...props} />,
                                  p: ({ ...props }) => <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed mb-5" {...props} />,
                                  a: ({ ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />,
                                  ul: ({ ...props }) => <ul className="list-disc ps-6 mb-5 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                  ol: ({ ...props }) => <ol className="list-decimal ps-6 mb-5 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                  li: ({ ...props }) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                                  blockquote: ({ ...props }) => <blockquote className="border border-gray-200 dark:border-white/10 italic text-gray-600 dark:text-gray-400 my-5 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl" {...props} />,
                                  pre: ({ children }) => <pre className="bg-zinc-900 dark:bg-black/60 p-4 rounded-xl border border-gray-800 dark:border-white/10 font-mono text-xs md:text-sm overflow-x-auto my-5 text-emerald-400 max-w-full leading-relaxed">{children}</pre>,
                                  code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-blue-600 dark:text-blue-400" {...props}>{children}</code>
                                    ) : (
                                      <code className={className} {...props}>{children}</code>
                                    );
                                  },
                                  table: ({ ...props }) => (
                                    <div className="overflow-x-auto my-5 rounded-xl border border-gray-200 dark:border-white/10">
                                      <table className="w-full border-collapse text-start text-sm" {...props} />
                                    </div>
                                  ),
                                  thead: ({ ...props }) => <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10" {...props} />,
                                  tbody: ({ ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-white/5" {...props} />,
                                  tr: ({ ...props }) => <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors" {...props} />,
                                  th: ({ ...props }) => <th className="px-4 py-3 font-bold text-gray-900 dark:text-white tracking-wider font-mono text-xs uppercase" {...props} />,
                                  td: ({ ...props }) => <td className="px-4 py-3 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />
                                }}
                              >
                                {selectedCert.description}
                              </ReactMarkdown>
                            </div>
                          )}

                          {selectedCert.link?.url && (
                            <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
                              <button
                                onClick={() => openLink(selectedCert.link!.url)}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer shadow-md text-sm uppercase tracking-wider"
                              >
                                <span>{selectedCert.link.text || 'Verify Credential'}</span>
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PageWrapper>
  );
}

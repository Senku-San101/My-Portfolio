import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Calendar, ExternalLink, ShieldCheck, Eye, BookOpen, X, DollarSign } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, OperationType, handleFirestoreError, openLink } from '../lib/firebase';
import { Certificate, AppSettings } from '../types';
import Typewriter from '../components/Typewriter';
import ScrambleHeader from '../components/ScrambleHeader';
import PageWrapper from '../components/PageWrapper';
import ImageViewer from '../components/ImageViewer';
import { useLanguage } from '../context/LanguageContext';

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // 1.2 seconds
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentVal = Math.floor(startValue + (value - startValue) * easeOutQuad(progressRatio));
      
      setCount(currentVal);

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{count.toLocaleString()}</span>;
}

export default function CertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const { t, language } = useLanguage();

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
      setError(null);
    }, (err) => {
      console.error(err);
      setError("Failed to load certificates.");
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'certificates');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn("Settings fetch failed, using fallbacks", err);
    });

    return () => {
      unsubCerts();
      unsubSettings();
    };
  }, []);

  // Dynamically update document title based on selected certificate
  useEffect(() => {
    if (selectedCert) {
      document.title = `Certificates | ${selectedCert.name}`;
    } else {
      document.title = 'Abdulrahman Kamal | Certificates';
    }
  }, [selectedCert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('verifyingCredentials')} speed={20} />
      </div>
    );
  }

  const certCount = items.length;
  const totalWorth = items.reduce((acc, c) => acc + (c.worth || 0), 0);

  return (
    <PageWrapper className="space-y-16 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic">
          <ScrambleHeader text={t('verifiedCerts')} />
        </h1>
        <div className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
          <Typewriter key={settings?.certificatesSubtitle || "default"} text={settings?.certificatesSubtitle || "Continual professional development and validation of expertise in cybersecurity and systems engineering."} delay={800} />
        </div>
      </div>

      {/* Stats Counter Section */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 max-w-xl mx-auto">
        <div id="stat-count-certs" className="glass-md w-full sm:w-1/2 p-6 rounded-[2rem] border border-blue-500/10 flex flex-col items-center justify-center text-center space-y-2 hover:border-blue-500/30 transition-all duration-300">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
            <AnimatedCounter value={certCount} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {language === 'en' ? 'Verified Credentials' : 'شهادات معتمدة'}
          </p>
        </div>

        <div id="stat-worth-certs" className="glass-md w-full sm:w-1/2 p-6 rounded-[2rem] border border-green-500/10 flex flex-col items-center justify-center text-center space-y-2 hover:border-green-500/30 transition-all duration-300">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-green-600 dark:text-green-400">
            <AnimatedCounter value={totalWorth} prefix="$" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {language === 'en' ? 'Worth' : 'القيمة'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((cert) => (
          <div
            key={cert.id}
            className="glass-md overflow-hidden rounded-[2.5rem] flex flex-col hover:shadow-2xl transition-all duration-500 group relative"
          >
            {cert.inProgress && (
              <div className="absolute inset-0 bg-[#0a0a0c]/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2.5rem]">
                <div className="bg-blue-600 dark:bg-blue-500 text-white font-mono font-black text-xs uppercase tracking-[0.25em] px-5 py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                  {t('inProgress')}
                </div>
              </div>
            )}

            {(() => {
              const imagesList = cert.images && cert.images.length > 0 
                ? cert.images 
                : (cert.imageUrl ? [cert.imageUrl] : []);

              return (
                <>
                  <div className="h-48 bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                     {imagesList.length > 0 ? (
                       <ImageViewer images={imagesList} label="Certificate">
                         <img src={imagesList[0]} alt={cert.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       </ImageViewer>
                     ) : (
                       <div className="w-full h-full flex items-center justify-center opacity-20">
                         <Award className="w-20 h-20" />
                       </div>
                     )}
                     <div className="absolute top-4 left-4 glass-xl p-2 rounded-xl text-blue-500 z-20 pointer-events-none">
                       <ShieldCheck className="w-5 h-5" />
                     </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold leading-tight">{cert.name}</h3>
                        <p className="text-blue-500 font-semibold">{cert.issuer}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{cert.date}</span>
                      </div>
                      {cert.credentialId && (
                        <p className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-white/5 p-2 rounded-lg break-all">
                          ID: {cert.credentialId}
                        </p>
                      )}
                                           <div className="pt-2 flex flex-col gap-2">
                        {imagesList.length > 0 && (
                          <ImageViewer images={imagesList} label="Certificate">
                            <button className="w-full flex items-center justify-center space-x-2 bg-[#1C1C1E]/60 dark:bg-white/5 hover:bg-[#2C2C2E] dark:hover:bg-white/10 active:scale-95 text-[#1D1D1F] dark:text-[#F5F5F7] font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer text-xs uppercase tracking-wider border border-[#1C1C1E]/10 dark:border-white/5">
                              <Eye className="w-4 h-4" />
                              <span>Show Certificate/Badge</span>
                            </button>
                          </ImageViewer>
                        )}
                        
                        {cert.description && (
                          <button 
                            onClick={() => setSelectedCert(cert)}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-blue-500/25 text-xs uppercase tracking-wider"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {cert.link?.url && (
                      <div className="mt-4 px-8 pb-8">
                        <button 
                          onClick={() => openLink(cert.link!.url)}
                          className="inline-flex items-center space-x-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-colors"
                        >
                          <span>{cert.link.text || 'Verify Credential'}</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Certificate Details Modal Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedCert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSelectedCert(null);
              }}
              tabIndex={0}
            >
              {/* Close Button on top right */}
              <button 
                onClick={() => setSelectedCert(null)}
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110]"
                title="Close Details"
              >
                <X className="w-8 h-8 text-white" />
              </button>

              {/* Main Interactive Scrollable Panel Card */}
              <motion.div 
                initial={{ y: '100vh', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100vh', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="w-full max-w-4xl h-[90vh] bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] overflow-y-auto shadow-2xl relative border border-gray-200 dark:border-white/10 flex flex-col"
              >
                {/* Scrollable container for whole content */}
                <div className="flex-1 overflow-y-auto">
                  {(() => {
                    const imagesList = selectedCert.images && selectedCert.images.length > 0 
                      ? selectedCert.images 
                      : (selectedCert.imageUrl ? [selectedCert.imageUrl] : []);

                    return (
                      <div className="flex flex-col">
                        {imagesList.length > 0 && (
                          <div className="w-full h-[45vh] bg-gray-100 dark:bg-white/5 relative overflow-hidden border-b border-gray-200 dark:border-white/10 flex items-center justify-center p-6 md:p-12">
                            <img 
                              src={imagesList[0]} 
                              alt={selectedCert.name} 
                              className="max-w-full max-h-full object-contain rounded-2xl shadow-lg" 
                            />
                          </div>
                        )}

                        {/* Blog-like content structure */}
                        <div className="p-8 md:p-12 space-y-8">
                          {/* Header info */}
                          <div className="space-y-4 border-b border-gray-200 dark:border-white/10 pb-6">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs font-mono uppercase tracking-widest rounded-full font-bold">
                                {selectedCert.issuer}
                              </span>
                              {selectedCert.inProgress && (
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-mono uppercase tracking-widest rounded-full font-bold">
                                  In Progress
                                </span>
                              )}
                              {selectedCert.worth && (
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-mono uppercase tracking-widest rounded-full font-bold">
                                  Value: ${selectedCert.worth}
                                </span>
                              )}
                            </div>

                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white leading-tight">
                              {selectedCert.name}
                            </h2>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <div className="flex items-center space-x-2">
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

                          {/* Markdown rendered description */}
                          {selectedCert.description && (
                            <div className="markdown-body prose dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ ...props }) => <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mt-10 mb-5 border-b border-gray-200 dark:border-white/10 pb-2" {...props} />,
                                  h2: ({ ...props }) => <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-white/5 pb-1" {...props} />,
                                  h3: ({ ...props }) => <h3 className="text-lg md:text-xl font-bold uppercase italic tracking-tight text-gray-900 dark:text-white mt-6 mb-3" {...props} />,
                                  p: ({ ...props }) => <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed mb-6 font-sans" {...props} />,
                                  a: ({ ...props }) => <a className="text-blue-500 hover:text-blue-400 underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                                  ul: ({ ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                  ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                  li: ({ ...props }) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                                  blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-500 dark:text-gray-400 my-6 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-r-xl" {...props} />,
                                  pre: ({ children }) => <pre className="bg-gray-100 dark:bg-black/60 p-4 rounded-xl border border-gray-200 dark:border-white/5 font-mono text-xs md:text-sm overflow-x-auto my-6 text-gray-800 dark:text-green-400 max-w-full leading-relaxed">{children}</pre>,
                                  code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-blue-500 dark:text-blue-400" {...props}>{children}</code>
                                    ) : (
                                      <code className={className} {...props}>{children}</code>
                                    );
                                  },
                                  table: ({ ...props }) => (
                                    <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white/[0.01]">
                                      <table className="w-full border-collapse text-left text-sm" {...props} />
                                    </div>
                                  ),
                                  thead: ({ ...props }) => <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10" {...props} />,
                                  tbody: ({ ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-white/5" {...props} />,
                                  tr: ({ ...props }) => <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors" {...props} />,
                                  th: ({ ...props }) => <th className="px-4 py-3 font-bold text-gray-900 dark:text-white tracking-wider font-mono text-xs uppercase" {...props} />,
                                  td: ({ ...props }) => <td className="px-4 py-3 text-gray-700 dark:text-gray-300 leading-relaxed font-sans" {...props} />
                                }}
                              >
                                {selectedCert.description}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Footer actions inside scroll area */}
                          {selectedCert.link?.url && (
                            <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
                              <button 
                                onClick={() => openLink(selectedCert.link!.url)}
                                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-6 rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-blue-500/25 text-sm uppercase tracking-wider"
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

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, ChevronRight, Search, ExternalLink, Share2, Check, X } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../lib/firebase';
import { Blog, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import ScrambleHeader from '../components/ScrambleHeader';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const q = query(
      collection(db, 'blogs'),
      where('status', '==', 'published'),
      orderBy('date', 'desc')
    );
    const unsubBlogs = onSnapshot(q, (s) => {
      setBlogs(s.docs.map(d => ({ id: d.id, ...d.data() } as Blog)));
      setLoading(false);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn('Settings fetch failed, using fallbacks', err);
    });

    return () => {
      unsubBlogs();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!loading && blogs.length > 0) {
      const blogId = searchParams.get('id') || searchParams.get('blog');
      if (blogId) {
        const target = blogId.toLowerCase().trim();
        const found = blogs.find(b =>
          b.id === blogId ||
          (b.id || '').toLowerCase() === target ||
          (b.title || '').toLowerCase().includes(target) ||
          (target.includes('buffer') && (b.title || '').toLowerCase().includes('buffer')) ||
          (target.includes('drm') && (b.title || '').toLowerCase().includes('drm')) ||
          (target.includes('linux') && (b.title || '').toLowerCase().includes('linux'))
        );
        if (found) {
          setSelectedBlog(found);
        }
      }
    }
  }, [loading, blogs, searchParams]);

  useEffect(() => {
    if (loading) return;
    const blogId = searchParams.get('id') || searchParams.get('blog');
    if (selectedBlog) {
      if (blogId !== selectedBlog.id) {
        setSearchParams({ id: selectedBlog.id! }, { replace: true });
      }
    } else if (blogId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('id');
      newParams.delete('blog');
      setSearchParams(newParams, { replace: true });
    }
  }, [selectedBlog, searchParams, setSearchParams, loading]);

  useEffect(() => {
    if (selectedBlog) {
      document.title = `Blogs | ${selectedBlog.title}`;
    } else {
      document.title = 'Abdulrahman Kamal | Blogs';
    }
  }, [selectedBlog]);

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/blog?id=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredBlogs = blogs.filter(b =>
    b.title.toLowerCase().includes(filter.toLowerCase()) ||
    b.tags?.some(t => t.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <PageWrapper className="max-w-7xl mx-auto space-y-16">
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6 sm:pt-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold uppercase tracking-[0.2em]">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Articles & Deep Dives</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase leading-none text-gray-900 dark:text-white">
              <ScrambleHeader text="Blogs" as="span" />{' '}
              <span className="text-blue-600 dark:text-blue-400">&amp;</span>{' '}
              <ScrambleHeader text="Insights" as="span" delay={90} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.34 }}
              className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl font-medium"
            >
              {settings?.blogsSubtitle || 'Technical write-ups, security research, and deep dives into the digital landscape.'}
            </motion.p>
          </div>

          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full ps-11 pe-5 py-3.5 w-full md:w-80 outline-none focus:border-blue-500 transition-colors font-mono text-xs text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="glass-sm rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 animate-pulse">
                <div className="aspect-[16/10] bg-gray-200 dark:bg-white/5" />
                <div className="p-7 space-y-4">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredBlogs.map((blog, i) => {
              const showFallback = !blog.imageUrl || (blog.id ? failedImages[blog.id] : false);
              return (
                <motion.article
                  key={blog.id}
                  onClick={() => setSelectedBlog(blog)}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{ delay: (i % 3) * 0.05, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5 }}
                  className="glass-sm rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 group cursor-pointer flex flex-col h-full shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-colors duration-300"
                >
                  <div className="aspect-[16/10] overflow-hidden relative bg-gray-100 dark:bg-white/5">
                    {!showFallback ? (
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => blog.id && setFailedImages(prev => ({ ...prev, [blog.id!]: true }))}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600/10 to-indigo-600/10 text-blue-600 dark:text-blue-400">
                        <BookOpen className="w-10 h-10 opacity-70" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                        <span>{blog.date}</span>
                        {blog.tags?.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                            <span className="text-gray-400" aria-hidden="true">·</span>
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold leading-snug text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                        {blog.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
                        {blog.description || blog.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/70 dark:border-white/10">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Read Article</span>
                      </div>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {!loading && filteredBlogs.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto opacity-30" />
            <p className="text-gray-500 uppercase font-mono tracking-widest text-xs">No matching articles found.</p>
          </div>
        )}
      </section>

      {/* Blog Modal Reader */}
      <AnimatePresence>
        {selectedBlog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl"
          >
            <button
              onClick={() => setSelectedBlog(null)}
              className="fixed top-4 end-4 sm:top-6 sm:end-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110] cursor-pointer"
              aria-label="Close article"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>

            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-5xl bg-[#0a0a0a] text-white border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {selectedBlog.externalUrl ? (
                <div className="flex flex-col h-full">
                  <div className="p-5 sm:p-8 border-b border-white/10 bg-white/5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-blue-400">
                      {selectedBlog.tags?.map((tag, idx) => (
                        <span key={tag} className="inline-flex items-center gap-2">
                          {idx > 0 && <span className="text-gray-500" aria-hidden="true">·</span>}
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">{selectedBlog.title}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs font-mono text-gray-400 justify-between">
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {selectedBlog.date}</span>
                        <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 text-blue-400" /> External Article</span>
                      </div>
                      <span className="text-gray-400 font-semibold">
                        Origin: {(() => { try { return new URL(selectedBlog.externalUrl).hostname; } catch { return 'External Site'; } })()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-[60vh] relative bg-[#0d0d0d]">
                    <iframe
                      src={selectedBlog.externalUrl}
                      className="w-full h-full border-none"
                      title={selectedBlog.title}
                      referrerPolicy="no-referrer"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                  <div className="p-5 sm:p-8 bg-white/5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                      You are viewing an embedded preview of the article. If the contents do not render, open it directly on the source website.
                    </p>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => copyShareLink(selectedBlog.id!)}
                        className="btn-secondary flex-1 md:flex-none px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={selectedBlog.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-center flex-1 md:flex-none px-5 py-3 text-xs font-bold uppercase tracking-wider"
                      >
                        Open Article
                      </a>
                      <button
                        onClick={() => setSelectedBlog(null)}
                        className="btn-primary flex-1 md:flex-none px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {selectedBlog.imageUrl && (
                    <div className="h-64 sm:h-80 w-full relative">
                      <img src={selectedBlog.imageUrl} alt={selectedBlog.title} referrerPolicy="no-referrer" className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                      <div className="absolute bottom-6 start-6 end-6 sm:bottom-10 sm:start-10 sm:end-10 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-blue-400">
                          {selectedBlog.tags?.map((tag, idx) => (
                            <span key={tag} className="inline-flex items-center gap-2">
                              {idx > 0 && <span className="text-gray-500" aria-hidden="true">·</span>}
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">{selectedBlog.title}</h2>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{selectedBlog.date}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedBlog.imageUrl && (
                    <div className="p-6 sm:p-10 pb-4 border-b border-white/10 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-blue-400">
                        {selectedBlog.tags?.map((tag, idx) => (
                          <span key={tag} className="inline-flex items-center gap-2">
                            {idx > 0 && <span className="text-gray-500" aria-hidden="true">·</span>}
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">{selectedBlog.title}</h2>
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{selectedBlog.date}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-10 md:p-12 space-y-8">
                    <div className="markdown-body prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ ...props }) => <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-10 mb-5 border-b border-white/10 pb-2" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-8 mb-4 border-b border-white/5 pb-2" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-3" {...props} />,
                          h4: ({ ...props }) => <h4 className="text-base font-bold text-white mt-5 mb-2" {...props} />,
                          p: ({ ...props }) => <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-5" {...props} />,
                          a: ({ ...props }) => <a className="text-blue-400 hover:text-blue-300 underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc ps-6 mb-5 space-y-2 text-gray-300" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal ps-6 mb-5 space-y-2 text-gray-300" {...props} />,
                          li: ({ ...props }) => <li className="text-gray-300 leading-relaxed" {...props} />,
                          blockquote: ({ ...props }) => <blockquote className="border border-white/10 italic text-gray-300 my-5 bg-white/[0.03] p-5 rounded-xl" {...props} />,
                          pre: ({ children }) => <pre className="bg-black/60 p-5 rounded-2xl border border-white/10 font-mono text-xs sm:text-sm overflow-x-auto my-5 text-emerald-400 max-w-full leading-relaxed">{children}</pre>,
                          code: ({ className, children, ...props }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-blue-400" {...props}>{children}</code>
                            ) : (
                              <code className={className} {...props}>{children}</code>
                            );
                          },
                          img: ({ ...props }) => <img className="rounded-2xl border border-white/10 shadow-xl my-6 mx-auto max-w-full" referrerPolicy="no-referrer" {...props} />,
                          table: ({ ...props }) => (
                            <div className="overflow-x-auto my-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                              <table className="w-full border-collapse text-start text-sm" {...props} />
                            </div>
                          ),
                          thead: ({ ...props }) => <thead className="bg-white/5 border-b border-white/10" {...props} />,
                          tbody: ({ ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
                          tr: ({ ...props }) => <tr className="hover:bg-white/[0.02] transition-colors" {...props} />,
                          th: ({ ...props }) => <th className="px-5 py-3.5 font-bold text-white tracking-wider font-mono text-xs uppercase" {...props} />,
                          td: ({ ...props }) => <td className="px-5 py-3.5 text-gray-300 leading-relaxed" {...props} />
                        }}
                      >
                        {selectedBlog.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="p-6 sm:p-10 bg-white/5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400">Written By</p>
                        <p className="font-bold text-base sm:text-lg text-white">Abdulrahman Kamal</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => copyShareLink(selectedBlog.id!)}
                        className="btn-secondary w-full md:w-auto px-6 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                      <button onClick={() => setSelectedBlog(null)} className="btn-primary w-full md:w-auto px-8 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer">Close</button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

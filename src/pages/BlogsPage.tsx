import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, ChevronRight, Search, Activity, Bot, Share2, Check, X } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../lib/firebase';
import { Blog, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [copied, setCopied] = useState(false);
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
      console.warn("Settings fetch failed, using fallbacks", err);
    });

    return () => {
      unsubBlogs();
      unsubSettings();
    };
  }, []);

  // Lock body scroll when blog reader modal is open
  useEffect(() => {
    if (selectedBlog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedBlog]);

  // Sync URL query params with selected blog on mount and load
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

  // Sync state back to URL when selectedBlog changes
  useEffect(() => {
    if (loading) return;
    const blogId = searchParams.get('id') || searchParams.get('blog');
    if (selectedBlog) {
      if (blogId !== selectedBlog.id) {
        setSearchParams({ id: selectedBlog.id! }, { replace: true });
      }
    } else {
      if (blogId) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        newParams.delete('blog');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [selectedBlog, searchParams, setSearchParams, loading]);

  // Dynamically update document title based on selected blog
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

  if (loading) return <div className="py-32 text-center text-blue-500 uppercase font-mono tracking-widest text-xs">Loading Blogs...</div>;

  return (
    <PageWrapper className="max-w-7xl mx-auto space-y-12 md:space-y-24">
      <section className="space-y-8 md:space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pt-4 md:pt-12">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20">
              <BookOpen className="w-3 h-3" />
              <span>Articles & Deep Dives</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none italic">
              Blogs <span className="text-blue-500 px-2">&</span> Insights
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
              {settings?.blogsSubtitle || "Technical write-ups, security research, and deep dives into the digital landscape."}
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-full pl-14 pr-8 py-3.5 sm:py-4 w-full md:w-80 outline-none focus:border-blue-500/50 transition-all font-mono text-xs uppercase shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((blog, i) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.08, 0.35) }}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedBlog(blog)}
              className="glass-sm rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-gray-200/80 dark:border-white/10 group cursor-pointer flex flex-col h-full shadow-xl transition-all duration-500"
            >
              <div className="aspect-[16/10] overflow-hidden relative bg-gray-100 dark:bg-white/5">
                <img
                  src={blog.imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"}
                  alt={blog.title}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-5 left-5">
                  <div className="bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-white/10">
                    {blog.date}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {blog.tags?.map(tag => (
                      <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/15">{tag}</span>
                    ))}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black italic uppercase leading-tight group-hover:text-blue-500 transition-colors tracking-tighter text-gray-900 dark:text-white">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
                    {blog.description || blog.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200/70 dark:border-white/5">
                  <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>Read Protocol</span>
                  </div>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-blue-500" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-32 space-y-6">
            <Bot className="w-16 h-16 text-gray-400 mx-auto opacity-20" />
            <p className="text-gray-500 uppercase font-mono tracking-widest text-xs">No matching signals found.</p>
          </div>
        )}
      </section>

      {/* Blog Modal Reader */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedBlog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedBlog(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSelectedBlog(null);
            }}
            tabIndex={0}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-2xl outline-none"
          >
            <button
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110] cursor-pointer"
              title="Close Article"
            >
              <X className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </button>

            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-3xl sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.15)] max-h-[90dvh] overflow-y-auto custom-scrollbar"
            >
              {selectedBlog.externalUrl ? (
                <div className="flex flex-col h-full">
                  {/* Header metadata */}
                  <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedBlog.tags?.map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{tag}</span>
                      ))}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter leading-none text-gray-900 dark:text-white">{selectedBlog.title}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-[10px] uppercase font-mono tracking-widest text-gray-500 justify-between">
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> {selectedBlog.date}</span>
                        <span className="flex items-center"><Activity className="w-3 h-3 mr-2 text-green-500" /> Embedded Mirror Tunnel Active</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 uppercase font-bold text-xs">Origin: {(() => { try { return new URL(selectedBlog.externalUrl).hostname; } catch { return 'External Site'; } })()}</span>
                    </div>
                  </div>
                  {/* Embedded Iframe sandboxed panel */}
                  <div className="w-full h-[55dvh] md:h-[60dvh] relative bg-gray-100 dark:bg-[#0d0d0d]">
                    <iframe
                      src={selectedBlog.externalUrl}
                      className="w-full h-full border-none"
                      title={selectedBlog.title}
                      referrerPolicy="no-referrer"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                  <div className="p-6 sm:p-8 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-xs text-gray-600 dark:text-gray-400 max-w-md font-medium leading-relaxed">
                      You are viewing an embedded preview of the article. If the contents do not render, you can view it directly on the source website.
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <button
                        onClick={() => copyShareLink(selectedBlog.id!)}
                        className="btn-secondary flex-1 md:flex-none px-5 py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500 animate-pulse" /> : <Share2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={selectedBlog.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-center flex-1 md:flex-none px-5 py-3.5 text-xs font-black uppercase tracking-widest"
                      >
                        Open Article
                      </a>
                      <button
                        onClick={() => setSelectedBlog(null)}
                        className="btn-primary flex-1 md:flex-none px-6 py-3.5 text-xs font-black uppercase tracking-widest cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-64 sm:h-80 w-full relative bg-gray-200 dark:bg-zinc-900">
                    {selectedBlog.imageUrl && (
                      <img src={selectedBlog.imageUrl} alt="" decoding="async" className="w-full h-full object-cover opacity-50 dark:opacity-60" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/75 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/60 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 md:bottom-12 md:left-12 md:right-12">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedBlog.tags?.map(tag => (
                            <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{tag}</span>
                          ))}
                        </div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900 dark:text-white">{selectedBlog.title}</h2>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[10px] uppercase font-mono tracking-widest text-gray-600 dark:text-gray-400">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> {selectedBlog.date}</span>
                          <span className="flex items-center"><Activity className="w-3 h-3 mr-2 text-green-500" /> Integrity Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-12 space-y-8">
                    <div className="markdown-body prose dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ ...props }) => <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mt-10 mb-5 border-b border-gray-200 dark:border-white/10 pb-3" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-white/5 pb-2" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-lg sm:text-xl md:text-2xl font-bold uppercase italic tracking-tight text-gray-900 dark:text-white mt-6 mb-3" {...props} />,
                          h4: ({ ...props }) => <h4 className="text-base sm:text-lg font-bold uppercase italic tracking-tight text-gray-900 dark:text-white mt-5 mb-2" {...props} />,
                          p: ({ ...props }) => <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed mb-6 font-sans" {...props} />,
                          a: ({ ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                          li: ({ ...props }) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-500 pl-5 sm:pl-6 italic text-gray-600 dark:text-gray-400 my-6 bg-gray-50 dark:bg-white/[0.02] p-4 sm:p-6 rounded-r-2xl border-t border-r border-b border-gray-200 dark:border-white/5" {...props} />,
                          pre: ({ children }) => <pre className="bg-gray-100 dark:bg-black/60 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 font-mono text-xs sm:text-sm overflow-x-auto my-6 text-gray-800 dark:text-green-400 max-w-full leading-relaxed">{children}</pre>,
                          code: ({ className, children, ...props }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-blue-600 dark:text-blue-400" {...props}>{children}</code>
                            ) : (
                              <code className={className} {...props}>{children}</code>
                            );
                          },
                          img: ({ ...props }) => <img className="rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl my-8 mx-auto max-w-full" loading="lazy" decoding="async" referrerPolicy="no-referrer" {...props} />,
                          table: ({ ...props }) => (
                            <div className="overflow-x-auto my-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                              <table className="w-full border-collapse text-left text-sm" {...props} />
                            </div>
                          ),
                          thead: ({ ...props }) => <thead className="bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10" {...props} />,
                          tbody: ({ ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-white/5" {...props} />,
                          tr: ({ ...props }) => <tr className="hover:bg-gray-100/70 dark:hover:bg-white/[0.02] transition-colors" {...props} />,
                          th: ({ ...props }) => <th className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-gray-900 dark:text-white tracking-wider font-mono text-xs uppercase" {...props} />,
                          td: ({ ...props }) => <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300 leading-relaxed font-sans" {...props} />
                        }}
                      >
                        {selectedBlog.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <div className="p-6 md:p-12 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Journaled By</p>
                        <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Abdulrahman's Virtual Core</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto">
                      <button
                        onClick={() => copyShareLink(selectedBlog.id!)}
                        className="btn-secondary w-full md:w-auto px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500 animate-pulse" /> : <Share2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                      <button onClick={() => setSelectedBlog(null)} className="btn-primary w-full md:w-auto px-8 sm:px-12 py-4 sm:py-5 text-xs font-black uppercase tracking-widest cursor-pointer">Close Protocol</button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </PageWrapper>
  );
}

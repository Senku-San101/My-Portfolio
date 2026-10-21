import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Tag, ChevronRight, Search, Activity, Bot, Share2, Check } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where, doc } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../lib/firebase';
import { Blog, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import Typewriter from '../components/Typewriter';

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

  // Sync URL query params with selected blog on mount and load
  useEffect(() => {
    if (!loading && blogs.length > 0) {
      const blogId = searchParams.get('id') || searchParams.get('blog');
      if (blogId) {
        const found = blogs.find(b => b.id === blogId);
        if (found) {
          setSelectedBlog(found);
        }
      }
    }
  }, [loading, blogs, searchParams]);

  // Sync state back to URL when selectedBlog changes
  useEffect(() => {
    if (loading) return; // Wait until blogs are loaded to avoid clearing initial query params
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
    <PageWrapper className="max-w-7xl mx-auto space-y-24">
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-12">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20">
              <BookOpen className="w-3 h-3" />
              <span>Articles & Deep Dives</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none italic">
              Blogs <span className="text-blue-500 px-2">&</span> Insights
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
              {settings?.blogsSubtitle || "Technical write-ups, security research, and deep dives into the digital landscape."}
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search.." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-14 pr-8 py-5 w-full md:w-80 outline-none focus:border-blue-500/50 transition-all font-mono text-xs uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((blog, i) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedBlog(blog)}
              className="glass-sm rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-pointer flex flex-col h-full shadow-2xl transition-all duration-500"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img 
                  src={blog.imageUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"} 
                  alt={blog.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-6 left-6">
                   <div className="bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-white/10">
                    {blog.date}
                   </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {blog.tags?.map(tag => (
                      <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">{tag}</span>
                    ))}
                  </div>
                  <h3 className="text-2xl font-black italic uppercase leading-tight group-hover:text-blue-500 transition-colors tracking-tighter">
                    {blog.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
                    {blog.description || blog.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-gray-500">
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
      <AnimatePresence>
        {selectedBlog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
          >
             <button 
              onClick={() => setSelectedBlog(null)}
              className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-[110]"
            >
              <Activity className="w-8 h-8 text-white rotate-45" />
            </button>

            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {selectedBlog.externalUrl ? (
                <div className="flex flex-col h-full">
                  {/* Header metadata */}
                  <div className="p-8 border-b border-white/10 bg-white/5 space-y-4">
                    <div className="flex flex-wrap gap-2">
                       {selectedBlog.tags?.map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-400/20">{tag}</span>
                      ))}
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{selectedBlog.title}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[10px] uppercase font-mono tracking-widest text-gray-500 justify-between">
                      <div className="flex items-center space-x-6">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> {selectedBlog.date}</span>
                        <span className="flex items-center"><Activity className="w-3 h-3 mr-2 text-green-500" /> Embedded Mirror Tunnel Active</span>
                      </div>
                      <span className="text-gray-400 uppercase font-bold text-xs">Origin: {(() => { try { return new URL(selectedBlog.externalUrl).hostname; } catch(e) { return 'External Site'; } })()}</span>
                    </div>
                  </div>
                  {/* Embedded Iframe sandboxed panel */}
                  <div className="w-full h-[60vh] relative bg-[#0d0d0d]">
                    <iframe 
                      src={selectedBlog.externalUrl} 
                      className="w-full h-full border-none"
                      title={selectedBlog.title}
                      referrerPolicy="no-referrer"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                  <div className="p-8 bg-white/5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-xs text-gray-400 max-w-md font-medium leading-relaxed">
                      You are viewing an embedded preview of the article. If the contents do not render, you can view it directly on the source website.
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <button 
                        onClick={() => copyShareLink(selectedBlog.id!)}
                        className="btn-secondary flex-1 md:flex-none px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500 animate-pulse" /> : <Share2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                      <a 
                        href={selectedBlog.externalUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-secondary text-center flex-1 md:flex-none px-6 py-4 text-xs font-black uppercase tracking-widest"
                      >
                        Open Article
                      </a>
                      <button 
                        onClick={() => setSelectedBlog(null)} 
                        className="btn-primary flex-1 md:flex-none px-8 py-4 text-xs font-black uppercase tracking-widest"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-80 w-full relative">
                    <img src={selectedBlog.imageUrl} alt="" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                    <div className="absolute bottom-12 left-12 right-12">
                       <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                           {selectedBlog.tags?.map(tag => (
                            <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-400/20">{tag}</span>
                          ))}
                        </div>
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">{selectedBlog.title}</h2>
                        <div className="flex items-center space-x-6 text-[10px] uppercase font-mono tracking-widest text-gray-500">
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> {selectedBlog.date}</span>
                          <span className="flex items-center"><Activity className="w-3 h-3 mr-2 text-green-500" /> Integrity Verified</span>
                        </div>
                       </div>
                    </div>
                  </div>

                  <div className="p-12 space-y-8">
                     <div className="markdown-body prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ ...props }) => <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white mt-12 mb-6 border-b border-white/10 pb-3" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white mt-10 mb-4 border-b border-white/5 pb-2" {...props} />,
                            h3: ({ ...props }) => <h3 className="text-xl md:text-2xl font-bold uppercase italic tracking-tight text-white mt-8 mb-3" {...props} />,
                            h4: ({ ...props }) => <h4 className="text-lg font-bold uppercase italic tracking-tight text-white mt-6 mb-2" {...props} />,
                            p: ({ ...props }) => <p className="text-gray-300 text-lg leading-relaxed mb-6 font-sans animate-fade-in" {...props} />,
                            a: ({ ...props }) => <a className="text-blue-400 hover:text-blue-300 underline font-semibold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                            ul: ({ ...props }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-300" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-gray-300" {...props} />,
                            li: ({ ...props }) => <li className="text-gray-300 leading-relaxed" {...props} />,
                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-400 my-6 bg-white/[0.02] p-6 rounded-r-2xl border-t border-r border-b border-white/5" {...props} />,
                            pre: ({ children }) => <pre className="bg-black/60 p-6 rounded-2xl border border-white/5 font-mono text-sm overflow-x-auto my-6 text-green-400 max-w-full leading-relaxed">{children}</pre>,
                            code: ({ className, children, ...props }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-blue-400" {...props}>{children}</code>
                              ) : (
                                <code className={className} {...props}>{children}</code>
                              );
                            },
                            img: ({ ...props }) => <img className="rounded-2xl border border-white/10 shadow-2xl my-8 mx-auto max-w-full" referrerPolicy="no-referrer" {...props} />,
                            table: ({ ...props }) => (
                              <div className="overflow-x-auto my-8 rounded-2xl border border-white/10 bg-white/[0.02]">
                                <table className="w-full border-collapse text-left text-sm" {...props} />
                              </div>
                            ),
                            thead: ({ ...props }) => <thead className="bg-white/5 border-b border-white/10" {...props} />,
                            tbody: ({ ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
                            tr: ({ ...props }) => <tr className="hover:bg-white/[0.02] transition-colors" {...props} />,
                            th: ({ ...props }) => <th className="px-6 py-4 font-bold text-white tracking-wider font-mono text-xs uppercase" {...props} />,
                            td: ({ ...props }) => <td className="px-6 py-4 text-gray-300 leading-relaxed font-sans" {...props} />
                          }}
                        >
                          {selectedBlog.content}
                        </ReactMarkdown>
                     </div>
                  </div>

                  <div className="p-12 bg-white/5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Bot className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Journaled By</p>
                          <p className="font-bold text-lg">Abdulrahman's Virtual Core</p>
                        </div>
                     </div>
                     <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                       <button 
                         onClick={() => copyShareLink(selectedBlog.id!)}
                         className="btn-secondary w-full md:w-auto px-8 py-5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
                       >
                         {copied ? <Check className="w-4 h-4 text-green-500 animate-pulse" /> : <Share2 className="w-4 h-4" />}
                         <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                       </button>
                       <button onClick={() => setSelectedBlog(null)} className="btn-primary w-full md:w-auto px-12 py-5 text-xs font-black uppercase tracking-widest">Close Protocol</button>
                     </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
      `}</style>
    </PageWrapper>
  );
}

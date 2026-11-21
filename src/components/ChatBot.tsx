import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Bot, Loader2, Sparkles, 
  Compass, Navigation, Minimize2, Maximize2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Profile, AppSettings } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NavigationAction {
  path: string;
  targetId?: string;
  label?: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
  navAction?: NavigationAction;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoNavEnabled, setAutoNavEnabled] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTeleportNotice, setActiveTeleportNotice] = useState<string | null>(null);

  const { language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (doc) => {
      if (doc.exists()) setProfile(doc.data() as Profile);
    }, (error) => console.warn("ChatBot: Profile read failed", error));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as AppSettings);
    }, (error) => console.warn("ChatBot: Settings read failed", error));

    // Show tooltip after 5 seconds
    const timer = setTimeout(() => {
      if (!isOpen) setShowTooltip(true);
    }, 5000);

    return () => {
      unsubProfile();
      unsubSettings();
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (location.pathname.startsWith('/admin')) return null;

  // Extract [[NAVIGATE:path|targetId|label]] or [NAVIGATE:path|targetId|label]
  const parseNavigationAction = (rawText: string): { cleanText: string; navAction?: NavigationAction } => {
    const regex = /\[\[?NAVIGATE:([^|\]]+)(?:\|([^|\]]*))?(?:\|([^\]]*))?\]?\]/i;
    const match = rawText.match(regex);

    if (match) {
      const path = match[1]?.trim();
      const targetId = match[2]?.trim() || undefined;
      const label = match[3]?.trim() || undefined;
      const cleanText = rawText.replace(regex, '').trim();

      if (path) {
        return {
          cleanText,
          navAction: { path, targetId, label }
        };
      }
    }

    return { cleanText: rawText };
  };

  // Perform physical route transition & smooth scroll to specific element
  const executeNavigation = (action: NavigationAction) => {
    if (!action.path) return;

    const currentFullPath = location.pathname + location.search;
    const isDifferentRoute = currentFullPath !== action.path;

    if (isDifferentRoute) {
      navigate(action.path);
    }

    // Flash teleport banner
    if (action.label) {
      setActiveTeleportNotice(action.label);
      setTimeout(() => setActiveTeleportNotice(null), 3000);
    }

    // Attempt to locate and scroll to target element
    if (action.targetId) {
      let attempts = 0;
      const maxAttempts = 16;
      const interval = setInterval(() => {
        attempts++;
        const el = document.getElementById(action.targetId!) ||
                   document.querySelector(`[data-nav-id="${action.targetId}"]`) ||
                   document.querySelector(`[data-exp-alias="${action.targetId}"]`) ||
                   document.querySelector(`[data-svc-alias="${action.targetId}"]`) ||
                   document.querySelector(`[data-cert-alias="${action.targetId}"]`) ||
                   document.querySelector(`[data-project-id="${action.targetId}"]`);

        if (el) {
          clearInterval(interval);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('cyber-teleport-glow');
          setTimeout(() => el.classList.remove('cyber-teleport-glow'), 3500);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 100);
    } else if (!isDifferentRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: textToSend }] };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setShowTooltip(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, parts: m.parts })),
          profileData: profile,
          customInstructions: settings?.chatBotInstructions,
          geminiApiKey: settings?.geminiApiKey
        })
      });

      const data = await response.json();
      if (data.text) {
        const { cleanText, navAction } = parseNavigationAction(data.text);
        
        const modelMessage: ChatMessage = { 
          role: 'model', 
          parts: [{ text: cleanText }],
          navAction 
        };

        setMessages(prev => [...prev, modelMessage]);

        // Auto navigate if directive is found and auto-nav is enabled
        if (navAction && autoNavEnabled) {
          setTimeout(() => {
            executeNavigation(navAction);
          }, 350);
        }
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Protocol Error: " + (data.message || "Failed to transmit signal.") }] }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Connection failed. Please check the terminal for error logs." }] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const current = input;
    setInput('');
    await sendMessage(current);
  };

  const isRtl = language === 'ar';

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 end-4 md:bottom-6 md:end-6 z-[45] flex flex-col items-end">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: isRtl ? -20 : 20 }}
              className="mb-4 bg-white dark:bg-blue-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-medium relative border border-blue-500/20 max-w-[calc(100vw-2.5rem)] sm:max-w-[260px]"
            >
              {language === 'ar' ? 'أنا هنا لمساعدتك والتجول معك في موقع عبدالرحمن كمال' : 'I am here to guide you through Abdulrahman Kamal\'s portfolio'}
              <div className="absolute bottom-[-6px] end-6 w-3 h-3 bg-white dark:bg-blue-600 rotate-45" />
              <button 
                onClick={() => setShowTooltip(false)}
                className="absolute -top-2 -end-2 bg-red-500 text-white rounded-full p-0.5 cursor-pointer shadow"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setShowTooltip(false);
          }}
          className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(59,130,246,0.45)] hover:scale-110 transition-transform relative overflow-hidden group cursor-pointer"
          title="Open AI Guide"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <Bot className="w-7 h-7 md:w-8 md:h-8 relative z-10" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-300 animate-pulse" />
          </div>
        </button>
      </div>

      {/* Main Interactive Chat Window & Floating Teleport HUD */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '72px' : 'min(620px, calc(100dvh - 7.5rem))'
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-22 end-3 start-3 md:bottom-24 md:end-6 md:start-auto md:w-[420px] rounded-3xl z-50 flex flex-col overflow-hidden border border-gray-200/90 dark:border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.65)] bg-white/95 dark:bg-[#09090b]/92 backdrop-blur-2xl transition-colors"
          >
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between bg-blue-500/10 dark:bg-blue-500/15 shrink-0">
              <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => setIsMinimized(!isMinimized)}>
                <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                  <Bot className="text-white w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm uppercase tracking-tight text-gray-900 dark:text-white truncate">Neuro Assistant</h3>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono tracking-widest uppercase">
                      {isMinimized ? 'CLICK TO EXPAND' : 'AUTONOMOUS TOUR GUIDE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Auto Navigation Switch */}
                <button
                  type="button"
                  onClick={() => setAutoNavEnabled(!autoNavEnabled)}
                  className={`px-2 py-1 rounded-xl text-[9px] font-mono font-bold tracking-wider flex items-center gap-1 transition-all border cursor-pointer ${
                    autoNavEnabled 
                      ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]' 
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                  }`}
                  title={autoNavEnabled ? "Auto-Navigate is ON: chatbot automatically scrolls to sections" : "Auto-Navigate is OFF: page will not move automatically"}
                >
                  <Compass className={`w-3 h-3 ${autoNavEnabled ? 'text-blue-600 dark:text-blue-400 animate-spin-slow' : 'text-gray-500'}`} />
                  <span className="hidden sm:inline">{autoNavEnabled ? 'AUTO-NAV ON' : 'PAUSED'}</span>
                </button>

                {/* Minimize / Expand Toggle */}
                <button 
                  onClick={() => setIsMinimized(!isMinimized)} 
                  className="p-1.5 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-xl transition-all text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>

                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1.5 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded-xl transition-all hover:rotate-90 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Flash Teleport Notice Banner */}
            <AnimatePresence>
              {activeTeleportNotice && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-blue-600 text-white px-4 py-2 text-xs font-mono flex items-center justify-between border-b border-blue-400/30 overflow-hidden shadow-inner shrink-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Navigation className="w-3.5 h-3.5 animate-bounce flex-shrink-0" />
                    <span className="truncate">Navigating to <strong>{activeTeleportNotice}</strong></span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 flex-shrink-0">IN FOCUS</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 custom-scrollbar bg-gradient-to-b from-transparent to-blue-500/[0.04]">
                  {messages.length === 0 && (
                    <div className="text-center py-4 space-y-4">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20"
                      >
                        <Compass className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin-slow" />
                      </motion.div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono uppercase tracking-[0.25em]">Interactive Tour Ready</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 px-3 leading-relaxed">
                        {language === 'ar' 
                          ? 'مرحباً! أنا المرشد الذكي لعبدالرحمن كمال. اسألني عن مشاريعه، خبراته، شهاداته، أو مقالاته وسأقوم بأخذك مباشرة إلى القسم المطلوب وشرحه لك!'
                          : "Hello! I am Abdulrahman Kamal's intelligent portfolio guide. Ask me to show you his projects, experience, certificates, or services and I will auto-navigate directly to show you!"}
                      </p>

                      <div className="pt-2 flex flex-col gap-2 px-1 text-left">
                        {[
                          { en: "Take me to your projects and show Misbar", ar: "خذني إلى المشاريع واعرض لي مشروع مِسْبار" },
                          { en: "Show me your Al-Aidaroos Solar & Tamkeen experience", ar: "اعرض لي خبرتك في شركة العيدروس وبنك تمكين" },
                          { en: "What services and security skills do you provide?", ar: "ما هي الخدمات الأمنية والتقنية التي تقدمها؟" },
                          { en: "Show me your verified certifications & MCBTA", ar: "اعرض لي شهاداتك المعتمدة وشهادة MCBTA" },
                          { en: "Take me to your Buffer Overflow memory layout writeup", ar: "انقلني إلى مقال ثغرات الذاكرة Buffer Overflow" },
                          { en: "How can I contact Abdulrahman directly?", ar: "كيف يمكنني التواصل مع عبدالرحمن مباشرة؟" },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => sendMessage(language === 'ar' ? item.ar : item.en)}
                            className="text-[11px] p-2.5 rounded-xl bg-gray-100/90 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-600/20 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:border-blue-500/40 transition-all text-start flex items-center justify-between group cursor-pointer"
                          >
                            <span className="truncate pe-2">{language === 'ar' ? item.ar : item.en}</span>
                            <Navigation className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[88%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-gray-100/90 dark:bg-white/5 text-gray-900 dark:text-white/90 rounded-tl-none border border-gray-200/80 dark:border-white/10 backdrop-blur-md'
                      }`}>
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.parts[0].text}</div>
                        ) : (
                          <div className="markdown-chat text-xs md:text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                                strong: ({ children }) => <strong className="font-extrabold text-gray-950 dark:text-white tracking-wide">{children}</strong>,
                                em: ({ children }) => <em className="italic text-blue-700 dark:text-blue-200">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-outside mb-2.5 space-y-1 ps-4 text-gray-700 dark:text-gray-200">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-outside mb-2.5 space-y-1 ps-4 text-gray-700 dark:text-gray-200">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                h1: ({ children }) => <h1 className="text-sm md:text-base font-black text-blue-600 dark:text-blue-400 mt-3 mb-1.5 uppercase tracking-wider">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xs md:text-sm font-bold text-blue-600 dark:text-blue-400 mt-2.5 mb-1 uppercase tracking-wide">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 mt-2 mb-1 uppercase tracking-wide">{children}</h3>,
                                code: ({ inline, className, children, ...props }: any) => {
                                  if (inline) {
                                    return (
                                      <code className="px-1.5 py-0.5 rounded bg-gray-200/80 dark:bg-black/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] border border-blue-500/20" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <code className="block p-3 my-2.5 rounded-xl bg-zinc-900 dark:bg-black/75 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-gray-800 dark:border-white/10 leading-normal" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-xl bg-zinc-900 dark:bg-black/75 border border-gray-800 dark:border-white/10 p-2 text-xs font-mono">{children}</pre>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-s-2 border-blue-500 ps-3 my-2 text-gray-700 dark:text-gray-300 italic text-xs bg-blue-500/5 py-1 rounded-e-lg">
                                    {children}
                                  </blockquote>
                                ),
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline underline-offset-2 font-medium">
                                    {children}
                                  </a>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-2 border border-gray-200 dark:border-white/10 rounded-lg">
                                    <table className="w-full text-[11px] text-start border-collapse">{children}</table>
                                  </div>
                                ),
                                th: ({ children }) => <th className="border-b border-gray-200 dark:border-white/10 p-1.5 font-bold bg-gray-200/70 dark:bg-white/5 text-blue-700 dark:text-blue-300">{children}</th>,
                                td: ({ children }) => <td className="border-b border-gray-200/60 dark:border-white/5 p-1.5 text-gray-700 dark:text-gray-300">{children}</td>,
                                hr: () => <hr className="my-2.5 border-gray-200 dark:border-white/10" />
                              }}
                            >
                              {msg.parts[0].text}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Interactive Teleport Badge */}
                        {msg.navAction && (
                          <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono text-[11px] truncate">
                              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-spin-slow" />
                              <span className="truncate">{msg.navAction.label || `Navigated to ${msg.navAction.path}`}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => executeNavigation(msg.navAction!)}
                              className="flex-shrink-0 px-2 py-1 rounded-lg bg-blue-600/15 dark:bg-blue-600/40 hover:bg-blue-600 text-blue-700 dark:text-blue-200 hover:text-white border border-blue-500/30 dark:border-blue-500/40 transition-all text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                              title="Scroll to this section again"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>{language === 'ar' ? 'عرض' : 'View'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100/90 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none border border-gray-200 dark:border-white/10 flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400">
                          {autoNavEnabled ? 'Analyzing & Teleporting...' : 'Processing Query...'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Field */}
                <form onSubmit={handleSubmit} className="p-4 md:p-5 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/90 dark:bg-black/40 shrink-0">
                  <div className="relative group">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={language === 'ar' ? 'اطلب من المساعد نقلك وشرح أي قسم...' : 'Ask assistant to show you any section...'}
                      className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl ps-4 pe-13 py-3.5 text-xs md:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-white/10"
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute end-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] enabled:active:scale-95 cursor-pointer"
                      title="Send query"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[9px] text-gray-500 font-mono uppercase tracking-widest px-1">
                    <span>AI Portfolio Assistant</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {autoNavEnabled ? 'Auto-Scroll Enabled' : 'Auto-Scroll Paused'}
                    </span>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

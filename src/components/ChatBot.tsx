import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Brain } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Profile, AppSettings } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (location.pathname.startsWith('/admin')) return null;

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
          history: messages,
          profileData: profile,
          customInstructions: settings?.chatBotInstructions,
          geminiApiKey: settings?.geminiApiKey
        })
      });

      const data = await response.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: data.text }] }]);
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
      <div className="fixed bottom-24 end-6 md:bottom-6 md:end-6 z-40 flex flex-col items-end">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: isRtl ? -20 : 20 }}
              className="mb-4 bg-white dark:bg-blue-600 text-black dark:text-white px-4 py-2 rounded-2xl shadow-2xl text-sm font-medium relative border border-blue-500/20"
            >
              I am here to help you know more about Abdulrahman Kamal
              <div className="absolute bottom-[-6px] end-6 w-3 h-3 bg-white dark:bg-blue-600 rotate-45" />
              <button 
                onClick={() => setShowTooltip(false)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => {
            setIsOpen(true);
            setShowTooltip(false);
          }}
          className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(59,130,246,0.5)] hover:scale-110 transition-transform relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <Bot className="w-8 h-8 relative z-10" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 end-4 start-4 md:bottom-24 md:end-6 md:start-auto md:w-[400px] h-[600px] glass-xl rounded-3xl z-50 flex flex-col overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5)] bg-white/10 dark:bg-black/80 backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-blue-500/20">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Bot className="text-white w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-base uppercase tracking-tighter">Neuro Assistant</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] text-gray-400 font-mono tracking-widest">LIVE SYNC ACTIVE</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-blue-500/5">
              {messages.length === 0 && (
                <div className="text-center py-6 space-y-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Sparkles className="w-7 h-7 text-blue-400" />
                  </motion.div>
                  <p className="text-[10px] text-blue-400 font-mono uppercase tracking-[0.3em]">System Initialized</p>
                  <p className="text-xs text-gray-300 dark:text-gray-400 px-4 leading-relaxed">
                    {language === 'ar' 
                      ? 'مرحبًا! أنا العقل الافتراضي لعبدالرحمن كمال. اسألني عن مشاريعه، خبراته في الأمن السيبراني ولينكس، شهاداته، أو اختبرني بأي أسئلة تقنية.'
                      : "Hello! I am Abdulrahman Kamal's virtual mind. Ask me about his projects, cybersecurity & Linux expertise, certifications, or grill me with tough technical questions!"}
                  </p>

                  <div className="pt-2 flex flex-col gap-2 px-2 text-left">
                    {[
                      { en: "Tell me about Misbar & P2P Chat", ar: "حدثني عن مشروعي مِسْبار ومحادثة P2P" },
                      { en: "What certifications & credentials do you have?", ar: "ما هي شهاداتك واعتماداتك المهنية؟" },
                      { en: "Explain your experience at Al-Aidaroos Solar & Tamkeen", ar: "اشرح خبرتك في شركة العيدروس وبنك تمكين" },
                      { en: "/grill-me: Grill me with technical cybersecurity interview questions", ar: "/grill-me: اختبرني بأسئلة مقابلة تقنية متقدمة في الأمن السيبراني" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(language === 'ar' ? item.ar : item.en)}
                        className="text-[11px] p-2.5 rounded-xl bg-white/5 hover:bg-blue-600/20 text-gray-300 hover:text-white border border-white/10 hover:border-blue-500/40 transition-all text-start flex items-center justify-between group cursor-pointer"
                      >
                        <span>{language === 'ar' ? item.ar : item.en}</span>
                        <Send className="w-3 h-3 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
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
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white/10 dark:bg-white/5 text-white/90 rounded-tl-none border border-white/10 backdrop-blur-md'
                  }`}>
                    {msg.parts[0].text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center space-x-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-blue-400">Processing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-6 border-t border-white/10 bg-black/40">
              <div className="relative group">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query system..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-14 text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600 focus:bg-white/10"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-500 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] enabled:active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-[9px] text-center text-gray-500 font-mono uppercase tracking-widest opacity-50">
                End-to-End Encrypted Session
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface TerminalLine {
  prompt?: string;
  text: string;
  tone?: 'command' | 'info' | 'success';
  delay: number;
}

function shouldSkipInitially(): boolean {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;
  // Keep /login portal discreet as requested
  if (window.location.pathname.startsWith('/login')) return true;
  return false;
}

export default function Entrance() {
  const [visible, setVisible] = useState<boolean>(() => !shouldSkipInitially());
  const [visibleLines, setVisibleLines] = useState<number>(1);
  const [typedChars, setTypedChars] = useState<number>(0);
  const { language } = useLanguage();

  const isAdminRoute =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  const lines: TerminalLine[] = isAdminRoute
    ? [
        { prompt: 'ak@sec:~$', text: ' ./console --attach admin', tone: 'command', delay: 0 },
        { text: 'Mounting workspace configuration...', tone: 'info', delay: 240 },
        { text: 'Verifying session & vault modules... OK', tone: 'success', delay: 500 },
        { text: 'Admin console ready.', tone: 'success', delay: 780 },
      ]
    : [
        { prompt: 'visitor@ak-sec:~$', text: ' ./launch --portfolio', tone: 'command', delay: 0 },
        { text: 'Loading profile [Abdulrahman Kamal]...', tone: 'info', delay: 240 },
        { text: 'Syncing projects, writeups & credentials... OK', tone: 'success', delay: 500 },
        { text: 'Interface ready. Welcome.', tone: 'success', delay: 780 },
      ];

  const firstCmd = lines[0].text;

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // Type out the first command briskly over ~220ms
    const typeInterval = window.setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= firstCmd.length) {
          window.clearInterval(typeInterval);
          return prev;
        }
        return prev + 2;
      });
    }, 16);

    const lineTimers = lines.slice(1).map((line, idx) =>
      window.setTimeout(() => {
        setVisibleLines(idx + 2);
      }, line.delay)
    );

    const finishTimer = window.setTimeout(() => {
      dismiss();
    }, 1350);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearInterval(typeInterval);
      lineTimers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, dismiss, firstCmd.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="terminal-entrance"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={dismiss}
          className="fixed inset-0 z-[120] bg-[#050608]/98 backdrop-blur-xl text-white flex items-center justify-center p-4 sm:p-6 select-none cursor-pointer overflow-hidden"
          role="dialog"
          aria-label="Terminal entrance sequence"
        >
          {/* Subtle grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.16)_0%,transparent_62%)] pointer-events-none" />

          {/* Terminal Window */}
          <motion.div
            dir="ltr"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl rounded-2xl bg-[#0b0d12] border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden"
          >
            {/* Window Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#12161f] border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-gray-400">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAdminRoute ? 'ak@sec: ~/admin' : 'ak@sec: ~/portfolio'}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="font-mono text-[10px] uppercase tracking-wider text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                {language === 'ar' ? 'تخطي' : 'Skip'}
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-5 sm:p-6 font-mono text-xs sm:text-sm space-y-2.5 min-h-[168px] text-left">
              {lines.slice(0, visibleLines).map((line, idx) => {
                const isFirst = idx === 0;
                const content = isFirst ? line.text.slice(0, typedChars) : line.text;
                const isLastVisible = idx === visibleLines - 1;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.16 }}
                    className="leading-relaxed break-words"
                  >
                    {line.prompt && (
                      <span className="text-blue-400 font-semibold">{line.prompt}</span>
                    )}
                    <span
                      className={
                        line.tone === 'success'
                          ? 'text-emerald-400'
                          : line.tone === 'info'
                            ? 'text-gray-300'
                            : 'text-white font-medium'
                      }
                    >
                      {!line.prompt && <span className="text-gray-500 mr-2">&gt;</span>}
                      {content}
                    </span>
                    {isLastVisible && (
                      <span className="inline-block w-2 h-4 ml-1 align-middle bg-blue-400 animate-pulse" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Progress Footer */}
            <div className="px-5 pb-4 pt-1 space-y-2">
              <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full w-full origin-left bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                <span>AK.SEC Shell</span>
                <span>{language === 'ar' ? 'انقر في أي مكان للمتابعة' : 'Click or press Enter to skip'}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

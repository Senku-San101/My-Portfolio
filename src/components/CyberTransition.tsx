import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export default function CyberTransition() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center bg-black/40 overflow-hidden"
        >
          {/* Glitch Overlay */}
          <div className="absolute inset-0 z-10 opacity-30">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: [0, 1, 0], x: [100, -100] }}
                transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.1 }}
                className="absolute h-px bg-blue-500 w-full"
                style={{ top: `${Math.random() * 100}%` }}
              />
            ))}
          </div>

          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-[10%] w-[1px] bg-blue-500/30"
          />
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-[10%] w-[1px] bg-blue-500/30"
          />

          {/* Random Hex Streams */}
          <div className="absolute inset-0 flex justify-around opacity-10 font-mono text-[8px] whitespace-nowrap overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '-100%' }}
                animate={{ y: '100%' }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'linear' }}
                className="text-blue-500"
              >
                {Array(50).fill(0).map(() => Math.random().toString(16).substring(2, 10).toUpperCase()).join('\n')}
              </motion.div>
            ))}
          </div>
          
          <div className="relative z-50 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-48 h-48 border border-blue-500/40 rounded-full flex items-center justify-center bg-blue-500/5 shadow-[0_0_50px_rgba(59,130,246,0.1)] relative"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-t-2 border-blue-500/50 rounded-full" 
              />
               <div className="text-xl font-black text-blue-500 animate-pulse tracking-tighter">SEC_INIT</div>
            </motion.div>

            <div className="mt-8 space-y-2 text-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-[10px] uppercase tracking-[0.8em] text-blue-400"
              >
                Syncing Neural Link
              </motion.div>
              <div className="h-1 w-48 bg-blue-500/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

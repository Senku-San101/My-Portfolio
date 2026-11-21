import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Shield, Lock, Terminal, Activity, Cpu, Bot, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface EntranceProps {
  onComplete: () => void;
}

const TERMINAL_LOGS = [
  { text: "> Connecting to web servers...", type: "info" },
  { text: "> Loading portfolio assets [OK]", type: "success" },
  { text: "> Retrieving database documents...", type: "info" },
  { text: "> Fetching latest projects...", type: "info" },
  { text: "> Organizing portfolio sections...", type: "success" },
  { text: "> Loading custom preferences...", type: "info" },
  { text: "> Welcome to Abdulrahman's portfolio.", type: "success" },
  { text: "> PORTFOLIO READY.", type: "success" }
];

export default function Entrance({ onComplete }: EntranceProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && (user.email === '000means000@gmail.com' || user.email === 'abdulrahmankamal609@gmail.com')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentLogIndex < TERMINAL_LOGS.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, TERMINAL_LOGS[currentLogIndex].text]);
        setCurrentLogIndex(prev => prev + 1);
      }, currentLogIndex === 0 ? 500 : 300);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setIsFinished(true), 1000);
    }
  }, [currentLogIndex]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Background Matrix-like grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 scanline overflow-hidden">
        <div className="w-full h-[100vh] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan" />
      </div>

      <div className={`w-full max-w-2xl bg-[#0a0a0a] border ${isAdmin ? 'border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 'border-gray-800/50'} rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-colors duration-1000`}>
        <div className="flex items-center space-x-2 mb-8 border-b border-gray-800 pb-4">
          <Terminal className={`w-4 h-4 ${isAdmin ? 'text-blue-500' : 'text-gray-500'}`} />
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            {isAdmin ? 'Admin Portal v3.0.1' : 'Abdulrahman Kamal Portfolio v2.0.4'}
          </span>
          <div className="flex-1" />
          <div className="flex space-x-1.5 leading-none">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
          </div>
        </div>

        <div className="space-y-2 font-mono text-sm sm:text-base mb-12 h-48 overflow-y-auto custom-scrollbar">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start space-x-3 ${
                log.includes('Welcome') || log.includes('OK') || log.includes('READY') ? 'text-green-500' :
                log.includes('Organizing') ? 'text-yellow-500' :
                isAdmin ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <span className="opacity-50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
              <span>{isAdmin && log.includes('A. Kamal') ? log.replace('User', 'ADMIN') : log}</span>
            </motion.div>
          ))}
          {!isFinished && (
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className={`w-2 h-4 ${isAdmin ? 'bg-blue-500' : 'bg-gray-500'} inline-block align-middle ml-1`}
            />
          )}
        </div>

        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="flex justify-center items-center space-x-12 py-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                  <Shield className="w-10 h-10 text-white/20" />
                </motion.div>
                <motion.div 
                   animate={isAdmin ? { scale: [1, 1.05, 1], rotate: [0, 90, 180, 270, 360] } : { scale: [1, 1.1, 1] }} 
                  transition={{ duration: isAdmin ? 10 : 4, repeat: Infinity }}
                  className={`${isAdmin ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'} p-6 rounded-full border shadow-2xl`}
                >
                  {isAdmin ? <Cpu className="w-12 h-12 text-blue-400" /> : <Bot className="w-12 h-12 text-white" />}
                </motion.div>
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
                  <Lock className="w-10 h-10 text-white/20" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={onComplete}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.9)' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-5 bg-white text-black font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center space-x-3 group"
                  >
                    <span>Explore Portfolio</span>
                    <Activity className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>

                  {isAdmin && (
                    <motion.button
                      onClick={() => {
                        onComplete();
                        setTimeout(() => navigate('/admin'), 100);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-5 bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.2)] transition-all flex items-center justify-center space-x-3 group border border-blue-400/30"
                    >
                      <span>Enter Admin Portal</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  )}
                </div>
                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] font-medium">
                  Identity: Abdulrahman Kamal
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
}

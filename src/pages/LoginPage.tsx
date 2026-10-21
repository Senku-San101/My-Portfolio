import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, ShieldAlert, Loader2, Mail, Key, ShieldCheck, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Abdulrahman Kamal | Login';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.toLowerCase() === 'abdo' || username.toLowerCase() === 'abdo@kamal.portfolio') {
      try {
        await signInWithEmailAndPassword(auth, 'abdo@kamal.portfolio', password);
        navigate('/admin');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          setError('Invalid login credentials. If you just changed your password, make sure you are using the new one. Also/Otherwise, ensure "abdo@kamal.portfolio" is registered in your Firebase console.');
        } else {
          setError('Login failed: ' + err.message);
        }
      }
    } else {
      setError('Invalid identity credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-xl w-full max-w-[440px] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="p-5 bg-blue-600 shadow-xl shadow-blue-500/20 rounded-3xl">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Admin Portal Entrance</h2>
            <p className="text-gray-500 dark:text-gray-400">Identify yourself to proceed</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[2px] text-gray-400 ml-1">Identity</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 glass-sm rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[2px] text-gray-400 ml-1">Keycode</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 glass-sm rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3 text-red-600 dark:text-red-400 text-sm p-5 bg-red-500/10 rounded-2xl border border-red-500/20"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 text-lg shadow-xl shadow-blue-500/30"
            >
              {loading ? (
                <span className="flex items-center justify-center font-bold">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" /> Authenticating
                </span>
              ) : (
                'Enter Admin Portal'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

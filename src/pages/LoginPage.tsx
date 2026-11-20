import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, User, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  getLoginLockoutStatus, recordFailedLoginAttempt, clearLoginLockout, recordSuccessfulLogin 
} from '../lib/securityLogger';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(() => getLoginLockoutStatus());

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Login';
  }, []);

  // Background lockout timer check (silent, no telemetry display)
  useEffect(() => {
    if (!lockout.isLocked) return;

    const interval = setInterval(() => {
      const current = getLoginLockoutStatus();
      setLockout(current);
      if (!current.isLocked) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockout.isLocked]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check silent lockout
    if (lockout.isLocked) {
      setError('Too many failed attempts. Please wait a moment before trying again.');
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setError('Invalid login credentials.');
      return;
    }

    setLoading(true);

    // Resolve target identity
    let targetEmail = '';
    if (cleanUser === 'abdo' || cleanUser === 'admin' || cleanUser === 'abdo@kamal.portfolio') {
      targetEmail = 'abdo@kamal.portfolio';
    } else if (cleanUser === '000means000@gmail.com') {
      targetEmail = '000means000@gmail.com';
    } else if (cleanUser.includes('@')) {
      targetEmail = cleanUser;
    } else {
      targetEmail = 'abdo@kamal.portfolio';
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
      
      // Clear lockout state on success
      clearLoginLockout();

      // Silently record successful login with full telemetry to Firestore
      await recordSuccessfulLogin(userCredential.user, {
        authMethod: 'Password Authentication',
      });

      navigate('/admin');
    } catch (err: any) {
      // Record failed attempt internally for rate limiting
      const newLockout = recordFailedLoginAttempt();
      setLockout(newLockout);

      if (newLockout.isLocked) {
        setError('Too many failed attempts. Please wait a moment before trying again.');
      } else {
        setError('Invalid login credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="glass-xl w-full max-w-[440px] p-7 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden border border-gray-200 dark:border-white/10"
      >
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
              <label className="block text-[11px] font-bold uppercase tracking-[2px] text-gray-500 dark:text-gray-400 ms-1">
                Identity
              </label>
              <div className="relative group">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full ps-12 pe-6 py-4 glass-sm rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium border border-gray-200 dark:border-white/10"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-[2px] text-gray-500 dark:text-gray-400 ms-1">
                Keycode
              </label>
              <div className="relative group">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full ps-12 pe-12 py-4 glass-sm rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium border border-gray-200 dark:border-white/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm p-4 bg-red-500/10 rounded-2xl border border-red-500/20"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 text-lg shadow-xl shadow-blue-500/30 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center font-bold">
                  <Loader2 className="w-5 h-5 me-3 animate-spin" /> Authenticating
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

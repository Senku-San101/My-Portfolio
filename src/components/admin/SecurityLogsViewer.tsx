import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ShieldAlert, Trash2, RefreshCw, Search, Globe, 
  Laptop, Smartphone, Tablet, Clock, Key, AlertTriangle, 
  CheckCircle2, Copy, Check, Filter, Terminal, Lock, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LoginLog } from '../../types';
import { purgeAllLoginLogs } from '../../lib/securityLogger';

export default function SecurityLogsViewer() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Purge modal state (single master delete button)
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeStatusMessage, setPurgeStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'login_logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as LoginLog[];
        setLogs(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching login logs:', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handlePurgeAll = async () => {
    setIsPurging(true);
    try {
      const count = await purgeAllLoginLogs();
      setIsPurgeModalOpen(false);
      setPurgeStatusMessage({ type: 'success', text: `Successfully deleted all ${count} login audit record(s).` });
      setTimeout(() => setPurgeStatusMessage(null), 4000);
    } catch (err) {
      console.error('Error purging login logs:', err);
      setIsPurgeModalOpen(false);
      setPurgeStatusMessage({ type: 'error', text: 'Failed to delete login logs. Please ensure you are logged in as admin.' });
      setTimeout(() => setPurgeStatusMessage(null), 5000);
    } finally {
      setIsPurging(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatTimestamp = (tsVal: any, isoVal?: string) => {
    if (!tsVal && !isoVal) return '—';
    try {
      let date: Date;
      if (tsVal && typeof tsVal === 'object' && 'seconds' in tsVal) {
        date = new Date(tsVal.seconds * 1000);
      } else if (isoVal) {
        date = new Date(isoVal);
      } else {
        date = new Date(tsVal);
      }
      if (isNaN(date.getTime())) return '—';

      return {
        full: date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        relative: getRelativeTime(date),
      };
    } catch {
      return { full: '—', relative: '—' };
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = Date.now();
    const diff = Math.floor((now - date.getTime()) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    // Search query match
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      log.email?.toLowerCase().includes(q) ||
      log.ip?.toLowerCase().includes(q) ||
      log.browser?.toLowerCase().includes(q) ||
      log.os?.toLowerCase().includes(q) ||
      log.city?.toLowerCase().includes(q) ||
      log.country?.toLowerCase().includes(q) ||
      log.isp?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Period filter
    if (filterPeriod === 'all') return true;
    
    let logDate: Date | null = null;
    if (log.timestamp && typeof log.timestamp === 'object' && 'seconds' in log.timestamp) {
      logDate = new Date(log.timestamp.seconds * 1000);
    } else if (log.isoDate) {
      logDate = new Date(log.isoDate);
    }

    if (!logDate || isNaN(logDate.getTime())) return true;

    const diffDays = (Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24);
    if (filterPeriod === 'today') return diffDays <= 1;
    if (filterPeriod === 'week') return diffDays <= 7;

    return true;
  });

  const uniqueIps = Array.from(new Set(logs.map((l) => l.ip).filter(Boolean)));
  const latestLog = logs[0];
  const latestFormatted = latestLog ? formatTimestamp(latestLog.timestamp, latestLog.isoDate) : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Single Master Delete Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>AUTHENTICATION AUDIT LOGS</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            Admin Login Access History
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed">
            Immutable security log of all successful administrator logins. Individual records cannot be deleted; only the master purge button below clears the audit history.
          </p>
        </div>

        {/* Single Master Delete Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsPurgeModalOpen(true)}
            disabled={logs.length === 0}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            title="Single button to delete all login records"
          >
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span>Delete All Logs</span>
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {purgeStatusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
            purgeStatusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          {purgeStatusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
          )}
          <span>{purgeStatusMessage.text}</span>
        </motion.div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-black/40 border border-gray-200 dark:border-white/10">
          <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">TOTAL LOGINS</div>
          <div className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-1">{logs.length}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> All authenticated
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-black/40 border border-gray-200 dark:border-white/10">
          <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">UNIQUE IPs</div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{uniqueIps.length}</div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono truncate">
            {uniqueIps[0] ? `Latest: ${uniqueIps[0]}` : 'None logged'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-black/40 border border-gray-200 dark:border-white/10">
          <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">LATEST ENTRANCE</div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-300 mt-1 truncate">
            {typeof latestFormatted === 'object' && latestFormatted ? latestFormatted.relative : 'None'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono truncate">
            {typeof latestFormatted === 'object' && latestFormatted ? latestFormatted.full : 'Awaiting login'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-black/40 border border-gray-200 dark:border-white/10">
          <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">INTEGRITY POLICY</div>
          <div className="text-sm font-bold text-amber-600 dark:text-amber-300 mt-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Immutable Records
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
            Zero individual deletes allowed
          </div>
        </div>
      </div>

      {/* Search & Period Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IP, email, city, country, browser, or OS..."
            className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl shrink-0">
          {[
            { id: 'all', label: 'All History' },
            { id: 'today', label: 'Past 24h' },
            { id: 'week', label: 'Past 7 Days' },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setFilterPeriod(period.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterPeriod === period.id
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-white/5'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Stream */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-gray-500 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin mr-2 text-blue-500" />
          <span>Synchronizing security audit trail...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 glass-md rounded-2xl border border-gray-200 dark:border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="font-bold text-gray-900 dark:text-white text-base">No Login Records Found</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {search
              ? 'No login audit logs match your filter criteria.'
              : 'Any future successful login to the Admin Portal will be permanently documented here with network trace, device metadata, and timestamp.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const timeObj = formatTimestamp(log.timestamp, log.isoDate);
            const isExpanded = expandedLogId === log.id;
            const fullTime = typeof timeObj === 'object' ? timeObj.full : String(timeObj);
            const relativeTime = typeof timeObj === 'object' ? timeObj.relative : '';

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-gray-50/90 dark:bg-black/40 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Identity & Status */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      <span>SUCCESSFUL AUTHENTICATION</span>
                    </span>

                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {log.email}
                    </span>

                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{fullTime}</span>
                      {relativeTime && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">({relativeTime})</span>
                      )}
                    </span>
                  </div>

                  {/* Right: Immutability badge & Detail toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1 px-2 py-0.5 rounded bg-gray-200/70 dark:bg-white/5 border border-gray-200 dark:border-white/5" title="Individual deletion is disabled by policy">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span>Immutable</span>
                    </span>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : (log.id || ''))}
                      className="px-2.5 py-1 rounded-lg bg-gray-200/70 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Less' : 'Inspect'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Grid info: IP, Location, OS, Browser */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  {/* IP Address */}
                  <div className="p-2.5 bg-white dark:bg-black/60 rounded-xl border border-gray-200/80 dark:border-white/5 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="text-[10px] text-gray-500 uppercase">IP ADDRESS</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold truncate mt-0.5">{log.ip || 'Unknown'}</div>
                    </div>
                    {log.ip && (
                      <button
                        onClick={() => copyToClipboard(`ip_${log.id}`, log.ip || '')}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0 p-1 cursor-pointer"
                        title="Copy IP"
                      >
                        {copiedKey === `ip_${log.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Location & ISP */}
                  <div className="p-2.5 bg-white dark:bg-black/60 rounded-xl border border-gray-200/80 dark:border-white/5 truncate">
                    <div className="text-[10px] text-gray-500 uppercase">LOCATION</div>
                    <div className="text-gray-900 dark:text-white font-semibold truncate mt-0.5 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="truncate">
                        {[log.city, log.country].filter(Boolean).join(', ') || 'Local / Private Net'}
                      </span>
                    </div>
                  </div>

                  {/* Device & OS */}
                  <div className="p-2.5 bg-white dark:bg-black/60 rounded-xl border border-gray-200/80 dark:border-white/5 truncate">
                    <div className="text-[10px] text-gray-500 uppercase">OPERATING SYSTEM</div>
                    <div className="text-purple-700 dark:text-purple-300 font-semibold truncate mt-0.5 flex items-center gap-1">
                      {log.device === 'Mobile' ? <Smartphone className="w-3 h-3 shrink-0" /> : <Laptop className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{log.os || 'Unknown OS'}</span>
                    </div>
                  </div>

                  {/* Browser */}
                  <div className="p-2.5 bg-white dark:bg-black/60 rounded-xl border border-gray-200/80 dark:border-white/5 truncate">
                    <div className="text-[10px] text-gray-500 uppercase">CLIENT BROWSER</div>
                    <div className="text-blue-600 dark:text-blue-300 font-semibold truncate mt-0.5">
                      {log.browser || 'Browser'}
                    </div>
                  </div>
                </div>

                {/* Expanded Raw Technical Inspection */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-4 bg-white dark:bg-black/80 rounded-xl border border-gray-200 dark:border-white/10 font-mono text-xs space-y-2 text-gray-700 dark:text-gray-300 overflow-x-auto">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-white/10">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Security Forensic Metadata</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div><span className="text-gray-500">Session Fingerprint:</span> <span className="text-amber-600 dark:text-amber-300">{log.fingerprint || 'sec_auto'}</span></div>
                          <div><span className="text-gray-500">Auth Method:</span> <span className="text-emerald-600 dark:text-emerald-300">{log.authMethod || 'Password'}</span></div>
                          <div><span className="text-gray-500">Screen Resolution:</span> <span className="text-gray-900 dark:text-white">{log.screenResolution || '—'}</span></div>
                          <div><span className="text-gray-500">ISP Provider:</span> <span className="text-gray-900 dark:text-white">{log.isp || '—'}</span></div>
                          <div><span className="text-gray-500">Account UID:</span> <span className="text-gray-600 dark:text-gray-400 break-all">{log.userId || '—'}</span></div>
                          <div><span className="text-gray-500">Record Document ID:</span> <span className="text-gray-600 dark:text-gray-400">{log.id}</span></div>
                        </div>

                        <div className="pt-2">
                          <div className="text-gray-500 text-[10px] uppercase">User-Agent Header:</div>
                          <div className="p-2 bg-gray-100 dark:bg-black/90 rounded text-[11px] text-gray-700 dark:text-gray-400 break-all mt-1 select-all border border-gray-200 dark:border-white/5">
                            {log.userAgent || '—'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Single "Delete All" Master Button */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass-md p-6 rounded-3xl border border-red-500/30 bg-white dark:bg-gray-900 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Purge All Login Logs?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Master Audit Deletion</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              This will permanently delete all <strong className="text-gray-900 dark:text-white font-mono">{logs.length}</strong> login audit records from your Firestore database. 
              <br /><br />
              As per security guidelines, individual records cannot be removed one-by-one. This single master button is the only action that clears the log history.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handlePurgeAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-red-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isPurging ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete All Logs</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

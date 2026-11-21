import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Save, User, Briefcase, Award, FolderCode, Cog, ChevronRight, ChevronUp, ChevronDown, X, Image as ImageIcon, Loader2, ArrowLeft, Mail, Activity, BookOpen, Settings, Lock, Eye, Key, ShieldCheck, Brain, FileText, Upload, CheckCircle2, Cpu, Copy, Clock, Globe, Phone, MessageSquare, Linkedin, Github, Video, Play, Terminal, Search, Laptop, Smartphone, Check
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, setDoc, limit, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, auth } from '../lib/firebase';
import { Experience, Project, Certificate, Skill, Profile, Message, Visit, Blog, AppSettings, Specialization, ContactMethod } from '../types';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { isVideoMedia, extractVideoInfo, captureVideoFrame, getProjectDisplayMedia } from '../lib/videoUtils';
import { AVAILABLE_SERVICE_ICONS, getServiceIcon } from '../lib/iconMap';
import OpsVaultEditor from '../components/admin/OpsVaultEditor';
import SecurityLogsViewer from '../components/admin/SecurityLogsViewer';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'projects' | 'certificates' | 'skills' | 'specializations' | 'blogs' | 'contact' | 'settings' | 'messages' | 'analytics' | 'ops_vault' | 'security_logs'>('profile');

  useEffect(() => {
    document.title = `Admin | ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
  }, [activeTab]);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => console.log('API Health Check:', d))
      .catch(e => console.error('API Health Check failed:', e));
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your portfolio content in real-time.</p>
        </div>
        <Link to="/" className="btn-secondary w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Website
        </Link>
      </div>

      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'specializations', label: 'Specializations', icon: Brain },
          { id: 'experience', label: 'Experience', icon: Briefcase },
          { id: 'projects', label: 'Projects', icon: FolderCode },
          { id: 'certificates', label: 'Certificates', icon: Award },
          { id: 'skills', label: 'Services', icon: Cog },
          { id: 'ops_vault', label: 'Cyber Ops & Vault', icon: Terminal },
          { id: 'security_logs', label: 'Login Logs', icon: ShieldCheck },
          { id: 'blogs', label: 'Blogs', icon: BookOpen },
          { id: 'contact', label: 'Contact Section', icon: Mail },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'messages', label: 'Inbox', icon: Mail },
          { id: 'analytics', label: 'Analytics', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'glass-xl text-blue-500 shadow-lg' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="glass-md p-8 rounded-[2.5rem]">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && <ProfileEditor key="profile" />}
          {activeTab === 'specializations' && <SpecializationEditor key="specializations" />}
          {activeTab === 'experience' && <ExperienceEditor key="experience" />}
          {activeTab === 'projects' && <ProjectEditor key="projects" />}
          {activeTab === 'certificates' && <CertificateEditor key="certificates" />}
          {activeTab === 'skills' && <SkillEditor key="skills" />}
          {activeTab === 'ops_vault' && <OpsVaultEditor key="ops_vault" />}
          {activeTab === 'security_logs' && <SecurityLogsViewer key="security_logs" />}
          {activeTab === 'blogs' && <BlogEditor key="blogs" />}
          {activeTab === 'contact' && <ContactSectionEditor key="contact" />}
          {activeTab === 'settings' && <AppSettingsEditor key="settings" />}
          {activeTab === 'messages' && <MessageEditor key="messages" />}
          {activeTab === 'analytics' && <AnalyticsViewer key="analytics" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnalyticsViewer() {
  const [items, setItems] = useState<Visit[]>([]);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyVal = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };
  const [counts, setCounts] = useState({
    projects: 0,
    certificates: 0,
    blogs: 0,
    skills: 0,
    messages: 0
  });

  const [blobStats, setBlobStats] = useState({ usedBytes: 0, totalBytes: 0, usedPercentage: 0, fileCount: 0 });
  const [loadingBlobs, setLoadingBlobs] = useState(true);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateSafe = (dateVal: any) => {
    if (!dateVal) return '—';
    try {
      let dateObj: Date;
      if (typeof dateVal === 'object' && dateVal && 'seconds' in dateVal) {
        dateObj = new Date(dateVal.seconds * 1000);
      } else {
        dateObj = new Date(dateVal);
      }
      if (isNaN(dateObj.getTime())) return '—';
      return dateObj.toLocaleDateString();
    } catch (e) {
      return '—';
    }
  };

  const formatTimeSafe = (dateVal: any) => {
    if (!dateVal) return '—';
    try {
      let dateObj: Date;
      if (typeof dateVal === 'object' && dateVal && 'seconds' in dateVal) {
        dateObj = new Date(dateVal.seconds * 1000);
      } else {
        dateObj = new Date(dateVal);
      }
      if (isNaN(dateObj.getTime())) return '—';
      return dateObj.toLocaleTimeString();
    } catch (e) {
      return '—';
    }
  };

  useEffect(() => {
    const fetchBlobs = async () => {
      try {
        const res = await fetch('/api/analytics/blobs');
        const data = await res.json();
        setBlobStats(data);
      } catch (e) {
        console.error('Blob fetch failed', e);
      } finally {
        setLoadingBlobs(false);
      }
    };
    fetchBlobs();

    const q = query(collection(db, 'visits'), orderBy('startTime', 'desc'), limit(100));
    const unsubVisits = onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Visit))), (error) => handleFirestoreError(error, OperationType.GET, 'visits'));

    // Resource Counts
    const unsubCounts = [
      onSnapshot(collection(db, 'projects'), s => setCounts(prev => ({...prev, projects: s.size}))),
      onSnapshot(collection(db, 'certificates'), s => setCounts(prev => ({...prev, certificates: s.size}))),
      onSnapshot(collection(db, 'blogs'), s => setCounts(prev => ({...prev, blogs: s.size}))),
      onSnapshot(collection(db, 'skills'), s => setCounts(prev => ({...prev, skills: s.size}))),
      onSnapshot(collection(db, 'messages'), s => setCounts(prev => ({...prev, messages: s.size}))),
    ];

    return () => {
      unsubVisits();
      unsubCounts.forEach(u => u());
    };
  }, []);

  const totalVisits = items.length;
  const avgDuration = items.length > 0 
    ? Math.round(items.reduce((acc, curr) => acc + (curr.duration || 0), 0) / items.length)
    : 0;

  const wipeLogs = async () => {
    if (!window.confirm("CRITICAL: This will erase all recent signal history. This action is irreversible. Proceed?")) return;
    try {
      const deletePromises = items.map(item => deleteDoc(doc(db, 'visits', item.id!)));
      await Promise.all(deletePromises);
      alert('Signal history purged successfully.');
    } catch (error) {
      console.error('Purge error:', error);
      alert('Failed to purge history.');
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Visits" value={totalVisits.toString()} sub="Recent Signals" />
        <StatCard label="Engagement" value={`${avgDuration}s`} sub="Avg. Session" />
        <StatCard label="Inbox" value={counts.messages.toString()} sub="Contact Signals" color="text-blue-500" />
        <StatCard label="Security" value="Active" sub="Threat Monitoring" color="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center"><Activity className="mr-2 w-5 h-5 text-blue-500" /> Infrastructure Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResourceCard 
              name="Firebase Firestore" 
              status="Healthy" 
              items={[
                { label: 'Projects', count: counts.projects },
                { label: 'Certs', count: counts.certificates },
                { label: 'Blogs', count: counts.blogs },
                { label: 'Skills', count: counts.skills }
              ]}
              usage="0.4% of Free Tier"
              limit="1GiB Storage / 50k Reads Daily"
            />
            <ResourceCard 
              name="Netlify Blobs (Storage)" 
              status="Active" 
              items={[
                { label: 'Used Storage', count: formatBytes(blobStats.usedBytes) as any },
                { label: 'Free Space', count: formatBytes(blobStats.totalBytes - blobStats.usedBytes) as any },
                { label: 'Total Capacity', count: formatBytes(blobStats.totalBytes) as any },
                { label: 'Resource Count', count: blobStats.fileCount as any }
              ]}
              usage={`Consumption: ${blobStats.usedPercentage.toFixed(4)}%`}
              limit={`${formatBytes(blobStats.totalBytes)} Free Tier Bucket`}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center"><ShieldCheck className="mr-2 w-5 h-5 text-blue-500" /> Resource Guard</h3>
          <div className="glass-sm p-6 rounded-3xl space-y-4">
             <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 uppercase font-mono">Storage Integrity</span>
                <span className="text-green-500 font-bold">100%</span>
             </div>
             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-full h-full bg-green-500" />
             </div>
             <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-mono opacity-60">
                Resource monitoring is strictly observational. No instability detected in edge synchronization or database I/O.
             </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Signal History</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Real-time telemetry and network footprint from website visitors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={wipeLogs}
              disabled={items.length === 0}
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Access Logs</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signals by IP, path, city, country, browser, OS, ISP, or session ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Cards List with Expanding Forensic Drawers */}
        {(() => {
          const cleanVal = (val?: string, fallback = '—') => {
            if (!val) return fallback;
            const v = val.toLowerCase().trim();
            if (v === 'unknown' || v === '(unknown)') return fallback;
            return val;
          };

          const getRelativeTime = (dateVal: any) => {
            if (!dateVal) return '';
            try {
              let dateObj: Date;
              if (typeof dateVal === 'object' && dateVal && 'seconds' in dateVal) {
                dateObj = new Date(dateVal.seconds * 1000);
              } else {
                dateObj = new Date(dateVal);
              }
              if (isNaN(dateObj.getTime())) return '';
              const now = Date.now();
              const diff = Math.floor((now - dateObj.getTime()) / 1000);
              if (diff < 30) return 'Just now';
              if (diff < 60) return `${diff}s ago`;
              if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
              if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
              return `${Math.floor(diff / 86400)}d ago`;
            } catch {
              return '';
            }
          };

          const q = search.toLowerCase().trim();
          const filteredVisits = items.filter(visit => {
            if (!q) return true;
            return (
              visit.ip?.toLowerCase().includes(q) ||
              visit.path?.toLowerCase().includes(q) ||
              visit.city?.toLowerCase().includes(q) ||
              visit.country?.toLowerCase().includes(q) ||
              visit.countryCode?.toLowerCase().includes(q) ||
              visit.region?.toLowerCase().includes(q) ||
              visit.isp?.toLowerCase().includes(q) ||
              visit.browser?.toLowerCase().includes(q) ||
              visit.os?.toLowerCase().includes(q) ||
              visit.deviceType?.toLowerCase().includes(q) ||
              visit.referrer?.toLowerCase().includes(q) ||
              visit.sessionId?.toLowerCase().includes(q)
            );
          });

          if (filteredVisits.length === 0) {
            return (
              <div className="p-12 text-center text-gray-400 glass-md rounded-2xl border border-white/5 space-y-2">
                <Activity className="w-8 h-8 text-gray-500 mx-auto" />
                <div className="font-bold text-white text-sm">No Signal History Recorded</div>
                <p className="text-xs text-gray-400">
                  {search ? 'No visitor signals match your search filter.' : 'Live visitor session signals will appear here.'}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {filteredVisits.map(visit => {
                const isExpanded = expandedVisitId === visit.id;
                const relTime = getRelativeTime(visit.startTime);

                return (
                  <div
                    key={visit.id}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all duration-200 space-y-3"
                  >
                    {/* Header Line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          <span>{visit.path || '/'}</span>
                        </span>

                        <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {visit.duration || 0}s session
                        </span>

                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{formatDateSafe(visit.startTime)} {formatTimeSafe(visit.startTime)}</span>
                          {relTime && (
                            <span className="text-blue-400 font-semibold">({relTime})</span>
                          )}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => setExpandedVisitId(isExpanded ? null : (visit.id || ''))}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono flex items-center gap-1 transition-colors"
                        >
                          <span>{isExpanded ? 'Less' : 'Inspect'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Delete this visit log?')) {
                              deleteDoc(doc(db, 'visits', visit.id!));
                            }
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete log entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 4-Box Telemetry Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                      {/* IP Address */}
                      <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <div className="text-[10px] text-gray-500 uppercase">IP ADDRESS</div>
                          <div className="text-blue-400 font-bold truncate mt-0.5">{cleanVal(visit.ip, 'Localhost / Unknown')}</div>
                        </div>
                        {visit.ip && (
                          <button
                            onClick={() => copyVal(`ip_${visit.id}`, visit.ip || '')}
                            className="text-gray-400 hover:text-white transition-colors shrink-0 p-1"
                            title="Copy IP"
                          >
                            {copiedKey === `ip_${visit.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Location */}
                      <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 truncate">
                        <div className="text-[10px] text-gray-500 uppercase">LOCATION</div>
                        <div className="text-white font-semibold truncate mt-0.5 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">
                            {[cleanVal(visit.city, ''), cleanVal(visit.countryCode || visit.country, '')].filter(Boolean).join(', ') || 'Localhost / Unknown'}
                          </span>
                        </div>
                      </div>

                      {/* OS & Device */}
                      <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 truncate">
                        <div className="text-[10px] text-gray-500 uppercase">DEVICE & OS</div>
                        <div className="text-purple-300 font-semibold truncate mt-0.5 flex items-center gap-1">
                          {visit.deviceType === 'Mobile' ? <Smartphone className="w-3 h-3 shrink-0" /> : <Laptop className="w-3 h-3 shrink-0" />}
                          <span className="truncate">{cleanVal(visit.os, 'Unknown OS')} ({cleanVal(visit.deviceType, 'Desktop')})</span>
                        </div>
                      </div>

                      {/* Browser & ISP */}
                      <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 truncate">
                        <div className="text-[10px] text-gray-500 uppercase">BROWSER & ISP</div>
                        <div className="text-gray-200 font-semibold truncate mt-0.5">
                          {cleanVal(visit.browser, 'Browser')} • <span className="text-gray-400">{cleanVal(visit.isp, 'Internal')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanding Forensic Drawer */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-4 bg-black/80 rounded-xl border border-white/10 font-mono text-xs space-y-4 text-gray-300 overflow-x-auto"
                      >
                        <div className="text-xs font-bold text-blue-400 flex items-center justify-between pb-1 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Security Telemetry Log — Visit Session Signal</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-normal">ID: {visit.id}</span>
                        </div>

                        {/* Bento Grid keeping every single piece of information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Session Identity Card */}
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                            <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                              <Activity className="w-3.5 h-3.5" />
                              <span>Session Identity</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <div className="text-gray-500 text-[10px] uppercase">Session ID</div>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <span className="font-mono text-white break-all select-all">{visit.sessionId || 'N/A'}</span>
                                  {visit.sessionId && (
                                    <button
                                      onClick={() => copyVal(`sess_${visit.id}`, visit.sessionId || '')}
                                      className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all shrink-0"
                                      title="Copy Session ID"
                                    >
                                      {copiedKey === `sess_${visit.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Total Duration</div>
                                  <div className="font-bold text-emerald-400">{visit.duration || 0} seconds</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Active Path</div>
                                  <div className="font-bold text-blue-400 truncate" title={visit.path}>{visit.path || '/'}</div>
                                </div>
                              </div>
                              <div className="pt-1">
                                <div className="text-gray-500 text-[10px] uppercase">Referrer Source</div>
                                <div className="text-gray-300 truncate font-mono" title={visit.referrer}>{cleanVal(visit.referrer, 'Direct / Internal')}</div>
                              </div>
                            </div>
                          </div>

                          {/* Timing Telemetry Card */}
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                            <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Timing Telemetry</span>
                            </div>
                            <div className="space-y-2 text-[11px]">
                              <div>
                                <div className="text-gray-500 text-[10px] uppercase">Start Time</div>
                                <div className="text-white font-mono">
                                  {visit.startTime ? `${formatDateSafe(visit.startTime)} at ${formatTimeSafe(visit.startTime)}` : 'N/A'}
                                </div>
                              </div>
                              <div className="pt-1.5 border-t border-white/5">
                                <div className="text-gray-500 text-[10px] uppercase">Last Active (Heartbeat)</div>
                                <div className="text-white font-mono">
                                  {visit.endTime ? `${formatDateSafe(visit.endTime)} at ${formatTimeSafe(visit.endTime)}` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Geolocation & Network Card */}
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                            <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Geolocation & Network</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <div className="text-gray-500 text-[10px] uppercase">IP Address</div>
                                <div className="text-blue-400 font-bold">{cleanVal(visit.ip, 'Localhost / Intranet')}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">City / Region</div>
                                  <div className="text-white">
                                    {cleanVal(visit.city, 'N/A')}{visit.region ? `, ${visit.region}` : ''}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Country</div>
                                  <div className="text-white">
                                    {cleanVal(visit.country, 'N/A')} {visit.countryCode ? `(${visit.countryCode})` : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="pt-1 border-t border-white/5">
                                <div className="text-gray-500 text-[10px] uppercase">Network Provider (ISP)</div>
                                <div className="text-gray-300 truncate" title={visit.isp}>{cleanVal(visit.isp, 'Internal / Cloudflare')}</div>
                              </div>
                            </div>
                          </div>

                          {/* Client Platform Card */}
                          <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-2">
                            <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Client Platform</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Device Type</div>
                                  <div className="text-white">{cleanVal(visit.deviceType, 'Desktop')}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Operating System</div>
                                  <div className="text-white">{cleanVal(visit.os, 'N/A')}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Browser</div>
                                  <div className="text-white">{cleanVal(visit.browser, 'N/A')}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 text-[10px] uppercase">Screen Frame</div>
                                  <div className="text-white font-mono">{cleanVal(visit.screenResolution, 'N/A')}</div>
                                </div>
                              </div>
                              <div className="pt-1 border-t border-white/5">
                                <div className="text-gray-500 text-[10px] uppercase">Language</div>
                                <div className="text-white font-mono">{cleanVal(visit.language, 'N/A')}</div>
                              </div>
                            </div>
                          </div>

                          {/* Raw User Agent Header */}
                          <div className="md:col-span-2 p-3.5 rounded-xl bg-black/50 border border-white/5 space-y-1">
                            <div className="text-gray-500 text-[10px] uppercase">Raw User Agent Header</div>
                            <div className="text-[11px] font-mono text-gray-400 break-all leading-relaxed bg-black/90 p-2.5 rounded-lg border border-white/5 select-all">
                              {visit.userAgent || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function MessageEditor() {
  const [items, setItems] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Message))), (error) => handleFirestoreError(error, OperationType.GET, 'messages'));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Secure Messages</h2>
      </div>
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-mono text-xs uppercase tracking-widest">
            No signals received yet.
          </div>
        ) : (
          items.map(msg => (
            <div key={msg.id} className="glass-sm p-6 rounded-2xl flex items-center justify-between group">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-lg">{msg.name}</h4>
                  <span className="text-[10px] text-gray-400 font-mono">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-blue-500">{msg.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">{msg.message}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setSelected(msg)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => deleteDoc(doc(db, 'messages', msg.id!))} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        ))}
      </div>
      {selected && (
        <Modal title="Signal Details" onClose={() => setSelected(null)} onSave={() => setSelected(null)}>
          <div className="glass-sm p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-2xl font-black uppercase tracking-tight">{selected.name}</h4>
                <p className="text-blue-500 font-mono text-sm">{selected.email}</p>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">{new Date(selected.timestamp).toLocaleString()}</p>
            </div>
            <div className="h-px bg-white/10" />
            <p className="whitespace-pre-wrap text-lg leading-relaxed">{selected.message}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'profile', 'main');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as Profile);
      } else {
        setProfile({
          name: 'Abdulrahman Kamal',
          title: 'Cybersecurity Engineer',
          bio: '',
          location: 'Aden, Yemen',
          email: 'Abdulrahmankamal609@gmail.com',
          phone: '',
          linkedin: '',
          github: '',
          photoUrl: ''
        });
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'profile/main'));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { specializations, ...cleanProfile } = profile;
      await setDoc(doc(db, 'profile', 'main'), {
        ...cleanProfile,
        specializations: []
      });
      alert('Profile updated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'profile/main');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div>Loading Profile...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Name" value={profile.name} onChange={v => setProfile({...profile, name: v})} />
        <Input label="Title" value={profile.title} onChange={v => setProfile({...profile, title: v})} />
        <div className="md:col-span-2">
          <Input label="Bio" value={profile.bio} onChange={v => setProfile({...profile, bio: v})} textarea />
        </div>
        <div className="md:col-span-2">
           <FileUpload 
            label="Curriculum Vitae (PDF)" 
            value={profile.cvUrl || ''} 
            onChange={v => setProfile({...profile, cvUrl: v})} 
            path="cv" 
            targetId="main"
            accept="application/pdf"
          />
        </div>
        <Input label="Email" value={profile.email} onChange={v => setProfile({...profile, email: v})} />
        <Input label="Phone" value={profile.phone} onChange={v => setProfile({...profile, phone: v})} />
        <Input label="LinkedIn" value={profile.linkedin} onChange={v => setProfile({...profile, linkedin: v})} />
        <Input label="GitHub" value={profile.github} onChange={v => setProfile({...profile, github: v})} />
        <div className="md:col-span-2">
          <ImageUpload 
            label="Profile Photo" 
            value={profile.photoUrl || ''} 
            onChange={v => setProfile({...profile, photoUrl: v})} 
            path="profile" 
            targetId="main"
          />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        <Save className="w-5 h-5 mr-2" /> Save Profile
      </button>
    </form>
  );
}

function ExperienceEditor() {
  const [items, setItems] = useState<Experience[]>([]);
  const [editing, setEditing] = useState<Experience | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'experiences'), orderBy('order', 'asc'));
    return onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Experience))), (error) => handleFirestoreError(error, OperationType.GET, 'experiences'));
  }, []);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = items[index];
    const targetItem = items[targetIndex];

    if (!currentItem.id || !targetItem.id) return;

    const currentOrder = currentItem.order !== undefined ? currentItem.order : index;
    const targetOrder = targetItem.order !== undefined ? targetItem.order : targetIndex;

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;

    if (currentOrder === targetOrder) {
      newCurrentOrder = direction === 'up' ? targetOrder - 1 : targetOrder + 1;
    }

    try {
      await updateDoc(doc(db, 'experiences', currentItem.id), { order: newCurrentOrder });
      await updateDoc(doc(db, 'experiences', targetItem.id), { order: newTargetOrder });
    } catch (error) {
      console.error("Error swapping experience orders:", error);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...data } = editing;
    if (id) await updateDoc(doc(db, 'experiences', id), data);
    else await addDoc(collection(db, 'experiences'), data);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Experiences</h2>
        <button className="btn-secondary" onClick={() => setEditing({ company: '', position: '', location: '', period: '', description: '', bullets: [], order: items.length, images: [] })}>
          <Plus className="w-5 h-5 mr-2" /> Add
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <ListItem 
            key={item.id} 
            title={item.position || item.company} 
            subtitle={item.position ? item.company : ''} 
            imageUrl={item.imageUrl}
            onEdit={() => setEditing(item)} 
            onDelete={() => deleteDoc(doc(db, 'experiences', item.id!))}
            onMoveUp={() => handleMove(index, 'up')}
            onMoveDown={() => handleMove(index, 'down')}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
      {editing && (
        <Modal title="Edit Experience" onClose={() => setEditing(null)} onSave={save}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company" value={editing.company} onChange={v => setEditing({...editing, company: v})} />
            <Input label="Position" value={editing.position} onChange={v => setEditing({...editing, position: v})} />
            <Input label="Location" value={editing.location} onChange={v => setEditing({...editing, location: v})} />
            <Input label="Period" value={editing.period} onChange={v => setEditing({...editing, period: v})} />
            <div className="md:col-span-2">
              <Input label="Order (Position Index)" value={editing.order !== undefined ? editing.order.toString() : ''} onChange={v => setEditing({...editing, order: parseInt(v) || 0})} />
            </div>
            <div className="md:col-span-2">
              <Input label="Description" value={editing.description} onChange={v => setEditing({...editing, description: v})} textarea />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">Bullets (one per line)</label>
              <textarea 
                className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 font-sans text-sm text-[#1D1D1F] dark:text-[#F5F5F7] bg-white/5" 
                rows={5}
                value={editing.bullets?.join('\n') || ''}
                onChange={e => setEditing({...editing, bullets: e.target.value.split('\n')})}
              />
            </div>
            <div className="md:col-span-2">
              <MultiImageUpload 
                label="Experience Images (Certificate/Badge/Photos)" 
                images={editing.images || []}
                onChange={imgs => setEditing({...editing, images: imgs})}
                path="experiences"
                targetId={editing.id || 'new'}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <Input label="Link URL" value={editing.link?.url || ''} onChange={v => setEditing({...editing, link: { ...editing.link!, url: v, text: editing.link?.text || 'Visit' }})} />
              <Input label="Link Text" value={editing.link?.text || ''} onChange={v => setEditing({...editing, link: { ...editing.link!, text: v, url: editing.link?.url || '' }})} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProjectVideoUpload({
  videoUrl,
  videoThumbnail,
  onUpdateMedia,
  projectId
}: {
  videoUrl: string;
  videoThumbnail: string;
  onUpdateMedia: (updates: { videoUrl?: string; videoThumbnail?: string }) => void;
  projectId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [urlInput, setUrlInput] = useState(videoUrl || '');

  useEffect(() => {
    setUrlInput(videoUrl || '');
  }, [videoUrl]);

  // Auto-detect previously uploaded video file on server if videoUrl is currently empty
  useEffect(() => {
    if (projectId && projectId !== 'new' && !videoUrl) {
      fetch(`/api/projects/detect-video/${projectId}`)
        .then(r => r.json())
        .then(res => {
          if (res?.videoUrl) {
            setUrlInput(res.videoUrl);
            onUpdateMedia({ videoUrl: res.videoUrl });
          }
        })
        .catch(() => {});
    }
  }, [projectId, videoUrl]);

  const handleDeleteVideo = () => {
    setUrlInput('');
    onUpdateMedia({ videoUrl: '', videoThumbnail: '' });
  };

  const handleClearThumbnail = () => {
    onUpdateMedia({ videoThumbnail: '' });
  };

  const handleClearUrlOnly = () => {
    setUrlInput('');
    onUpdateMedia({ videoUrl: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: Netlify serverless functions enforce a 6MB payload limit
    if (file.size > 5.8 * 1024 * 1024) {
      alert(
        `Video file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds Netlify's 6MB serverless upload limit.\n\nFor larger videos, please upload to YouTube or Vimeo, or host the MP4 externally, and paste the URL in the field below!`
      );
      return;
    }

    setUploading(true);
    setCapturing(true);

    let thumbDataUrl = '';
    try {
      thumbDataUrl = await captureVideoFrame(file, 0.5);
    } catch (err) {
      console.warn('Frame capture failed:', err);
    }

    try {
      const formData = new FormData();
      // Append under both 'video' and 'file' keys for maximum server & Netlify compatibility
      formData.append('video', file);
      formData.append('file', file);

      const extension = file.name.split('.').pop() || 'mp4';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
      const targetFilename = `projects_video_${projectId}_${uniqueSuffix}.${extension}`;

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-target-filename': encodeURIComponent(targetFilename)
        }
      });

      if (!response.ok) {
        let errMessage = `Upload failed with HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch (_) {
          try {
            const text = await response.text();
            if (text) errMessage = text.slice(0, 150);
          } catch (_) {}
        }
        if (response.status === 413) {
          errMessage = "File exceeds Netlify's 6MB upload limit. Please use a video URL instead.";
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      setUrlInput(data.url);
      onUpdateMedia({
        videoUrl: data.url,
        ...(thumbDataUrl ? { videoThumbnail: thumbDataUrl } : {})
      });
    } catch (err: any) {
      console.error('Video upload error:', err);
      alert(err.message || 'Failed to upload video.');
    } finally {
      setUploading(false);
      setCapturing(false);
    }
  };

  const handleUrlBlur = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      if (!videoUrl) {
        onUpdateMedia({ videoUrl: '', videoThumbnail: '' });
      }
      return;
    }
    onUpdateMedia({ videoUrl: trimmed });

    // If thumbnail is empty, extract/capture it automatically
    if (!videoThumbnail) {
      const yt = extractVideoInfo(trimmed);
      if (yt.type === 'youtube' && yt.thumbnailUrl) {
        onUpdateMedia({ videoUrl: trimmed, videoThumbnail: yt.thumbnailUrl });
      } else if (isVideoMedia(trimmed)) {
        setCapturing(true);
        try {
          const thumb = await captureVideoFrame(trimmed, 0.5);
          if (thumb) onUpdateMedia({ videoUrl: trimmed, videoThumbnail: thumb });
        } catch (err) {
          console.warn('Could not extract thumbnail:', err);
        } finally {
          setCapturing(false);
        }
      }
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const extension = file.name.split('.').pop();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
      const targetFilename = `projects_videothumb_${projectId}_${uniqueSuffix}.${extension}`;

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-target-filename': encodeURIComponent(targetFilename)
        }
      });

      if (!response.ok) throw new Error('Thumbnail upload failed');
      const data = await response.json();
      onUpdateMedia({ videoThumbnail: data.url });
    } catch (err) {
      console.error('Upload thumbnail error:', err);
      alert('Failed to upload thumbnail.');
    }
  };

  const activeVideo = (videoUrl || urlInput || '').trim();
  const videoInfo = activeVideo ? extractVideoInfo(activeVideo) : null;
  const hasAnyVideoData = Boolean(activeVideo || videoThumbnail);

  return (
    <div className="space-y-4 p-5 rounded-2xl glass-sm border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
          <Video className="w-4 h-4" />
          <span>Project Video & Thumbnail</span>
        </label>
        {hasAnyVideoData && (
          <button
            type="button"
            onClick={handleDeleteVideo}
            className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all cursor-pointer shadow-sm"
            title="Delete video and its thumbnail"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Video
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload file or enter URL */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Upload Video File (MP4, WebM, MOV — Max 6MB for direct upload)
            </label>
            <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-gray-300 dark:border-white/10 hover:border-blue-500/50 cursor-pointer bg-white/5 hover:bg-blue-500/5 transition-all text-xs font-bold text-gray-700 dark:text-gray-300">
              <input
                type="file"
                accept="video/*,.mp4,.webm,.mov,.ogg,.m4v"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <span className="flex items-center gap-2 text-blue-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading Video...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>{activeVideo ? 'Replace Video File' : 'Upload Video File'}</span>
                </span>
              )}
            </label>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Or Video / YouTube / Vimeo URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. https://www.youtube.com/watch?v=... or direct mp4 url"
                value={urlInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrlInput(val);
                  onUpdateMedia({
                    videoUrl: val.trim(),
                    ...(!val.trim() && !videoThumbnail ? { videoThumbnail: '' } : {})
                  });
                }}
                onBlur={handleUrlBlur}
                className="w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500 font-mono"
              />
              {activeVideo && (
                <button
                  type="button"
                  onClick={handleClearUrlOnly}
                  className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 flex-shrink-0 transition-colors"
                  title="Clear Video URL"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Thumbnail Preview */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
            Video Thumbnail Preview {capturing && '(Capturing frame...)'}
          </label>
          <div className="flex gap-4 items-center">
            <div className="w-32 aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 relative flex items-center justify-center flex-shrink-0">
              {videoThumbnail ? (
                <img src={videoThumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
              ) : activeVideo && !videoInfo?.embedUrl ? (
                <video src={`${activeVideo}#t=0.001`} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
              ) : (
                <div className="flex flex-col items-center text-gray-500 text-[9px] uppercase font-mono">
                  <Video className="w-5 h-5 mb-1 opacity-50" />
                  <span>No Thumbnail</span>
                </div>
              )}
              {activeVideo && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 hover:bg-white/10 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                  <ImageIcon className="w-3 h-3 text-blue-500" />
                  <span>{videoThumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}</span>
                </label>
                {videoThumbnail && (
                  <button
                    type="button"
                    onClick={handleClearThumbnail}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    title="Remove Thumbnail only"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Thumbnail
                  </button>
                )}
              </div>
              <p className="text-[9px] text-gray-500 leading-tight">
                Used as the project picture when the video thumbnail setting is active in Settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Video Preview if URL exists */}
      {activeVideo && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Active Video Stream</span>
            </div>
            <button
              type="button"
              onClick={handleDeleteVideo}
              className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Video
            </button>
          </div>
          <div className="aspect-video max-h-48 rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center relative shadow-lg">
            {videoInfo?.type === 'youtube' && videoInfo.embedUrl ? (
              <iframe
                src={videoInfo.embedUrl}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Preview"
              />
            ) : videoInfo?.type === 'vimeo' && videoInfo.embedUrl ? (
              <iframe
                src={videoInfo.embedUrl}
                className="w-full h-full border-none"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Preview"
              />
            ) : (
              <video
                src={activeVideo}
                controls
                className="w-full h-full max-h-48 object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectEditor() {
  const [items, setItems] = useState<Project[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('order', 'asc'));
    const unsubProjects = onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Project))), (error) => handleFirestoreError(error, OperationType.GET, 'projects'));
    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (s) => {
      if (s.exists()) setSettings(s.data() as AppSettings);
    });
    return () => {
      unsubProjects();
      unsubSettings();
    };
  }, []);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = items[index];
    const targetItem = items[targetIndex];

    if (!currentItem.id || !targetItem.id) return;

    const currentOrder = currentItem.order !== undefined ? currentItem.order : index;
    const targetOrder = targetItem.order !== undefined ? targetItem.order : targetIndex;

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;

    if (currentOrder === targetOrder) {
      newCurrentOrder = direction === 'up' ? targetOrder - 1 : targetOrder + 1;
    }

    try {
      await updateDoc(doc(db, 'projects', currentItem.id), { order: newCurrentOrder });
      await updateDoc(doc(db, 'projects', targetItem.id), { order: newTargetOrder });
    } catch (error) {
      console.error("Error swapping project orders:", error);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...data } = editing;
    const cleanData = {
      ...data,
      videoUrl: (editing.videoUrl || '').trim(),
      videoThumbnail: (editing.videoThumbnail || '').trim(),
      images: editing.images || [],
    };
    if (id) await updateDoc(doc(db, 'projects', id), cleanData);
    else await addDoc(collection(db, 'projects'), cleanData);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Projects</h2>
        <button className="btn-secondary" onClick={() => setEditing({ title: '', description: '', technologies: [], order: items.length, images: [], videoUrl: '', videoThumbnail: '', inProgress: false })}>
          <Plus className="w-5 h-5 mr-2" /> Add
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => {
          const displayMedia = getProjectDisplayMedia(item, settings?.showVideoThumbnailAsProjectImage);
          return (
            <ListItem 
              key={item.id} 
              title={item.title} 
              subtitle={item.technologies.join(', ') + (item.inProgress ? ' (In Progress)' : '') + (item.videoUrl ? ' • [Video Attached]' : '')} 
              imageUrl={displayMedia.pictureUrl} 
              onEdit={() => setEditing(item)} 
              onDelete={() => deleteDoc(doc(db, 'projects', item.id!))}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            />
          );
        })}
      </div>
      {editing && (
        <Modal title="Edit Project" onClose={() => setEditing(null)} onSave={save}>
          <div className="space-y-4">
            <Input label="Title" value={editing.title} onChange={v => setEditing({...editing, title: v})} />
            <Input label="Description" value={editing.description} onChange={v => setEditing({...editing, description: v})} textarea />
            <Input label="Tech Stack (comma separated)" value={editing.technologies.join(',')} onChange={v => setEditing({...editing, technologies: v.split(',').map(s => s.trim())})} />
            <Input label="Order (Position Index)" value={editing.order !== undefined ? editing.order.toString() : ''} onChange={v => setEditing({...editing, order: parseInt(v) || 0})} />
            
            <div className="flex items-center space-x-3 p-4 glass-sm rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
              <input 
                id="proj-inprogress-checkbox"
                type="checkbox" 
                checked={editing.inProgress || false} 
                onChange={e => setEditing({...editing, inProgress: e.target.checked})}
                className="w-5 h-5 rounded border-white/10 text-blue-500 focus:ring-blue-500/30 cursor-pointer"
              />
              <label htmlFor="proj-inprogress-checkbox" className="text-sm font-semibold select-none cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7]">
                Mark as In Progress (Displays a dim overlay with "In Progress")
              </label>
            </div>

            <ProjectVideoUpload 
              videoUrl={editing.videoUrl || ''} 
              videoThumbnail={editing.videoThumbnail || ''} 
              onUpdateMedia={updates => setEditing(prev => prev ? ({ ...prev, ...updates }) : null)} 
              projectId={editing.id || 'new'} 
            />

            <MultiImageUpload 
              label="Project Showcase Media (Images & Gallery)" 
              images={editing.images || []}
              onChange={imgs => setEditing({...editing, images: imgs})}
              path="projects"
              targetId={editing.id || 'new'}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Live Link URL" value={editing.link?.url || ''} onChange={v => setEditing({...editing, link: { ...editing.link!, url: v, text: editing.link?.text || 'Live Demo' }})} />
              <Input label="Live Link Text" value={editing.link?.text || ''} onChange={v => setEditing({...editing, link: { ...editing.link!, text: v, url: editing.link?.url || '' }})} />
            </div>
            <Input label="GitHub Link" value={editing.githubLink || ''} onChange={v => setEditing({...editing, githubLink: v})} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function CertificateEditor() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [editing, setEditing] = useState<Certificate | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'certificates'), orderBy('order', 'asc'));
    return onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Certificate))), (error) => handleFirestoreError(error, OperationType.GET, 'certificates'));
  }, []);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = items[index];
    const targetItem = items[targetIndex];

    if (!currentItem.id || !targetItem.id) return;

    const currentOrder = currentItem.order !== undefined ? currentItem.order : index;
    const targetOrder = targetItem.order !== undefined ? targetItem.order : targetIndex;

    let newCurrentOrder = targetOrder;
    let newTargetOrder = currentOrder;

    if (currentOrder === targetOrder) {
      newCurrentOrder = direction === 'up' ? targetOrder - 1 : targetOrder + 1;
    }

    try {
      await updateDoc(doc(db, 'certificates', currentItem.id), { order: newCurrentOrder });
      await updateDoc(doc(db, 'certificates', targetItem.id), { order: newTargetOrder });
    } catch (error) {
      console.error("Error swapping certificate orders:", error);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...data } = editing;
    if (id) await updateDoc(doc(db, 'certificates', id), data);
    else await addDoc(collection(db, 'certificates'), data);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Certificates</h2>
        <button className="btn-secondary" onClick={() => setEditing({ name: '', issuer: '', date: '', order: items.length, images: [], worth: 0, inProgress: false, description: '' })}>
          <Plus className="w-5 h-5 mr-2" /> Add
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <ListItem 
            key={item.id} 
            title={item.name} 
            subtitle={item.issuer + (item.worth ? ` - Worth: $${item.worth}` : '') + (item.inProgress ? ' (In Progress)' : '')} 
            imageUrl={item.images?.[0] || item.imageUrl} 
            onEdit={() => setEditing(item)} 
            onDelete={() => deleteDoc(doc(db, 'certificates', item.id!))}
            onMoveUp={() => handleMove(index, 'up')}
            onMoveDown={() => handleMove(index, 'down')}
            isFirst={index === 0}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
      {editing && (
        <Modal title="Edit Certificate" onClose={() => setEditing(null)} onSave={save}>
          <div className="space-y-4">
            <Input label="Name" value={editing.name} onChange={v => setEditing({...editing, name: v})} />
            <Input label="Issuer" value={editing.issuer} onChange={v => setEditing({...editing, issuer: v})} />
            <Input label="Date" value={editing.date} onChange={v => setEditing({...editing, date: v})} />
            <Input label="Credential ID" value={editing.credentialId || ''} onChange={v => setEditing({...editing, credentialId: v})} />
            <Input label="Worth ($)" value={editing.worth !== undefined ? editing.worth.toString() : ''} onChange={v => setEditing({...editing, worth: parseFloat(v) || 0})} />
            <Input label="Order (Position Index)" value={editing.order !== undefined ? editing.order.toString() : ''} onChange={v => setEditing({...editing, order: parseInt(v) || 0})} />
            
            <Input 
              label="Description (Markdown Supported)" 
              value={editing.description || ''} 
              onChange={v => setEditing({...editing, description: v})} 
              textarea 
            />
            
            <div className="flex items-center space-x-3 p-4 glass-sm rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
              <input 
                id="cert-inprogress-checkbox"
                type="checkbox" 
                checked={editing.inProgress || false} 
                onChange={e => setEditing({...editing, inProgress: e.target.checked})}
                className="w-5 h-5 rounded border-white/10 text-blue-500 focus:ring-blue-500/30 cursor-pointer"
              />
              <label htmlFor="cert-inprogress-checkbox" className="text-sm font-semibold select-none cursor-pointer text-[#1D1D1F] dark:text-[#F5F5F7]">
                Mark as In Progress (Displays a dim overlay with "In Progress")
              </label>
            </div>

            <MultiImageUpload 
              label="Certificate & Badge Images" 
              images={editing.images || []}
              onChange={imgs => setEditing({...editing, images: imgs})}
              path="certificates"
              targetId={editing.id || 'new'}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Link URL" value={editing.link?.url || ''} onChange={v => setEditing({...editing, link: { ...editing.link!, url: v, text: editing.link?.text || 'Verify' }})} />
              <Input label="Link Text" value={editing.link?.text || ''} onChange={v => setEditing({...editing, link: { ...editing.link!, text: v, url: editing.link?.url || '' }})} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BlogEditor() {
  const [items, setItems] = useState<Blog[]>([]);
  const [editing, setEditing] = useState<Blog | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('date', 'desc'));
    return onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Blog))), (error) => handleFirestoreError(error, OperationType.GET, 'blogs'));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...data } = editing;
    if (id) await updateDoc(doc(db, 'blogs', id), data);
    else await addDoc(collection(db, 'blogs'), data);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Blog Posts</h2>
        <button className="btn-secondary" onClick={() => setEditing({ title: '', content: '', description: '', date: new Date().toISOString().split('T')[0], status: 'published', tags: [] })}>
          <Plus className="w-5 h-5 mr-2" /> New Post
        </button>
      </div>
      <div className="space-y-4">
        {items.map(item => (
          <ListItem key={item.id} title={item.title} subtitle={item.date} onEdit={() => setEditing(item)} onDelete={() => deleteDoc(doc(db, 'blogs', item.id!))} />
        ))}
      </div>
      {editing && (
        <Modal title="Edit Blog Post" onClose={() => setEditing(null)} onSave={save}>
          <div className="space-y-4">
            <Input label="Title" value={editing.title} onChange={v => setEditing({...editing, title: v})} />
            <Input label="Brief Description" value={editing.description || ''} onChange={v => setEditing({...editing, description: v})} textarea />
            <Input label="Date" value={editing.date} onChange={v => setEditing({...editing, date: v})} />
            <Input label="Content (MD Supported)" value={editing.content} onChange={v => setEditing({...editing, content: v})} textarea />
            <Input label="External Blog URL (Optional - Opens in secure embedded panel)" value={editing.externalUrl || ''} onChange={v => setEditing({...editing, externalUrl: v})} />
            <Input label="Tags (comma separated)" value={editing.tags?.join(',') || ''} onChange={v => setEditing({...editing, tags: v.split(',')})} />
            <ImageUpload 
              label="Featured Image" 
              value={editing.imageUrl || ''} 
              onChange={v => setEditing({...editing, imageUrl: v})} 
              path="blogs" 
              targetId={editing.id || 'new'}
            />
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">Status</label>
              <select 
                className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
                value={editing.status}
                onChange={e => setEditing({...editing, status: e.target.value as any})}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AppSettingsEditor() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const SECTIONS_METADATA = [
    { key: 'about', label: 'About Section', icon: User },
    { key: 'experience', label: 'Experience Section', icon: Briefcase },
    { key: 'projects', label: 'Projects Section', icon: FolderCode },
    { key: 'certificates', label: 'Certificates Section', icon: Award },
    { key: 'skills', label: 'Services (Skills) Section', icon: Cog },
    { key: 'blog', label: 'Blogs Section', icon: BookOpen },
    { key: 'contact', label: 'Contact Section', icon: Mail },
  ];

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'config'), (s) => {
      if (s.exists()) setSettings(s.data() as AppSettings);
      else setSettings({ chatBotInstructions: '', specializations: [] });
      setLoading(false);
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const { specializations, ...cleanSettings } = settings;
      await setDoc(doc(db, 'settings', 'config'), {
        ...cleanSettings,
        specializations: []
      });

      // Synchronize with backend index.html (best effort)
      try {
        const response = await fetch('/api/settings/social-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: settings.socialTitle,
            description: settings.socialDescription,
            image: settings.socialImage
          })
        });

        if (!response.ok) {
          console.warn('Backend social preview pre-compilation is not supported on this hosting platform. This is normal for serverless environments.');
        }
      } catch (err) {
        console.warn('Could not contact backend for social preview compilation:', err);
      }

      alert('Settings synchronized successfully.');
    } catch (err: any) {
      console.error('Failed to sync settings:', err);
      alert('Failed to sync settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      alert('Master Key updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert('Security Verification Failed: The current password you entered is incorrect.');
      } else {
        alert('Security Verification Failed: ' + error.message);
      }
    } finally {
      setPwLoading(false);
    }
  };

  if (loading || !settings) return <div>Loading System Config...</div>;

  return (
    <div className="space-y-12">
      <form onSubmit={save} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center"><Brain className="mr-2 w-5 h-5" /> AI Capabilities</h3>
            <Input 
              label="System Instructions (The 'Mind' of the bot)" 
              value={settings.chatBotInstructions || ''} 
              onChange={v => setSettings({...settings, chatBotInstructions: v})} 
              textarea 
            />
            <p className="text-xs text-gray-500">Provide personality, rules, and deep knowledge here. The bot uses this as its primary logic core.</p>

            <Input 
              label="Custom Gemini API Key (Optional)" 
              value={settings.geminiApiKey || ''} 
              onChange={v => setSettings({...settings, geminiApiKey: v})} 
              type="password"
            />
            <p className="text-xs text-gray-500">Enter your custom Gemini API key to run the chatbot on your own quota. If left empty, the default pre-configured key is used automatically.</p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center"><Settings className="mr-2 w-5 h-5" /> Website Configuration</h3>
            <Input label="Site Name" value={settings.siteName || 'Portfolio'} onChange={v => setSettings({...settings, siteName: v})} />
            <Input label="Maintenance Message" value={settings.maintenanceMessage || ''} onChange={v => setSettings({...settings, maintenanceMessage: v})} />
            <div className="flex items-center space-x-4 p-4 glass-sm rounded-xl">
               <input 
                type="checkbox" 
                checked={settings.maintenanceMode || false} 
                onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
                className="w-5 h-5"
                id="maintenance-mode-setting"
               />
               <label htmlFor="maintenance-mode-setting" className="text-sm font-bold cursor-pointer select-none">
                 Safe Mode (Read Only)
               </label>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-mono">Restricts write access to public forms.</p>

            <div className="flex items-center space-x-4 p-4 glass-sm rounded-xl border border-blue-500/10 bg-blue-500/[0.02]">
               <input 
                type="checkbox" 
                id="show-video-thumbnail-setting"
                checked={settings.showVideoThumbnailAsProjectImage || false} 
                onChange={e => setSettings({...settings, showVideoThumbnailAsProjectImage: e.target.checked})}
                className="w-5 h-5 rounded border-white/10 text-blue-500 focus:ring-blue-500/30 cursor-pointer"
               />
               <div>
                 <label htmlFor="show-video-thumbnail-setting" className="text-sm font-bold cursor-pointer select-none flex items-center gap-1.5">
                   <Video className="w-4 h-4 text-blue-400" />
                   <span>Show Video Thumbnail as Project Picture</span>
                 </label>
                 <p className="text-[10px] text-gray-500 uppercase font-mono mt-0.5">
                   When enabled, projects with a video will display the video thumbnail as their picture in project listings.
                 </p>
               </div>
            </div>
          </div>
        </div>

        {/* Social Preview Settings */}
        <div className="pt-8 border-t border-white/5 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center">
              <Globe className="mr-2 w-5 h-5 text-blue-500" /> Social Media & Search Engine Preview (Open Graph)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customize how your portfolio links look when shared on LinkedIn, X (Twitter), Facebook, Slack, or listed on Google search results. These values are automatically pre-compiled into your static <code>index.html</code> tags.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 glass-sm rounded-3xl border border-white/5 bg-white/[0.02]">
            <div className="space-y-6">
              <Input 
                label="Preview Title (e.g. Abdulrahman Kamal | Portfolio)" 
                value={settings.socialTitle || ''} 
                onChange={v => setSettings({...settings, socialTitle: v})} 
              />
              <Input 
                label="Preview Description (Abstract/Summary)" 
                value={settings.socialDescription || ''} 
                onChange={v => setSettings({...settings, socialDescription: v})} 
                textarea
              />
            </div>

            <div className="space-y-6">
              <ImageUpload 
                label="Preview Image (What appears when shared)" 
                value={settings.socialImage || ''} 
                onChange={v => setSettings({...settings, socialImage: v})} 
                path="settings" 
                targetId="config_preview"
              />
              
              {/* Educational Guide Card */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center">
                  💡 Crawler and Link Preview Guide
                </h4>
                <ul className="text-[10.5px] text-gray-400 space-y-2 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong className="text-white">LinkedIn Caching:</strong> LinkedIn caches link previews aggressively. If you update your preview details but don't see the changes, visit the <a href="https://www.linkedin.com/post-inspector/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">LinkedIn Post Inspector</a> to force LinkedIn's crawler to scrape your site immediately and clear the cache.
                  </li>
                  <li>
                    <strong className="text-white">Image Formats:</strong> A 1.91:1 aspect ratio (recommended 1200x630 pixels, max 2MB) is standard to ensure beautiful, non-cropped display cards across all platforms.
                  </li>
                  <li>
                    <strong className="text-white">LinkedIn URL Shortening:</strong> When posting, LinkedIn always wraps link URLs in their own shortened tracker links (<code className="text-blue-300">lnkd.in</code>). Anyone clicking it will be redirected directly to your website.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section Subtitles / Intros */}
        <div className="pt-8 border-t border-white/5 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center">
              <BookOpen className="mr-2 w-5 h-5 text-blue-500" /> Section Descriptions & Intros
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customize the introductory subtitles displayed at the top of each page/section of your website. Leave a field blank to use its default subtitle.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 glass-sm rounded-3xl border border-white/5 bg-white/[0.02]">
            <Input 
              label="Experience Section Intro" 
              value={settings.experienceSubtitle || ''} 
              onChange={v => setSettings({...settings, experienceSubtitle: v})} 
              textarea
            />
            <Input 
              label="Projects Section Intro" 
              value={settings.projectsSubtitle || ''} 
              onChange={v => setSettings({...settings, projectsSubtitle: v})} 
              textarea
            />
            <Input 
              label="Certificates Section Intro" 
              value={settings.certificatesSubtitle || ''} 
              onChange={v => setSettings({...settings, certificatesSubtitle: v})} 
              textarea
            />
            <Input 
              label="Services (Skills) Section Intro" 
              value={settings.skillsSubtitle || ''} 
              onChange={v => setSettings({...settings, skillsSubtitle: v})} 
              textarea
            />
            <div className="md:col-span-2">
              <Input 
                label="Blogs Section Intro" 
                value={settings.blogsSubtitle || ''} 
                onChange={v => setSettings({...settings, blogsSubtitle: v})} 
                textarea
              />
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Order Managers */}
        <div className="pt-8 border-t border-white/5 space-y-8">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center">
              <Settings className="mr-2 w-5 h-5 text-blue-500" /> Navigation Order Management
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure which pages are visible and the exact order they appear in both the Computer / Desktop navbar and the Mobile navigation bar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Desktop Order Controller */}
            <div className="space-y-4 p-6 glass-sm rounded-3xl border border-white/5 bg-white/[0.02]">
              <h4 className="text-sm font-black uppercase tracking-widest text-blue-500">
                Computer / Desktop Navigation Bar Links
              </h4>
              <p className="text-xs text-gray-400">Reorder the core menu links on the desktop view.</p>
              
              <div className="space-y-2">
                {(() => {
                  const order = settings.desktopNavOrder && settings.desktopNavOrder.length > 0
                    ? settings.desktopNavOrder
                    : ['about', 'blog', 'experience', 'projects', 'certificates', 'skills', 'contact'];

                  const handleMove = (index: number, direction: 'up' | 'down') => {
                    const newOrder = [...order];
                    if (direction === 'up' && index > 0) {
                      const temp = newOrder[index];
                      newOrder[index] = newOrder[index - 1];
                      newOrder[index - 1] = temp;
                    } else if (direction === 'down' && index < newOrder.length - 1) {
                      const temp = newOrder[index];
                      newOrder[index] = newOrder[index + 1];
                      newOrder[index + 1] = temp;
                    }
                    setSettings({ ...settings, desktopNavOrder: newOrder });
                  };

                  return order.map((key, i) => {
                    const meta = SECTIONS_METADATA.find(m => m.key === key);
                    if (!meta) return null;
                    const IconComp = meta.icon;

                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center space-x-3">
                          <IconComp className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{meta.label}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => handleMove(i, 'up')}
                            className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/25 text-xs text-blue-400 font-bold disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-transform"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={i === order.length - 1}
                            onClick={() => handleMove(i, 'down')}
                            className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/25 text-xs text-blue-400 font-bold disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-transform"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Mobile Navigation Controller */}
            <div className="space-y-6">
              {/* Primary Mobile Nav (Bottom Bar) */}
              <div className="space-y-4 p-6 glass-sm rounded-3xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">
                  Mobile Bottom Bar Items (Primary)
                </h4>
                <p className="text-xs text-gray-400">Items displayed directly in the bottom navigation bar on mobile phones.</p>

                <div className="space-y-2">
                  {(() => {
                    const primary = settings.mobilePrimaryNav && settings.mobilePrimaryNav.length > 0
                      ? settings.mobilePrimaryNav
                      : ['about', 'experience', 'projects', 'certificates'];

                    const secondary = settings.mobileSecondaryNav && settings.mobileSecondaryNav.length > 0
                      ? settings.mobileSecondaryNav
                      : ['skills', 'blog', 'contact'];

                    const moveItem = (key: string, to: 'primary' | 'secondary') => {
                      let nextPrimary = [...primary];
                      let nextSecondary = [...secondary];

                      if (to === 'secondary') {
                        nextPrimary = nextPrimary.filter(k => k !== key);
                        if (!nextSecondary.includes(key)) {
                          nextSecondary.push(key);
                        }
                      } else {
                        nextSecondary = nextSecondary.filter(k => k !== key);
                        if (!nextPrimary.includes(key)) {
                          nextPrimary.push(key);
                        }
                      }

                      setSettings({
                        ...settings,
                        mobilePrimaryNav: nextPrimary,
                        mobileSecondaryNav: nextSecondary
                      });
                    };

                    const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
                      const newPrimary = [...primary];
                      if (direction === 'up' && index > 0) {
                        const temp = newPrimary[index];
                        newPrimary[index] = newPrimary[index - 1];
                        newPrimary[index - 1] = temp;
                      } else if (direction === 'down' && index < newPrimary.length - 1) {
                        const temp = newPrimary[index];
                        newPrimary[index] = newPrimary[index + 1];
                        newPrimary[index + 1] = temp;
                      }
                      setSettings({ ...settings, mobilePrimaryNav: newPrimary });
                    };

                    return (
                      <>
                        {primary.map((key, i) => {
                          const meta = SECTIONS_METADATA.find(m => m.key === key);
                          if (!meta) return null;
                          const IconComp = meta.icon;

                          return (
                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                              <div className="flex items-center space-x-3">
                                <IconComp className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{meta.label}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    disabled={i === 0}
                                    onClick={() => handleMoveOrder(i, 'up')}
                                    className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/25 text-xs text-emerald-400 font-bold disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={i === primary.length - 1}
                                    onClick={() => handleMoveOrder(i, 'down')}
                                    className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/25 text-xs text-emerald-400 font-bold disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    ▼
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => moveItem(key, 'secondary')}
                                  className="text-[10px] uppercase font-black tracking-wider text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg transition-colors"
                                >
                                  Move To Drawer
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {primary.length === 0 && (
                          <p className="text-xs text-center py-4 text-gray-500">No items. Move some from the Drawer below!</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Secondary Mobile Nav (Drawer / More menu) */}
              <div className="space-y-4 p-6 glass-sm rounded-3xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-sm font-black uppercase tracking-widest text-rose-500">
                  Mobile "More..." Drawer Items (Secondary)
                </h4>
                <p className="text-xs text-gray-400">Items organized inside the slide-up "More" options list drawer on mobile screens.</p>

                <div className="space-y-2">
                  {(() => {
                    const primary = settings.mobilePrimaryNav && settings.mobilePrimaryNav.length > 0
                      ? settings.mobilePrimaryNav
                      : ['about', 'experience', 'projects', 'certificates'];

                    const secondary = settings.mobileSecondaryNav && settings.mobileSecondaryNav.length > 0
                      ? settings.mobileSecondaryNav
                      : ['skills', 'blog', 'contact'];

                    const moveItem = (key: string, to: 'primary' | 'secondary') => {
                      let nextPrimary = [...primary];
                      let nextSecondary = [...secondary];

                      if (to === 'secondary') {
                        nextPrimary = nextPrimary.filter(k => k !== key);
                        if (!nextSecondary.includes(key)) {
                          nextSecondary.push(key);
                        }
                      } else {
                        nextSecondary = nextSecondary.filter(k => k !== key);
                        if (!nextPrimary.includes(key)) {
                          nextPrimary.push(key);
                        }
                      }

                      setSettings({
                        ...settings,
                        mobilePrimaryNav: nextPrimary,
                        mobileSecondaryNav: nextSecondary
                      });
                    };

                    const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
                      const newSecondary = [...secondary];
                      if (direction === 'up' && index > 0) {
                        const temp = newSecondary[index];
                        newSecondary[index] = newSecondary[index - 1];
                        newSecondary[index - 1] = temp;
                      } else if (direction === 'down' && index < newSecondary.length - 1) {
                        const temp = newSecondary[index];
                        newSecondary[index] = newSecondary[index + 1];
                        newSecondary[index + 1] = temp;
                      }
                      setSettings({ ...settings, mobileSecondaryNav: newSecondary });
                    };

                    return (
                      <>
                        {secondary.map((key, i) => {
                          const meta = SECTIONS_METADATA.find(m => m.key === key);
                          if (!meta) return null;
                          const IconComp = meta.icon;

                          return (
                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl">
                              <div className="flex items-center space-x-3">
                                <IconComp className="w-4 h-4 text-rose-500" />
                                <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{meta.label}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    disabled={i === 0}
                                    onClick={() => handleMoveOrder(i, 'up')}
                                    className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/25 text-xs text-rose-400 font-bold disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={i === secondary.length - 1}
                                    onClick={() => handleMoveOrder(i, 'down')}
                                    className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/25 text-xs text-rose-400 font-bold disabled:opacity-30 disabled:pointer-events-none"
                                  >
                                    ▼
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => moveItem(key, 'primary')}
                                  className="text-[10px] uppercase font-black tracking-wider text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition-colors"
                                >
                                  Move To Bar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {secondary.length === 0 && (
                          <p className="text-xs text-center py-4 text-gray-500">No items. Move some from the Bottom Bar above!</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={savingSettings} className="btn-primary flex items-center">
          {savingSettings ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Syncing...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" /> Sync Configuration
            </>
          )}
        </button>
      </form>

      <div className="pt-12 border-t border-white/5">
        <h3 className="text-xl font-bold flex items-center mb-6"><Lock className="mr-2 w-5 h-5 text-blue-500" /> Administrative Access Pivot</h3>
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Current Master Key</label>
            <input 
              type="password" 
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">New Key</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Confirm Key</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
          </div>
          <button disabled={pwLoading} type="submit" className="btn-secondary w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center">
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
            Update Access Credentials
          </button>
          <p className="text-[10px] text-gray-500 text-center uppercase font-mono opacity-60">Re-authentication required for security escalation.</p>
        </form>
      </div>
    </div>
  );
}

function SkillEditor() {
  const [items, setItems] = useState<Skill[]>([]);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'skills'), orderBy('order', 'asc'));
    return onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Skill))), (error) => handleFirestoreError(error, OperationType.GET, 'skills'));
  }, []);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = items[index];
    const targetItem = items[targetIndex];

    if (!currentItem.id || !targetItem.id) return;

    try {
      await updateDoc(doc(db, 'skills', currentItem.id), { order: targetIndex });
      await updateDoc(doc(db, 'skills', targetItem.id), { order: index });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'skills');
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const defaults = [
        {
          name: 'Penetration Testing & Red Teaming',
          description: 'Comprehensive web application, network, and API penetration testing to identify vulnerabilities, simulate realistic adversary TTPs, and provide actionable remediation paths.',
          icon: 'Crosshair',
          order: 0
        },
        {
          name: 'SOC Operations & SIEM Threat Monitoring',
          description: '24/7 security monitoring, custom log correlation rules (Wazuh/Elastic), alert triage, and rapid threat containment to protect enterprise infrastructure.',
          icon: 'Activity',
          order: 1
        },
        {
          name: 'Linux Infrastructure & Kernel Hardening',
          description: 'Debian/Ubuntu server tuning, automated zero-trust security baselines, systemd isolation, network namespace routing, and custom security orchestration.',
          icon: 'Terminal',
          order: 2
        },
        {
          name: 'Digital Forensics & Incident Response (DFIR)',
          description: 'Deep-dive memory analysis using Volatility, network packet dissection, endpoint artifact recovery, root-cause investigation, and chain-of-custody documentation.',
          icon: 'Search',
          order: 3
        },
        {
          name: 'AI & LLM Security Assessment',
          description: 'Adversarial evaluation of generative AI pipelines, prompt injection defense, model extraction protection, context guardrail design, and OWASP Top 10 for LLMs auditing.',
          icon: 'Cpu',
          order: 4
        },
        {
          name: 'Secure Network Architecture & Covert Channels',
          description: 'Segmentation design, captive authentication portal engineering, firewall orchestration, and deployment of hardened P2P communication architectures.',
          icon: 'Network',
          order: 5
        }
      ];

      for (const item of defaults) {
        await addDoc(collection(db, 'skills'), item);
      }
      alert('Default services successfully imported into your database!');
    } catch (error) {
      console.error("Error seeding default services:", error);
      handleFirestoreError(error, OperationType.WRITE, 'skills');
    } finally {
      setSeeding(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...data } = editing;
    const cleanData = {
      name: (data.name || '').trim(),
      description: (data.description || '').trim(),
      icon: data.icon || 'Shield',
      iconUrl: (data.iconUrl || '').trim(),
      order: Number(data.order) || 0
    };
    if (id) await updateDoc(doc(db, 'skills', id), cleanData);
    else await addDoc(collection(db, 'skills'), cleanData);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Services</h2>
          <p className="text-xs text-gray-500">Configure your technical services with customizable icons, names, and descriptions.</p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => setEditing({ name: '', description: '', icon: 'Shield', iconUrl: '', order: items.length })}
        >
          <Plus className="w-5 h-5 mr-2" /> Add Service
        </button>
      </div>

      {items.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 space-y-4">
          <p className="text-sm text-gray-400">
            💡 <strong className="text-white">Default Services Active:</strong> Your public profile is currently displaying default cybersecurity services. To customize, add, edit, or delete them, click below to import them into your database.
          </p>
          <button
            onClick={seedDefaults}
            className="btn-primary text-xs flex items-center"
            disabled={seeding}
          >
            {seeding ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" /> Importing...
              </>
            ) : (
              'Import Default Services'
            )}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          return (
            <ListItem 
              key={item.id} 
              title={item.name} 
              subtitle={item.description || (item.category ? `Category: ${item.category}` : '')} 
              imageUrl={item.iconUrl}
              onEdit={() => setEditing(item)} 
              onDelete={() => deleteDoc(doc(db, 'skills', item.id!))}
              onMoveUp={() => handleMove(index, 'up')}
              onMoveDown={() => handleMove(index, 'down')}
              isFirst={index === 0}
              isLast={index === items.length - 1}
            />
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit Service" : "Add Service"} onClose={() => setEditing(null)} onSave={save}>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <Input 
              label="Service Name" 
              placeholder="e.g. Penetration Testing & Vulnerability Assessment"
              value={editing.name || ''} 
              onChange={v => setEditing({...editing, name: v})} 
            />

            <Input 
              label="Service Description" 
              placeholder="Describe what this service entails, methodologies used, and key deliverables..."
              value={editing.description || ''} 
              onChange={v => setEditing({...editing, description: v})} 
              textarea 
            />

            {/* Customizable Icon Selector */}
            <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Customizable Icon
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono uppercase">Selected:</span>
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center p-1 border border-blue-500/30">
                    {React.createElement(getServiceIcon(editing.icon), { className: "w-4 h-4" })}
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{editing.icon || 'Shield'}</span>
                </div>
              </div>

              {/* Grid of Selectable Icons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-2 bg-black/40 rounded-xl border border-white/5 custom-scrollbar">
                {AVAILABLE_SERVICE_ICONS.map((ico) => {
                  const IconComp = ico.icon;
                  const isSelected = (editing.icon || 'Shield') === ico.id;
                  return (
                    <button
                      key={ico.id}
                      type="button"
                      onClick={() => setEditing({ ...editing, icon: ico.id })}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center cursor-pointer group ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                      }`}
                      title={ico.label}
                    >
                      <IconComp className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] font-mono truncate w-full">{ico.id}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <Input 
                  label="Or Enter Custom Icon Name" 
                  placeholder="e.g. Shield, Terminal, Lock, Cpu, Crosshair..." 
                  value={editing.icon || ''} 
                  onChange={v => setEditing({ ...editing, icon: v })} 
                />
              </div>

              <div className="pt-2 border-t border-white/5">
                <ImageUpload 
                  label="Or Upload Custom Icon Image (Optional SVG/PNG)" 
                  value={editing.iconUrl || ''} 
                  onChange={v => setEditing({ ...editing, iconUrl: v })} 
                  path="service_icon" 
                  targetId={editing.id || 'new'}
                />
              </div>
            </div>

            <Input 
              label="Display Order" 
              value={(editing.order ?? 0).toString()} 
              onChange={v => setEditing({...editing, order: parseInt(v) || 0})} 
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function SpecializationEditor() {
  const [items, setItems] = useState<Specialization[]>([]);
  const [editing, setEditing] = useState<Specialization | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'specializations'), orderBy('order', 'asc'));
    return onSnapshot(q, (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()} as Specialization))), (error) => handleFirestoreError(error, OperationType.GET, 'specializations'));
  }, []);

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const defaults = [
        {
          title: 'SOC Analysis',
          description: 'Real-time monitoring and threat detection using SIEM platforms like Wazuh.',
          imageUrl: '',
          order: 0
        },
        {
          title: 'Digital Forensics',
          description: 'Incident analysis, memory forensics, and deep system investigations.',
          imageUrl: '',
          order: 1
        },
        {
          title: 'Linux Engineering',
          description: 'Expertise in Debian/Ubuntu, kernel tuning, and automated security hardening.',
          imageUrl: '',
          order: 2
        }
      ];
      for (const item of defaults) {
        await addDoc(collection(db, 'specializations'), item);
      }
      alert('Default specializations successfully imported into your database!');
    } catch (error) {
      console.error("Error seeding default specializations:", error);
      handleFirestoreError(error, OperationType.WRITE, 'specializations');
    } finally {
      setSeeding(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const cleanData = {
        title: editing.title || '',
        description: editing.description || '',
        imageUrl: editing.imageUrl || '',
        order: Number(editing.order) || 0
      };
      if (editing.id) {
        await updateDoc(doc(db, 'specializations', editing.id), cleanData);
      } else {
        await addDoc(collection(db, 'specializations'), cleanData);
      }
      setEditing(null);
    } catch (error) {
      console.error("Error saving specialization:", error);
      handleFirestoreError(error, OperationType.WRITE, 'specializations');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'specializations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `specializations/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Specializations</h2>
        <button className="btn-secondary" onClick={() => setEditing({ title: '', description: '', imageUrl: '', order: items.length })}>
          <Plus className="w-5 h-5 mr-2" /> Add
        </button>
      </div>

      {items.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 space-y-4">
          <p className="text-sm text-gray-400">
            💡 <strong className="text-white">Default Specializations Active:</strong> Your public profile is currently displaying default placeholder specializations (<em>SOC Analysis, Digital Forensics, Linux Engineering</em>). To customize, edit, or delete them, click below to import them into your database.
          </p>
          <button
            onClick={seedDefaults}
            className="btn-primary text-xs flex items-center"
            disabled={seeding}
          >
            {seeding ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" /> Importing...
              </>
            ) : (
              'Import Default Specializations'
            )}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {items.map(item => (
          <ListItem 
            key={item.id} 
            title={item.title} 
            subtitle={item.description} 
            imageUrl={item.imageUrl} 
            onEdit={() => setEditing(item)} 
            onDelete={() => handleDelete(item.id!)} 
          />
        ))}
      </div>
      {editing && (
        <Modal title="Edit Specialization" onClose={() => setEditing(null)} onSave={save}>
          <div className="space-y-4">
            <Input label="Title" value={editing.title || ''} onChange={v => setEditing({...editing, title: v})} />
            <Input label="Description" value={editing.description || ''} onChange={v => setEditing({...editing, description: v})} textarea />
            <ImageUpload 
              label="Card Image (16:9 widescreen recommended)" 
              value={editing.imageUrl || ''} 
              onChange={v => setEditing({...editing, imageUrl: v})} 
              path="specializations" 
              targetId={editing.id || 'new'}
            />
            <Input label="Order" value={(editing.order ?? 0).toString()} onChange={v => setEditing({...editing, order: parseInt(v) || 0})} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// Reusable Components
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="glass-sm p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">{label}</p>
      <p className={`text-4xl font-black tracking-tighter ${color || ''}`}>{value}</p>
      <p className="text-[10px] font-mono text-gray-400 mt-2 uppercase">{sub}</p>
    </div>
  );
}

function ResourceCard({ name, status, items, usage, limit }: { name: string; status: string; items: { label: string; count: number }[]; usage: string; limit: string }) {
  return (
    <div className="glass-sm p-6 rounded-[2.5rem] border border-white/5 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm uppercase tracking-tight">{name}</h4>
        <span className="flex items-center space-x-1 text-[10px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
           <span>{status}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.label} className="p-3 bg-white/5 rounded-2xl border border-white/5">
             <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
             <p className="text-lg font-black">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-white/5 space-y-1">
         <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{usage}</p>
         <p className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter opacity-60">Limit: {limit}</p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, textarea, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
      {textarea ? (
        <textarea placeholder={placeholder} className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" value={value} onChange={e => onChange(e.target.value)} rows={3} />
      ) : (
        <input placeholder={placeholder} type={type} className="w-full glass-sm p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function MultiImageUpload({ label, images, onChange, path, targetId }: { label: string; images: string[]; onChange: (urls: string[]) => void; path: string; targetId?: string }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const extension = file.name.split('.').pop();
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const targetFilename = `${path}_${targetId}_${uniqueSuffix}.${extension}`;

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-target-filename': targetFilename
        }
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onChange([...images, data.url]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    onChange(images.filter(img => img !== url));
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {images.map((img, i) => {
          const isPdf = img.toLowerCase().includes('.pdf') || img.toLowerCase().split('?')[0].endsWith('.pdf');
          const isVid = isVideoMedia(img);
          return (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden glass-sm border border-white/10 group flex items-center justify-center bg-black/40">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center text-center p-4 w-full h-full bg-red-500/5 hover:bg-red-500/10 transition-colors">
                  <FileText className="w-8 h-8 text-red-500 mb-2 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate w-full px-2">PDF Document</span>
                </div>
              ) : isVid ? (
                <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                  <video src={`${img}#t=0.001`} preload="metadata" muted playsInline className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="absolute bottom-1.5 left-2 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-blue-400 border border-white/10">
                    Video
                  </span>
                </div>
              ) : (
                <img src={img} alt="Gallery" className="w-full h-full object-cover" />
              )}
              <button 
                onClick={(e) => { e.preventDefault(); removeImage(img); }} 
                className="absolute top-1 right-1 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 shadow-md transition-all z-10 cursor-pointer"
                title="Remove media"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        <label className="aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-blue-500/5 group">
          <input type="file" accept="image/*,video/*,.mp4,.webm,.mov,.ogg,.m4v,application/pdf" onChange={handleFileChange} className="hidden" />
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <>
              <Plus className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              <span className="text-[10px] text-gray-500 mt-1 uppercase font-mono">APPEND</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}

function FileUpload({ label, value, onChange, path, targetId, accept }: { label: string; value: string; onChange: (url: string) => void; path: string; targetId?: string; accept?: string }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const extension = file.name.split('.').pop();
      let targetFilename = targetId ? `${path}_${targetId}.${extension}` : undefined;
      if (path === 'cv') {
        targetFilename = `Abdulrahman_Kamal_CV.${extension}`;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: targetFilename ? {
          'x-target-filename': encodeURIComponent(targetFilename)
        } : {}
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="flex items-center gap-6 p-6 glass-sm rounded-[2rem] border border-white/5 bg-white/5">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <div className="flex-1 space-y-2">
          {value ? (
            <div className="flex items-center space-x-2 text-green-500">
               <CheckCircle2 className="w-4 h-4" />
               <span className="text-xs font-bold font-mono truncate max-w-[200px]">{value.split('/').pop()?.split('?')[0]}</span>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No file uploaded yet.</p>
          )}
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept={accept || "*/*"} 
              onChange={handleFileChange}
              className="hidden" 
              id={`file-upload-${label}`}
            />
            <label 
              htmlFor={`file-upload-${label}`}
              className="btn-secondary py-2 px-4 text-xs cursor-pointer inline-flex items-center"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-3 h-3 mr-2" /> {value ? 'Replace' : 'Upload'}</>
              )}
            </label>
            {value && (
              <button 
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold font-mono tracking-wider uppercase border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl transition-all cursor-pointer"
                title="Remove uploaded file"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageUpload({ label, value, onChange, path, targetId }: { label: string; value: string; onChange: (url: string) => void; path: string; targetId?: string }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const extension = file.name.split('.').pop();
      const targetFilename = targetId ? `${path}_${targetId}.${extension}` : undefined;

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: targetFilename ? {
          'x-target-filename': encodeURIComponent(targetFilename)
        } : {}
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image to local server.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-2xl glass-sm overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10">
          {value ? (
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="hidden" 
            id={`file-${label}`}
          />
          <div className="flex items-center gap-3">
            <label 
              htmlFor={`file-${label}`}
              className="btn-secondary cursor-pointer inline-flex items-center mb-0"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> {value ? 'Change Image' : 'Upload Image'}</>
              )}
            </label>
            {value && (
              <button 
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold font-mono tracking-wider uppercase border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl transition-all cursor-pointer"
                title="Remove image URL"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Recommended: SQ or 16:9 ratio, max 2MB.</p>
        </div>
      </div>
    </div>
  );
}

const ListItem: React.FC<{ 
  title: string; 
  subtitle: string; 
  imageUrl?: string; 
  onEdit: () => void; 
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ title, subtitle, imageUrl, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  return (
    <div className="glass-sm p-6 rounded-2xl flex items-center justify-between group">
      <div className="flex items-center space-x-4">
        {imageUrl && (
          <div className="w-20 aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">{title}</h4>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {onMoveUp && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
            disabled={isFirst}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-25 disabled:pointer-events-none rounded-lg transition-all"
            title="Move Up"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {onMoveDown && (
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
            disabled={isLast}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 disabled:opacity-25 disabled:pointer-events-none rounded-lg transition-all"
            title="Move Down"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
        <button onClick={onEdit} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        <button onClick={onDelete} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, onSave }: { title: string; children: React.ReactNode; onClose: () => void; onSave: (e: React.FormEvent) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 w-full max-w-2xl p-8 rounded-[2.5rem] relative z-10 max-h-[90vh] overflow-y-auto shadow-[0_40px_120px_rgba(37,99,235,0.1)]"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={onSave} className="space-y-6">
          {children}
          <div className="flex justify-end gap-4 pt-6">
            <button key="cancel" type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button key="save" type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ContactSectionEditor() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  // New item form state
  const [newType, setNewType] = useState<ContactMethod['type']>('email');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as Profile);
      } else {
        setProfile({
          name: 'Abdulrahman Kamal',
          title: 'Cybersecurity Engineer',
          bio: '',
          location: 'Aden, Yemen',
          email: 'Abdulrahmankamal609@gmail.com',
          phone: '',
          linkedin: '',
          github: '',
          photoUrl: '',
          contactMethods: []
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'profile/main'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      } else {
        setSettings({ chatBotInstructions: '', specializations: [] });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/config'));

    return () => {
      unsubProfile();
      unsubSettings();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !settings) return;
    setSaving(true);
    try {
      // 1. Save Profile contact details
      const { specializations, ...cleanProfile } = profile;
      await setDoc(doc(db, 'profile', 'main'), {
        ...cleanProfile,
        specializations: []
      });

      // 2. Save Settings subtitle/details
      const { specializations: spec, ...cleanSettings } = settings;
      await setDoc(doc(db, 'settings', 'config'), {
        ...cleanSettings,
        specializations: []
      });

      alert('Contact section configuration saved successfully!');
    } catch (error) {
      alert('Error saving contact details: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMethod = () => {
    if (!profile) return;
    if (!newLabel.trim() || !newValue.trim()) {
      alert('Please fill in both Label and Value for the contact method.');
      return;
    }

    const currentMethods = profile.contactMethods || [];
    const newMethod: ContactMethod = {
      id: Math.random().toString(36).substring(2, 9),
      type: newType,
      label: newLabel.trim(),
      value: newValue.trim(),
      order: currentMethods.length + 1
    };

    setProfile({
      ...profile,
      contactMethods: [...currentMethods, newMethod]
    });

    setNewLabel('');
    setNewValue('');
  };

  const handleDeleteMethod = (id: string) => {
    if (!profile) return;
    const currentMethods = profile.contactMethods || [];
    const filtered = currentMethods.filter(m => m.id !== id).map((m, idx) => ({
      ...m,
      order: idx + 1
    }));
    setProfile({
      ...profile,
      contactMethods: filtered
    });
  };

  const handleMoveMethod = (index: number, direction: 'up' | 'down') => {
    if (!profile) return;
    const currentMethods = [...(profile.contactMethods || [])];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentMethods.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = currentMethods[index];
    currentMethods[index] = currentMethods[targetIndex];
    currentMethods[targetIndex] = temp;

    // reorder
    const updated = currentMethods.map((m, idx) => ({
      ...m,
      order: idx + 1
    }));

    setProfile({
      ...profile,
      contactMethods: updated
    });
  };

  if (!profile || !settings) {
    return <div className="text-center p-8 font-mono text-xs text-blue-500 animate-pulse">Loading Contact Configuration...</div>;
  }

  const currentMethods = profile.contactMethods || [];

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Contact Section Config</h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Modify the section subtitles, location, and manage dynamic communication channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 border-b border-gray-100 dark:border-white/5 pb-2">
            Section Intros & Subtitles
          </h4>
          <Input 
            label="Contact Subtitle (English)" 
            value={settings.contactSubtitleEn || ''} 
            onChange={v => setSettings({...settings, contactSubtitleEn: v})} 
            textarea 
          />
          <Input 
            label="Contact Subtitle (Arabic)" 
            value={settings.contactSubtitleAr || ''} 
            onChange={v => setSettings({...settings, contactSubtitleAr: v})} 
            textarea 
          />
        </div>

        <div className="md:col-span-2 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 border-b border-gray-100 dark:border-white/5 pb-2">
            Base Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Default Email Address" 
              value={profile.email || ''} 
              onChange={v => setProfile({...profile, email: v})} 
            />
            <Input 
              label="Location (e.g. Aden, Yemen / Remote)" 
              value={profile.location || ''} 
              onChange={v => setProfile({...profile, location: v})} 
            />
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 border-b border-gray-100 dark:border-white/5 pb-2">
            Manage Custom Contact Methods
          </h4>

          {currentMethods.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-xs text-gray-500 dark:text-gray-400">
              No custom contact methods defined yet. Use the tool below to add some!
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-gray-200 dark:divide-zinc-800">
              {currentMethods.map((method, idx) => (
                <div key={method.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#09090b]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider bg-blue-500/10 text-blue-500">
                      {method.type}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{method.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono select-all">{method.value}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveMethod(idx, 'up')}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === currentMethods.length - 1}
                      onClick={() => handleMoveMethod(idx, 'down')}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="p-1.5 rounded-lg border border-red-200/50 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-gray-200 dark:border-white/5 space-y-4">
            <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Add Custom Contact Method
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                  Type / Platform
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="x">X (Twitter)</option>
                  <option value="github">GitHub</option>
                  <option value="medium">Medium</option>
                  <option value="telegram">Telegram</option>
                  <option value="website">Website</option>
                  <option value="other">Other Link</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                  Label (e.g. Work Mobile, personal github)
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Personal WhatsApp"
                  className="w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                  Value (e.g. +1234567, Link URL)
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. https://wa.me/..."
                  className="w-full bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddMethod}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to list</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
        <button 
          type="submit" 
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Contact Configuration</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

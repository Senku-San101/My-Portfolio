import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Terminal, Network, Key, Copy, Check,
  Search, Globe, Database
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { VaultItem } from '../types';
import { DEFAULT_VAULT_ITEMS } from '../lib/cyberArsenal';
import SecurityHeadersAudit from '../components/arsenal/SecurityHeadersAudit';
import SubnetMatrix from '../components/arsenal/SubnetMatrix';
import CryptoWorkbench from '../components/arsenal/CryptoWorkbench';

export default function ArsenalPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'headers' | 'subnet' | 'crypto' | 'vault'>('headers');

  // URL hash/query sync if visited directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['headers', 'subnet', 'crypto', 'vault'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Hero */}
      <div className="glass-md p-6 sm:p-8 rounded-[2rem] border border-blue-500/20 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Terminal className="w-3.5 h-3.5" />
              <span>{isAr ? 'منصة العمليات السيبرانية الميدانية' : 'OPERATIONAL CYBER ARSENAL'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{isAr ? 'ترسانة العمليات والأدوات السيبرانية' : 'Cyber Ops Deck & Arsenal'}</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              {isAr 
                ? 'مجموعة أدوات حية وميدانية صُممت للمهام اليومية في تدقيق الترويسات الأمنية، وحساب شبكات CIDR، ومعالجة التشفير والهاشات، وخزينة أوامر الاستجابة للحوادث والتصليد.'
                : 'Live tactical toolkit engineered for day-to-day security audits, subnet & CIDR calculations, forensic encoding/hashing workbenches, and verified command vault.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-xs text-gray-500 font-mono">AUDIT ENGINE</div>
              <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4" /> Live Active
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-xs text-gray-500 font-mono">CIDR MATRIX</div>
              <div className="text-blue-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <Network className="w-4 h-4" /> IPv4 /32-/0
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-xs text-gray-500 font-mono">CRYPTO SUITE</div>
              <div className="text-purple-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <Key className="w-4 h-4" /> JWT + Hashes
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-black/40 border border-white/5">
              <div className="text-xs text-gray-500 font-mono">OPS VAULT</div>
              <div className="text-amber-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <Database className="w-4 h-4" /> Hardened
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          {[
            { id: 'headers', label: isAr ? 'فاحص الترويسات الأمنية' : 'Security Headers Audit', icon: Globe },
            { id: 'subnet', label: isAr ? 'حاسبة شبكات CIDR' : 'Subnet & CIDR Matrix', icon: Network },
            { id: 'crypto', label: isAr ? 'فك التشفير والتجزئة وJWT' : 'Hash & Encoders Workbench', icon: Key },
            { id: 'vault', label: isAr ? 'خزينة الأوامر والسكربتات' : 'Command & Payload Vault', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-blue-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Pane */}
      <AnimatePresence mode="wait">
        {activeTab === 'headers' && <SecurityHeadersAudit key="headers" isAr={isAr} />}
        {activeTab === 'subnet' && <SubnetMatrix key="subnet" isAr={isAr} />}
        {activeTab === 'crypto' && <CryptoWorkbench key="crypto" isAr={isAr} />}
        {activeTab === 'vault' && <PayloadVaultTab key="vault" isAr={isAr} />}
      </AnimatePresence>
    </div>
  );
}

// =========================================================================
// Public Command & Payload Vault Component (Read & Copy with live filter)
// =========================================================================
function PayloadVaultTab({ isAr }: { isAr: boolean }) {
  const [items, setItems] = useState<VaultItem[]>(DEFAULT_VAULT_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'ops_vault'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs
            .map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }))
            .filter((i: any) => i.isPublic !== false) as VaultItem[];
          setItems(list.length > 0 ? list : DEFAULT_VAULT_ITEMS);
        } else {
          setItems(DEFAULT_VAULT_ITEMS);
        }
      },
      (error) => {
        console.warn('Using default vault items due to snapshot error:', error);
        setItems(DEFAULT_VAULT_ITEMS);
      }
    );
    return () => unsub();
  }, []);

  const categories: { id: string; label: string; count: number }[] = [
    { id: 'all', label: isAr ? 'جميع الأوامر' : 'All Payloads', count: items.length },
    { id: 'linux-hardening', label: 'Linux Hardening', count: items.filter(i => i.category === 'linux-hardening').length },
    { id: 'soc-wazuh', label: 'SOC & Wazuh', count: items.filter(i => i.category === 'soc-wazuh').length },
    { id: 'network-recon', label: 'Network & Nmap', count: items.filter(i => i.category === 'network-recon').length },
    { id: 'web-api-sec', label: 'Web & API Audit', count: items.filter(i => i.category === 'web-api-sec').length },
    { id: 'gdb-reversing', label: 'GDB & Reversing', count: items.filter(i => i.category === 'gdb-reversing').length },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.command.toLowerCase().includes(q) ||
      item.tags?.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const copyCommand = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Search and Category Filters */}
      <div className="glass-md p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث في الأوامر، الحزم، السكربتات، أو الكلمات المفتاحية...' : 'Search commands, flags, tools, or CVEs...'}
            className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payloads List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="glass-md p-5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all duration-200 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-bold text-white text-base">{item.title}</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono uppercase font-semibold ${
                  item.dangerLevel === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  item.dangerLevel === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {item.dangerLevel || 'low'}
                </span>
              </div>

              <button
                onClick={() => copyCommand(item.id, item.command)}
                className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-200 border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === item.id ? (isAr ? 'تم النسخ!' : 'Copied') : (isAr ? 'نسخ الأمر' : 'Copy Command')}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{item.description}</p>

            <div className="relative group">
              <div className="p-3.5 bg-black/80 rounded-xl font-mono text-xs text-emerald-400 border border-white/5 overflow-x-auto select-all">
                {item.command}
              </div>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-xs font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

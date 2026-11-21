import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Plus, Trash2, Edit3, Save, X, Check, Copy, AlertTriangle, 
  Database, RefreshCw, ExternalLink, ShieldAlert, Sparkles, Filter, Eye, EyeOff,
  Globe, Network, Key, Hash, ShieldCheck
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { VaultItem, VaultCategory } from '../../types';
import { DEFAULT_VAULT_ITEMS } from '../../lib/cyberArsenal';
import SecurityHeadersAudit from '../arsenal/SecurityHeadersAudit';
import SubnetMatrix from '../arsenal/SubnetMatrix';
import CryptoWorkbench from '../arsenal/CryptoWorkbench';

const CATEGORIES: { id: VaultCategory; label: string }[] = [
  { id: 'linux-hardening', label: 'Linux Hardening' },
  { id: 'soc-wazuh', label: 'SOC & Wazuh' },
  { id: 'network-recon', label: 'Network & Nmap' },
  { id: 'web-api-sec', label: 'Web & API Audit' },
  { id: 'gdb-reversing', label: 'GDB & Reversing' },
  { id: 'crypto-forensics', label: 'Crypto & Forensics' },
  { id: 'cloud-security', label: 'Cloud Security' },
];

export default function OpsVaultEditor() {
  const [subTab, setSubTab] = useState<'vault' | 'headers' | 'subnet' | 'crypto'>('vault');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    category: 'linux-hardening' as VaultCategory,
    command: '',
    description: '',
    dangerLevel: 'low' as 'low' | 'medium' | 'critical',
    tags: '',
    isPublic: true,
  });

  useEffect(() => {
    const q = query(collection(db, 'ops_vault'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as VaultItem[];
        setItems(list);
        setLoading(false);
      },
      (error) => {
        console.error('Ops Vault snapshot error:', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'linux-hardening',
      command: '',
      description: '',
      dangerLevel: 'low',
      tags: '',
      isPublic: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: VaultItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      command: item.command,
      description: item.description,
      dangerLevel: item.dangerLevel || 'low',
      tags: item.tags?.join(', ') || '',
      isPublic: item.isPublic !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.command.trim()) return;

    const payloadData = {
      title: formData.title.trim(),
      category: formData.category,
      command: formData.command.trim(),
      description: formData.description.trim(),
      dangerLevel: formData.dangerLevel,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isPublic: formData.isPublic,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'ops_vault', editingItem.id), payloadData);
      } else {
        await addDoc(collection(db, 'ops_vault'), {
          ...payloadData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving vault item:', err);
      alert('Failed to save payload to Ops Vault.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete payload "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'ops_vault', id));
    } catch (err) {
      console.error('Error deleting vault item:', err);
      alert('Failed to delete payload.');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('This will seed 10 verified foundational security commands into your Firestore ops_vault collection. Proceed?')) return;
    setSeeding(true);
    try {
      for (const item of DEFAULT_VAULT_ITEMS) {
        const { id, ...data } = item;
        await addDoc(collection(db, 'ops_vault'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      alert('10 security operations payloads successfully seeded!');
    } catch (err) {
      console.error('Failed to seed default vault items:', err);
      alert('Error seeding default payloads.');
    } finally {
      setSeeding(false);
    }
  };

  const copyCmd = (id: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      item.title.toLowerCase().includes(q) ||
      item.command.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Title & Sub-tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>Cyber Operations & Tactical Arsenal</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Admin Security Deck & Tools
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Personal workstation for real-time header audits, CIDR math, cryptographic tools, and your curated command vault.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl shrink-0 overflow-x-auto">
          {[
            { id: 'vault', label: 'Command Vault', icon: Terminal, count: items.length },
            { id: 'headers', label: 'Header Auditor', icon: Globe },
            { id: 'subnet', label: 'Subnet Matrix', icon: Network },
            { id: 'crypto', label: 'Crypto & JWT', icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab 1: Command Vault Manager */}
      {subTab === 'vault' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Quick Stats & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[11px] font-mono text-gray-500">STORED PAYLOADS</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{items.length}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[11px] font-mono text-gray-500">PUBLIC TO VISITORS</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {items.filter((i) => i.isPublic !== false).length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[11px] font-mono text-gray-500">PRIVATE (ADMIN)</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  {items.filter((i) => i.isPublic === false).length}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div className="text-[11px] font-mono text-gray-500">CATEGORIES</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">{CATEGORIES.length}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 font-medium text-xs flex items-center gap-1.5 transition-colors"
                title="Seed standard 10 tactical commands into Firestore"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{seeding ? 'Seeding...' : 'Seed Defaults'}</span>
              </button>

              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Payload</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commands, flags, tools, CVEs or tags..."
                className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Payloads List */}
          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>Loading Command Vault...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400 glass-md rounded-2xl border border-white/5 space-y-3">
              <Terminal className="w-8 h-8 text-gray-500 mx-auto" />
              <p className="text-sm">No commands matched your filter.</p>
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 transition-colors"
              >
                Seed 10 Verified Security Payloads
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all duration-200 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/5 text-blue-400 border border-white/5">
                        {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                        item.dangerLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                        item.dangerLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.dangerLevel || 'low'}
                      </span>
                      {item.isPublic === false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Private
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Public
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => copyCmd(item.id, item.command)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Copy command"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-blue-400 transition-colors"
                        title="Edit payload"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                        title="Delete payload"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>

                  <div className="p-3 bg-black/80 rounded-lg font-mono text-xs text-emerald-400 border border-white/5 overflow-x-auto flex items-center justify-between gap-3 select-all">
                    <span>{item.command}</span>
                    <button
                      onClick={() => copyCmd(item.id, item.command)}
                      className="text-gray-500 hover:text-white transition-colors shrink-0"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px] font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Sub-tab 2: Security Headers Auditor */}
      {subTab === 'headers' && (
        <SecurityHeadersAudit isAr={false} />
      )}

      {/* Sub-tab 3: Subnet Matrix */}
      {subTab === 'subnet' && (
        <SubnetMatrix isAr={false} />
      )}

      {/* Sub-tab 4: Crypto Workbench */}
      {subTab === 'crypto' && (
        <CryptoWorkbench isAr={false} />
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl glass-md p-6 rounded-3xl border border-white/20 bg-gray-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                <span>{editingItem ? 'Edit Security Payload' : 'New Security Payload'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Audit SSH Authorized Keys"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as VaultCategory })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1">Impact / Danger Level</label>
                  <select
                    value={formData.dangerLevel}
                    onChange={(e) => setFormData({ ...formData, dangerLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low (Safe read-only audit)</option>
                    <option value="medium">Medium (Modifies config / drops packets)</option>
                    <option value="critical">Critical (Potential disruption / kill process)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Bash / Tactical Command</label>
                <textarea
                  required
                  rows={3}
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  placeholder="e.g. ss -tulpn | grep -v '127.0.0.1'"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-emerald-400 text-sm focus:outline-none focus:border-blue-500 font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Description & Operational Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when to use, prerequisite privileges, or expected outputs..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. soc, linux, audit, forensics"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="rounded border-white/20 bg-black/50 text-blue-600 focus:ring-0"
                />
                <label htmlFor="isPublic" className="text-xs text-gray-300 font-medium cursor-pointer">
                  Visible to Arsenal visitors (uncheck to keep strictly Admin-only)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Save Changes' : 'Create Payload'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

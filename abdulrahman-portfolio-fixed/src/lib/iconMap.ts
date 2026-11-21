import React from 'react';
import {
  Shield,
  Terminal,
  Lock,
  Crosshair,
  Activity,
  Search,
  Cpu,
  Network,
  Server,
  Database,
  Bug,
  Key,
  Globe,
  Code,
  Cloud,
  Zap,
  Eye,
  Binary,
  FileCode,
  Radio,
  Wrench,
  Layers,
  HardDrive,
  LucideIcon
} from 'lucide-react';

export const AVAILABLE_SERVICE_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'Shield', label: 'Shield', icon: Shield },
  { id: 'Terminal', label: 'Terminal', icon: Terminal },
  { id: 'Lock', label: 'Lock', icon: Lock },
  { id: 'Crosshair', label: 'Target / Pentest', icon: Crosshair },
  { id: 'Activity', label: 'Activity / SOC', icon: Activity },
  { id: 'Search', label: 'Forensics', icon: Search },
  { id: 'Cpu', label: 'AI / Processor', icon: Cpu },
  { id: 'Network', label: 'Network', icon: Network },
  { id: 'Server', label: 'Server', icon: Server },
  { id: 'Database', label: 'Database', icon: Database },
  { id: 'Bug', label: 'Bug / Exploit', icon: Bug },
  { id: 'Key', label: 'Key / Crypto', icon: Key },
  { id: 'Globe', label: 'Web / Cloud', icon: Globe },
  { id: 'Code', label: 'Development', icon: Code },
  { id: 'Cloud', label: 'Cloud Security', icon: Cloud },
  { id: 'Zap', label: 'Performance', icon: Zap },
  { id: 'Eye', label: 'Surveillance / OSINT', icon: Eye },
  { id: 'Binary', label: 'Binary / Reverse Eng', icon: Binary },
  { id: 'Radio', label: 'Wireless / Signals', icon: Radio },
  { id: 'Wrench', label: 'Engineering / Tools', icon: Wrench },
  { id: 'Layers', label: 'Architecture', icon: Layers },
  { id: 'HardDrive', label: 'Storage / Systems', icon: HardDrive },
];

export const SERVICE_ICON_MAP: Record<string, LucideIcon> = AVAILABLE_SERVICE_ICONS.reduce((acc, curr) => {
  acc[curr.id] = curr.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

export function getServiceIcon(iconName?: string): LucideIcon {
  if (!iconName) return Shield;
  return SERVICE_ICON_MAP[iconName] || Shield;
}

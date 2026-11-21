import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Skill, AppSettings } from '../types';
import Typewriter from '../components/Typewriter';
import ScrambleHeader from '../components/ScrambleHeader';
import PageWrapper from '../components/PageWrapper';
import { useLanguage } from '../context/LanguageContext';
import { getServiceIcon } from '../lib/iconMap';

const DEFAULT_SERVICES: Partial<Skill>[] = [
  {
    name: 'Penetration Testing & Red Teaming',
    description: 'Comprehensive web application, network, and API penetration testing to identify vulnerabilities, simulate realistic adversary TTPs, and provide actionable remediation paths.',
    icon: 'Crosshair',
    order: 0,
  },
  {
    name: 'SOC Operations & SIEM Threat Monitoring',
    description: '24/7 security monitoring, custom log correlation rules (Wazuh/Elastic), alert triage, and rapid threat containment to protect enterprise infrastructure.',
    icon: 'Activity',
    order: 1,
  },
  {
    name: 'Linux Infrastructure & Kernel Hardening',
    description: 'Debian/Ubuntu server tuning, automated zero-trust security baselines, systemd isolation, network namespace routing, and custom security orchestration.',
    icon: 'Terminal',
    order: 2,
  },
  {
    name: 'Digital Forensics & Incident Response (DFIR)',
    description: 'Deep-dive memory analysis using Volatility, network packet dissection, endpoint artifact recovery, root-cause investigation, and chain-of-custody documentation.',
    icon: 'Search',
    order: 3,
  },
  {
    name: 'AI & LLM Security Assessment',
    description: 'Adversarial evaluation of generative AI pipelines, prompt injection defense, model extraction protection, context guardrail design, and OWASP Top 10 for LLMs auditing.',
    icon: 'Cpu',
    order: 4,
  },
  {
    name: 'Secure Network Architecture & Covert Channels',
    description: 'Segmentation design, captive authentication portal engineering, firewall orchestration, and deployment of hardened P2P communication architectures.',
    icon: 'Network',
    order: 5,
  },
];

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Services';

    const q = query(collection(db, 'skills'), orderBy('order', 'asc'));
    const unsubSkills = onSnapshot(q, (snapshot) => {
      setSkills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error(err);
      setError("Failed to initialize technical inventory.");
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'skills');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn("Settings fetch failed, using fallbacks", err);
    });

    return () => {
      unsubSkills();
      unsubSettings();
    };
  }, []);

  // Use Firestore services, or fallback to rich defaults if none exist in the database
  const displayServices = skills.length > 0 ? skills : (DEFAULT_SERVICES as Skill[]);

  const getServiceAnchor = (s: Skill | Partial<Skill>, idx: number) => {
    const name = (s.name || '').toLowerCase();
    if (name.includes('penetration') || name.includes('red team')) return 'svc-penetration-testing';
    if (name.includes('soc') || name.includes('siem')) return 'svc-soc';
    if (name.includes('linux') || name.includes('kernel') || name.includes('infrastructure')) return 'svc-linux';
    if (name.includes('forensics') || name.includes('dfir')) return 'svc-dfir';
    if (name.includes('ai') || name.includes('llm')) return 'svc-ai';
    if (name.includes('network') || name.includes('covert')) return 'svc-network';
    return `svc-${s.id || idx}`;
  };

  // Scroll to targeted service if ?service=... is present
  useEffect(() => {
    if (!loading) {
      const targetParam = searchParams.get('service') || searchParams.get('skill');
      if (targetParam) {
        const q = targetParam.toLowerCase().trim();
        setTimeout(() => {
          let el = document.getElementById(`svc-${q}`) || 
                   document.querySelector(`[data-svc-alias="${q}"]`) ||
                   document.querySelector(`[data-svc-name*="${q}"]`);
          
          if (!el) {
            if (q.includes('penetration') || q.includes('red')) el = document.getElementById('svc-penetration-testing');
            else if (q.includes('soc') || q.includes('siem')) el = document.getElementById('svc-soc');
            else if (q.includes('linux') || q.includes('kernel')) el = document.getElementById('svc-linux');
            else if (q.includes('forensic') || q.includes('dfir')) el = document.getElementById('svc-dfir');
            else if (q.includes('ai') || q.includes('llm')) el = document.getElementById('svc-ai');
            else if (q.includes('network')) el = document.getElementById('svc-network');
          }

          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('cyber-teleport-glow');
            setTimeout(() => el.classList.remove('cyber-teleport-glow'), 3500);
          }
        }, 300);
      }
    }
  }, [loading, displayServices, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('syncingArsenal')} speed={20} />
      </div>
    );
  }

  return (
    <PageWrapper className="space-y-12 md:space-y-16 py-8 md:py-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
          <ScrambleHeader text={t('skills')} />
        </h1>
        <div className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium text-sm md:text-base">
          <Typewriter 
            key={settings?.skillsSubtitle || "default"} 
            text={settings?.skillsSubtitle || (language === 'ar' ? "تفصيل شامل للخدمات الفنية والقدرات الأمنية المتقدمة." : "A comprehensive breakdown of specialized cybersecurity services, technical capabilities, and engineering solutions.")} 
            delay={800} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayServices.map((service, i) => {
          const Icon = getServiceIcon(service.icon);
          const anchorId = getServiceAnchor(service, i);

          return (
            <motion.div
              key={service.id || i}
              id={anchorId}
              data-svc-alias={anchorId}
              data-svc-name={(service.name || '').toLowerCase()}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.08, 0.4), duration: 0.5 }}
              whileHover={{ y: -8, borderColor: 'rgba(59, 130, 246, 0.45)' }}
              className="glass-md p-6 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/80 dark:border-white/10 shadow-2xl group transition-all duration-500 flex flex-col justify-between relative overflow-hidden bg-white/75 dark:bg-white/[0.02]"
            >
              {/* Top ambient glow on hover */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />

              <div className="space-y-6 relative z-10">
                {/* Header: Icon & Service Code */}
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center p-3.5 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300">
                    {service.iconUrl ? (
                      <img 
                        src={service.iconUrl} 
                        alt={service.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Icon className="w-8 h-8" />
                    )}
                  </div>

                  <span className="text-[10px] font-mono font-black tracking-widest text-blue-500/60 uppercase px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10">
                    SVC_{String((service.order ?? i) + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Name & Description */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors leading-tight break-words">
                    {service.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-normal">
                    {service.description || (service.category ? `Specialized service in ${service.category}.` : '')}
                  </p>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-6 mt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-mono relative z-10">
                <div className="w-10 h-1 bg-blue-500/30 group-hover:w-20 transition-all duration-500 rounded-full" />
                <span className="text-blue-500 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                  {language === 'ar' ? 'خدمة معتمدة' : 'Verified Capability'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageWrapper>
  );
}

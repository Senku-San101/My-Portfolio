import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Skill, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import ScrambleHeader from '../components/ScrambleHeader';
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
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Services';

    const q = query(collection(db, 'skills'), orderBy('order', 'asc'));
    const unsubSkills = onSnapshot(q, (snapshot) => {
      setSkills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'skills');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    }, (err) => {
      console.warn('Settings fetch failed, using fallbacks', err);
    });

    return () => {
      unsubSkills();
      unsubSettings();
    };
  }, []);

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
        }, 200);
      }
    }
  }, [loading, displayServices, searchParams]);

  return (
    <PageWrapper className="space-y-12 py-6 sm:py-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight uppercase text-gray-900 dark:text-white">
          <ScrambleHeader text={t('skills')} as="span" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.34 }}
          className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium text-sm md:text-base"
        >
          {settings?.skillsSubtitle || (language === 'ar'
            ? 'تفصيل شامل للخدمات الفنية والقدرات الأمنية المتقدمة.'
            : 'A comprehensive breakdown of specialized cybersecurity services, technical capabilities, and engineering solutions.')}
        </motion.p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="glass-md p-7 sm:p-8 rounded-3xl animate-pulse space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-white/10" />
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {displayServices.map((service, i) => {
            const Icon = getServiceIcon(service.icon);
            const anchorId = getServiceAnchor(service, i);

            return (
              <motion.div
                key={service.id || i}
                id={anchorId}
                data-svc-alias={anchorId}
                data-svc-name={(service.name || '').toLowerCase()}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ delay: (i % 3) * 0.05, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5 }}
                className="glass-md p-7 sm:p-8 md:p-9 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm group hover:shadow-xl hover:border-blue-500/40 transition-colors duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                      {service.iconUrl ? (
                        <img
                          src={service.iconUrl}
                          alt={service.name}
                          loading="lazy"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Icon className="w-7 h-7" />
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold tracking-widest text-blue-600/70 dark:text-blue-400/70 tabular-nums">
                      {String((service.order ?? i) + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {service.description || (service.category ? `Specialized service in ${service.category}.` : '')}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-6 border-t border-gray-200/70 dark:border-white/10">
                  <div className="w-10 h-1 bg-blue-500/35 group-hover:w-16 transition-all duration-300 rounded-full" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}

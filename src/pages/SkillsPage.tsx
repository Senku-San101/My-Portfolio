import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Globe, Lock, Shield, Terminal, Zap } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Skill, AppSettings } from '../types';
import Typewriter from '../components/Typewriter';
import ScrambleHeader from '../components/ScrambleHeader';
import PageWrapper from '../components/PageWrapper';
import { useLanguage } from '../context/LanguageContext';

const ICON_MAP: Record<string, any> = {
  'Operating Systems': Terminal,
  'Virtualization & Cloud': Globe,
  'Security Platforms': Shield,
  'Defensive Operations': Lock,
  'Web Technologies': Zap,
  'Hardware': Cpu
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('syncingArsenal')} speed={20} />
      </div>
    );
  }

  // Group by category
  const categories = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <PageWrapper className="space-y-16 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic">
          <ScrambleHeader text={t('arsenal')} />
        </h1>
        <div className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
          <Typewriter key={settings?.skillsSubtitle || "default"} text={settings?.skillsSubtitle || "A comprehensive breakdown of technical proficiencies across security, engineering, and infrastructure."} delay={800} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(Object.entries(categories) as [string, Skill[]][]).map(([category, items], i) => {
          const Icon = ICON_MAP[category] || Shield;
          return (
            <div
              key={category}
              className="glass-md p-8 rounded-[2.5rem] space-y-8 flex flex-col h-full hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">{category}</h3>
              </div>

              <div className="flex flex-wrap gap-3">
                {items.map((skill) => (
                  <div
                    key={skill.id}
                    className="glass-sm px-4 py-2 rounded-xl text-sm font-medium border border-blue-500/10 flex items-center space-x-2"
                  >
                    <span>{skill.name}</span>
                    {skill.level === 'Advanced' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </PageWrapper>
  );
}

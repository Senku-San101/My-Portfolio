import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  about: { en: 'About', ar: 'حول' },
  experience: { en: 'Experience', ar: 'الخبرة' },
  projects: { en: 'Projects', ar: 'المشاريع' },
  certificates: { en: 'Certificates', ar: 'الشهادات' },
  skills: { en: 'Services', ar: 'الخدمات' },
  blog: { en: 'Blogs', ar: 'المدونة' },
  contactNav: { en: 'Contact', ar: 'اتصل بي' },
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },
  admin: { en: 'Admin', ar: 'المسؤول' },
  certs: { en: 'Certs', ar: 'شهادات' },
  initializing: { en: 'Loading...', ar: 'جاري التحميل...' },
  retrievingExperience: { en: 'Loading Experience...', ar: 'جاري تحميل الخبرات...' },
  accessingDatabase: { en: 'Loading Data...', ar: 'جاري تحميل البيانات...' },
  verifyingCredentials: { en: 'Verifying...', ar: 'جاري التحقق...' },
  syncingArsenal: { en: 'Syncing Services...', ar: 'جاري المزامنة...' },
  liveFeed: { en: 'Profile Details', ar: 'تفاصيل الملف الشخصي' },
  establishLink: { en: 'Contact', ar: 'الاتصال' },
  specializations: { en: 'Specializations', ar: 'التخصصات' },
  journey: { en: 'Professional Journey', ar: 'المسيرة المهنية' },
  secLab: { en: 'Portfolio', ar: 'الموقع' },
  verifiedCerts: { en: 'Verified Certs', ar: 'شهادات معتمدة' },
  arsenal: { en: 'Services & Skills', ar: 'الخدمات والمهارات' },
  viewProject: { en: 'Source Code', ar: 'كود المصدر' },
  demo: { en: 'Live Demo', ar: 'عرض مباشر' },
  backToLab: { en: 'Back', ar: 'العودة' },
  rights: { en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.' },
  crafted: { en: 'Designed and Built with Modern Technologies', ar: 'تم التصميم والتطوير بأحدث التقنيات' },
  contact: { en: 'Send Message', ar: 'إرسال رسالة' },
  contactTitle: { en: 'Get In Touch', ar: 'تواصل معي' },
  contactName: { en: 'Name', ar: 'الاسم' },
  contactEmail: { en: 'Email', ar: 'البريد الإلكتروني' },
  contactMessage: { en: 'Message', ar: 'الرسالة' },
  contactSend: { en: 'Send Message', ar: 'إرسال الرسالة' },
  contactSuccess: { en: 'Message Sent Successfully.', ar: 'تم إرسال الرسالة بنجاح.' },
  contactError: { en: 'Failed to send message.', ar: 'فشل إرسال الرسالة.' },
  inbox: { en: 'Inbox', ar: 'الوارد' },
  soc: { en: 'SOC Analysis', ar: 'تحليل SOC' },
  socDesc: { en: 'Real-time monitoring and threat detection using SIEM platforms like Wazuh.', ar: 'مراقبة في الوقت الفعلي وكشف التهديدات باستخدام منصات SIEM مثل Wazuh.' },
  forensics: { en: 'Digital Forensics', ar: 'التحليل الجنائي الرقمي' },
  forensicsDesc: { en: 'Incident analysis, memory forensics, and deep system investigations.', ar: 'تحليل الحوادث، والتحليل الجنائي للذاكرة، والتحقيقات العميقة في الأنظمة.' },
  linux: { en: 'Linux Engineering', ar: 'هندسة لينكس' },
  linuxDesc: { en: 'Expertise in Debian/Ubuntu, kernel tuning, and automated security hardening.', ar: 'خبرة في ديبيان/أوبونتو، وضبط النواة، وتحصين الأمان المؤتمت.' },
  sendAnother: { en: 'Send another message', ar: 'إرسال رسالة أخرى' },
  placeholderName: { en: 'Your Name', ar: 'اسمك' },
  placeholderEmail: { en: 'yourname@example.com', ar: 'mail@example.com' },
  placeholderMessage: { en: 'Write your message here...', ar: 'اكتب رسالتك هنا...' },
  placeholderTransmitting: { en: 'Sending...', ar: 'جاري الإرسال...' },
  downloadCv: { en: 'My CV', ar: 'سيرتي الذاتية' },
  downloadMyCv: { en: 'Download My CV', ar: 'تحميل سيرتي الذاتية' },
  inProgress: { en: 'In progress', ar: 'قيد التنفيذ' },
  wantToSee: { en: 'Do you want to see?', ar: 'هل تود الاستكشاف؟' },
  exploreMore: { en: 'Keep Discovering', ar: 'واصل الاستكشاف' },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as Language) || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

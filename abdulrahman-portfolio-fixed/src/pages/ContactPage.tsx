import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Linkedin, Github, MapPin, Copy, Check, Send, Globe, Phone, MessageSquare, BookOpen, Link2, MessageCircle } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, openLink } from '../lib/firebase';
import { Profile, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import { useLanguage } from '../context/LanguageContext';
import Typewriter from '../components/Typewriter';

const getContactIcon = (type: string) => {
  switch (type) {
    case 'email': return <Mail className="w-4.5 h-4.5" />;
    case 'phone': return <Phone className="w-4.5 h-4.5" />;
    case 'whatsapp': return <MessageCircle className="w-4.5 h-4.5" />;
    case 'linkedin': return <Linkedin className="w-4.5 h-4.5" />;
    case 'x': return <Globe className="w-4.5 h-4.5" />;
    case 'github': return <Github className="w-4.5 h-4.5" />;
    case 'medium': return <BookOpen className="w-4.5 h-4.5" />;
    case 'telegram': return <Send className="w-4.5 h-4.5" />;
    case 'website': return <Globe className="w-4.5 h-4.5" />;
    default: return <Link2 className="w-4.5 h-4.5" />;
  }
};

const getContactStyles = (type: string) => {
  switch (type) {
    case 'email': return 'bg-blue-500/10 text-blue-500';
    case 'phone': return 'bg-emerald-500/10 text-emerald-500';
    case 'whatsapp': return 'bg-green-500/10 text-green-500';
    case 'linkedin': return 'bg-blue-600/10 text-blue-600';
    case 'x': return 'bg-gray-950/10 text-gray-900 dark:bg-white/10 dark:text-white';
    case 'github': return 'bg-zinc-800/10 text-zinc-800 dark:text-zinc-200';
    case 'medium': return 'bg-zinc-900/10 text-zinc-900 dark:bg-white/10 dark:text-white';
    case 'telegram': return 'bg-sky-500/10 text-sky-500';
    case 'website': return 'bg-indigo-500/10 text-indigo-500';
    default: return 'bg-purple-500/10 text-purple-500';
  }
};

export default function ContactPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { language, t } = useLanguage();

  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Abdulrahman Kamal | Contact';

    const unsubProfile = onSnapshot(doc(db, 'profile', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as Profile);
      }
    }, (err) => {
      console.error(err);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubSettings();
    };
  }, []);

  const copyEmail = () => {
    const email = profile?.email || 'Abdulrahmankamal609@gmail.com';
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await addDoc(collection(db, 'messages'), {
        ...formState,
        timestamp: new Date().toISOString(),
      });
      setSubmitSuccess(true);
      setFormState({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      setSubmitError(language === 'en' ? 'Failed to send message. Please try again.' : 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono text-blue-500 tracking-widest text-xs uppercase">
        <Typewriter text={t('initializing')} speed={20} />
      </div>
    );
  }

  const data: Profile = profile || {
    name: 'Abdulrahman Kamal',
    title: 'Cybersecurity Engineer',
    bio: 'Dedicated professional focused on advancing national cybersecurity through robust infrastructure frameworks, strict policies, and defensive operations.',
    location: 'Aden, Yemen',
    email: 'Abdulrahmankamal609@gmail.com',
    phone: '',
    linkedin: 'https://linkedin.com/in/abdulrahman-kamal/',
    github: 'https://github.com/GIGA-YZ',
    photoUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    cvUrl: '',
    contactMethods: []
  };

  return (
    <PageWrapper className="max-w-5xl mx-auto py-8">
      {/* Page Header */}
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mx-auto">
          <Mail className="w-3.5 h-3.5" />
          <span>{language === 'en' ? "LET'S CONNECT" : 'تواصل معي'}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-[#1D1D1F] dark:text-[#F5F5F7]">
          {language === 'en' ? 'Contact Me' : 'اتصل بي'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-sm font-medium">
          {language === 'en' 
            ? (settings?.contactSubtitleEn || 'Feel free to reach out for inquiries, collaborations, or general professional consultation.') 
            : (settings?.contactSubtitleAr || 'يسعدني تواصلك معي بخصوص الاستفسارات، التعاون المشترك، أو الاستشارات المهنية العامة.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Info Column (Left) */}
        <div className="col-span-1 md:col-span-5 flex flex-col justify-between gap-8">
          <div className="bg-white dark:bg-zinc-900/30 rounded-[2.5rem] p-8 border border-gray-200 dark:border-white/5 space-y-8 flex-1 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-blue-500">
                {language === 'en' ? 'Contact Information' : 'معلومات الاتصال'}
              </h3>

              {/* Email Address Widget */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block uppercase">
                  {language === 'en' ? 'Email Address' : 'البريد الإلكتروني المباشر'}
                </span>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.02] p-4.5 rounded-2xl border border-gray-100 dark:border-white/5 group relative overflow-hidden">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <button 
                      onClick={() => openLink(`mailto:${data.email}`)}
                      className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors block text-start truncate w-full"
                    >
                      {data.email}
                    </button>
                  </div>
                  <button 
                    onClick={copyEmail}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all flex-shrink-0"
                    title={language === 'en' ? 'Copy email address' : 'نسخ العنوان'}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Geographic Location */}
              {data.location && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 block uppercase">
                    {language === 'en' ? 'Location' : 'الموقع الحالي'}
                  </span>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.02] p-4.5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-left rtl:text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white block">
                        {data.location}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Channels */}
            {((data.contactMethods && data.contactMethods.length > 0) || data.linkedin || data.github) && (
              <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  {language === 'en' ? 'Other Platforms' : 'منصات أخرى'}
                </h4>
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                  {data.contactMethods && data.contactMethods.length > 0 ? (
                    data.contactMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          const val = method.value;
                          if (val.startsWith('http://') || val.startsWith('https://')) {
                            openLink(val);
                          } else if (method.type === 'email') {
                            openLink(`mailto:${val}`);
                          } else if (method.type === 'phone' || method.type === 'whatsapp') {
                            const cleanNum = val.replace(/[^\d+]/g, '');
                            if (method.type === 'whatsapp') {
                              openLink(`https://wa.me/${cleanNum.replace('+', '')}`);
                            } else {
                              openLink(`tel:${cleanNum}`);
                            }
                          } else {
                            navigator.clipboard.writeText(val);
                            alert(language === 'en' ? `Copied to clipboard: ${val}` : `تم نسخ: ${val}`);
                          }
                        }}
                        className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-800 dark:text-gray-300 transition-all text-sm font-bold text-left w-full cursor-pointer"
                      >
                        <div className={`p-2 rounded-xl flex-shrink-0 ${getContactStyles(method.type)}`}>
                          {getContactIcon(method.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-0.5">
                            {method.label}
                          </span>
                          <span className="font-bold truncate block">{method.value}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <>
                      {data.linkedin && (
                        <button
                          onClick={() => openLink(data.linkedin!)}
                          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-800 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-all text-sm font-black uppercase tracking-wider text-left w-full"
                        >
                          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl flex-shrink-0">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <span>LinkedIn Profile</span>
                        </button>
                      )}
                      {data.github && (
                        <button
                          onClick={() => openLink(data.github!)}
                          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/10 text-gray-800 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-all text-sm font-black uppercase tracking-wider text-left w-full"
                        >
                          <div className="p-2 bg-gray-500/10 text-gray-600 dark:text-white rounded-xl flex-shrink-0">
                            <Github className="w-4 h-4" />
                          </div>
                          <span>GitHub Archive</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messaging (Right) */}
        <div className="col-span-1 md:col-span-7">
          <div className="bg-white dark:bg-zinc-900/30 rounded-[2.5rem] p-8 border border-gray-200 dark:border-white/5 shadow-sm h-full flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-blue-500 mb-2">
                {language === 'en' ? 'Send a Message' : 'إرسال رسالة'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {language === 'en' 
                  ? 'Fill in the form below to send a direct message. I will respond as soon as possible.' 
                  : 'يرجى ملء النموذج أدناه لإرسال رسالة مباشرة. سأقوم بالرد عليك في أقرب وقت ممكن.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 text-center space-y-6 flex-1 flex flex-col justify-center items-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {language === 'en' ? 'Message Sent!' : 'تم الإرسال بنجاح!'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                      {language === 'en' 
                        ? 'Thank you! Your message has been received successfully.' 
                        : 'شكراً لك! تم استلام رسالتك بنجاح.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSubmitSuccess(false)} 
                    className="px-6 py-2.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-black uppercase tracking-wider text-[10px] hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-transparent dark:border-white/5 cursor-pointer"
                  >
                    {t('sendAnother')}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block pl-2">
                        {t('contactName')}
                      </label>
                      <input 
                        required
                        name="name"
                        type="text"
                        value={formState.name}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400 text-sm py-3.5 px-4.5 rounded-xl text-gray-900 dark:text-white font-bold"
                        placeholder={t('placeholderName')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block pl-2">
                        {t('contactEmail')}
                      </label>
                      <input 
                        required
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400 text-sm py-3.5 px-4.5 rounded-xl text-gray-900 dark:text-white font-bold"
                        placeholder={t('placeholderEmail')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block pl-2">
                        {t('contactMessage')}
                      </label>
                      <textarea 
                        required
                        name="message"
                        rows={4}
                        value={formState.message}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400 text-sm py-3.5 px-4.5 rounded-2xl text-gray-900 dark:text-white font-bold resize-none"
                        placeholder={t('placeholderMessage')}
                      />
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-xs font-mono text-center my-2">{submitError}</p>
                  )}

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl py-4 px-8 text-xs font-black uppercase tracking-widest hover:opacity-95 transition-all shadow-[0_8px_25px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2.5 duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <span>{submitting ? t('placeholderTransmitting') : t('contactSend')}</span>
                    {!submitting && <Send className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Linkedin, Github, MapPin, Copy, Check, Send, Globe, Phone, BookOpen, Link2, MessageCircle } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db, openLink } from '../lib/firebase';
import { Profile, AppSettings } from '../types';
import PageWrapper from '../components/PageWrapper';
import ScrambleHeader from '../components/ScrambleHeader';
import { useLanguage } from '../context/LanguageContext';

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
    case 'email': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'phone': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'whatsapp': return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'linkedin': return 'bg-blue-600/10 text-blue-600 dark:text-blue-400';
    case 'x': return 'bg-gray-950/10 text-gray-900 dark:bg-white/10 dark:text-white';
    case 'github': return 'bg-zinc-800/10 text-zinc-800 dark:text-zinc-200';
    case 'medium': return 'bg-zinc-900/10 text-zinc-900 dark:bg-white/10 dark:text-white';
    case 'telegram': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    case 'website': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    default: return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  }
};

const DEFAULT_PROFILE: Profile = {
  name: 'Abdulrahman Kamal',
  title: 'Cybersecurity Engineer',
  bio: 'Dedicated professional focused on advancing national cybersecurity through robust infrastructure frameworks, strict policies, and defensive operations.',
  location: 'Aden, Yemen',
  email: 'Abdulrahmankamal609@gmail.com',
  phone: '',
  linkedin: 'https://linkedin.com/in/abdulrahman-kamal/',
  github: 'https://github.com/GIGA-YZ',
  photoUrl: '',
  cvUrl: '',
  contactMethods: []
};

export default function ContactPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMethodId, setCopiedMethodId] = useState<string | null>(null);
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
    }, (err) => {
      console.error(err);
    });

    return () => {
      unsubProfile();
      unsubSettings();
    };
  }, []);

  const data: Profile = profile || DEFAULT_PROFILE;

  const copyEmail = () => {
    const email = data.email || 'Abdulrahmankamal609@gmail.com';
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

  return (
    <PageWrapper className="max-w-5xl mx-auto py-6 sm:py-8">
      <div className="text-center space-y-3 mb-12 sm:mb-14">
        <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold uppercase tracking-[0.2em]">
          <Mail className="w-3.5 h-3.5" />
          <span>{language === 'en' ? "Let's Connect" : 'تواصل معي'}</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase text-[#1D1D1F] dark:text-[#F5F5F7]">
          <ScrambleHeader text={language === 'en' ? 'Contact Me' : 'اتصل بي'} as="span" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.34 }}
          className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto text-sm font-medium"
        >
          {language === 'en'
            ? (settings?.contactSubtitleEn || 'Feel free to reach out for inquiries, collaborations, or general professional consultation.')
            : (settings?.contactSubtitleAr || 'يسعدني تواصلك معي بخصوص الاستفسارات، التعاون المشترك، أو الاستشارات المهنية العامة.')}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Info Column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 md:col-span-5 flex flex-col justify-between gap-8"
        >
          <div className="bg-white dark:bg-zinc-900/40 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 space-y-7 flex-1 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                {language === 'en' ? 'Contact Information' : 'معلومات الاتصال'}
              </h3>

              {/* Email Address Widget */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block uppercase">
                  {language === 'en' ? 'Email Address' : 'البريد الإلكتروني المباشر'}
                </span>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-200/70 dark:border-white/10">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <button
                      onClick={() => openLink(`mailto:${data.email}`)}
                      className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block text-start truncate w-full cursor-pointer"
                    >
                      {data.email}
                    </button>
                  </div>
                  <button
                    onClick={copyEmail}
                    className="p-2 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 transition-colors flex-shrink-0 cursor-pointer"
                    title={language === 'en' ? 'Copy email address' : 'نسخ العنوان'}
                    aria-label="Copy email address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Geographic Location */}
              {data.location && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block uppercase">
                    {language === 'en' ? 'Location' : 'الموقع الحالي'}
                  </span>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-200/70 dark:border-white/10">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="text-start">
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
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  {language === 'en' ? 'Other Platforms' : 'منصات أخرى'}
                </h4>
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pe-1 no-scrollbar">
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
                            setCopiedMethodId(method.id);
                            setTimeout(() => setCopiedMethodId(null), 2000);
                          }
                        }}
                        className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-colors text-sm font-bold text-start w-full cursor-pointer"
                      >
                        <div className={`p-2 rounded-xl flex-shrink-0 ${getContactStyles(method.type)}`}>
                          {getContactIcon(method.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                            {method.label}
                          </span>
                          <span className="font-bold truncate block">
                            {copiedMethodId === method.id ? (language === 'en' ? 'Copied to clipboard' : 'تم النسخ') : method.value}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <>
                      {data.linkedin && (
                        <button
                          onClick={() => openLink(data.linkedin!)}
                          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-wider text-start w-full cursor-pointer"
                        >
                          <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <span>LinkedIn Profile</span>
                        </button>
                      )}
                      {data.github && (
                        <button
                          onClick={() => openLink(data.github!)}
                          className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-wider text-start w-full cursor-pointer"
                        >
                          <div className="p-2 bg-gray-500/10 text-gray-700 dark:text-white rounded-xl flex-shrink-0">
                            <Github className="w-4 h-4" />
                          </div>
                          <span>GitHub Profile</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Messaging */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 md:col-span-7"
        >
          <div className="bg-white dark:bg-zinc-900/40 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-2">
                {language === 'en' ? 'Send a Message' : 'إرسال رسالة'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                {language === 'en'
                  ? 'Fill in the form below to send a direct message. I will respond as soon as possible.'
                  : 'يرجى ملء النموذج أدناه لإرسال رسالة مباشرة. سأقوم بالرد عليك في أقرب وقت ممكن.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="py-12 text-center space-y-5 flex-1 flex flex-col justify-center items-center"
                >
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {language === 'en' ? 'Message Sent!' : 'تم الإرسال بنجاح!'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                      {language === 'en'
                        ? 'Thank you! Your message has been received.'
                        : 'شكراً لك! تم استلام رسالتك بنجاح.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {t('sendAnother')}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block ps-1">
                        {t('contactName')}
                      </label>
                      <input
                        required
                        name="name"
                        type="text"
                        value={formState.name}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400 text-sm py-3.5 px-4 rounded-xl text-gray-900 dark:text-white font-semibold"
                        placeholder={t('placeholderName')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block ps-1">
                        {t('contactEmail')}
                      </label>
                      <input
                        required
                        name="email"
                        type="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400 text-sm py-3.5 px-4 rounded-xl text-gray-900 dark:text-white font-semibold"
                        placeholder={t('placeholderEmail')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block ps-1">
                        {t('contactMessage')}
                      </label>
                      <textarea
                        required
                        name="message"
                        rows={4}
                        value={formState.message}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400 text-sm py-3.5 px-4 rounded-2xl text-gray-900 dark:text-white font-semibold resize-none"
                        placeholder={t('placeholderMessage')}
                      />
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-xs font-mono text-center my-2">{submitError}</p>
                  )}

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl py-4 px-8 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{submitting ? t('placeholderTransmitting') : t('contactSend')}</span>
                    {!submitting && <Send className="w-4 h-4" />}
                  </motion.button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}

export interface ContactMethod {
  id: string;
  type: 'email' | 'phone' | 'whatsapp' | 'linkedin' | 'x' | 'github' | 'medium' | 'telegram' | 'website' | 'other';
  label: string;
  value: string;
  order: number;
}

export interface Profile {
  name: string;
  title: string;
  bio: string;
  cvUrl?: string;
  specializations?: string[];
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  photoUrl: string;
  contactMethods?: ContactMethod[];
}

export interface Experience {
  id?: string;
  company: string;
  position: string;
  location: string;
  period: string;
  description: string;
  bullets: string[];
  imageUrl?: string;
  images?: string[];
  link?: { url: string; text: string };
  order: number;
}

export interface Certificate {
  id?: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  imageUrl?: string;
  images?: string[];
  link?: { url: string; text: string };
  order: number;
  worth?: number;
  inProgress?: boolean;
  description?: string;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  videoThumbnail?: string;
  link?: { url: string; text: string };
  githubLink?: string;
  order: number;
  inProgress?: boolean;
}

export interface Specialization {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  order: number;
}

export interface Skill {
  id?: string;
  category: string;
  name: string;
  level: string; // e.g., "Beginner", "Intermediate", "Advanced"
  order: number;
}

export interface Message {
  id?: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

export interface Visit {
  id?: string;
  sessionId: string;
  userAgent: string;
  language: string;
  startTime: string;
  endTime: string;
  duration: number;
  path: string;
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  referrer?: string;
}

export interface Blog {
  id?: string;
  title: string;
  content: string;
  description?: string;
  date: string;
  imageUrl?: string;
  tags?: string[];
  status: 'draft' | 'published';
  externalUrl?: string;
}

export interface AppSettings {
  chatBotInstructions?: string;
  geminiApiKey?: string;
  specializations?: string[];
  siteName?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  desktopNavOrder?: string[];
  mobilePrimaryNav?: string[];
  mobileSecondaryNav?: string[];
  experienceSubtitle?: string;
  projectsSubtitle?: string;
  certificatesSubtitle?: string;
  skillsSubtitle?: string;
  blogsSubtitle?: string;
  contactSubtitleEn?: string;
  contactSubtitleAr?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
  showVideoThumbnailAsProjectImage?: boolean;
}

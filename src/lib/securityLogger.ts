import { collection, addDoc, getDocs, writeBatch, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { LoginLog } from '../types';

const LOCKOUT_STORAGE_KEY = 'portal_admin_lockout';

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
}

/**
 * Parses user agent string into friendly browser, OS, and device categories
 */
export function parseUserAgent(uaString?: string): { browser: string; os: string; device: string } {
  const ua = uaString || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  
  // Device
  let device = 'Desktop';
  if (/mobile|android|touch/i.test(ua)) {
    device = 'Mobile';
  }
  if (/tablet|ipad/i.test(ua)) {
    device = 'Tablet';
  }

  // OS
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  // Browser
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/(\d+[\.\d]*)/);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/OPR\//i.test(ua)) {
    const match = ua.match(/OPR\/(\d+[\.\d]*)/);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Chrome\//i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+[\.\d]*)/);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+[\.\d]*)/);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/(\d+[\.\d]*)/);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  return { browser, os, device };
}

/**
 * Fetches public IP and basic location information with fast timeouts and fallbacks
 */
export async function getClientNetworkInfo(): Promise<{
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
}> {
  // Strategy 1: Attempt ipapi.co for rich geolocation (2.5s timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        return {
          ip: data.ip,
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || data.country || '',
          countryCode: data.country_code || '',
          isp: data.org || '',
        };
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // Strategy 2: Fast IP-only via ipify (1.5s timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        return { ip: data.ip };
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // Strategy 3: Server backend endpoint /api/auth/client-info
  try {
    const res = await fetch('/api/auth/client-info');
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        return { ip: data.ip };
      }
    }
  } catch (e) {
    // All fallbacks failed
  }

  return { ip: '127.0.0.1' };
}

/**
 * Checks current brute-force lockout status from storage
 */
export function getLoginLockoutStatus(): LockoutStatus {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
    
    const data = JSON.parse(raw);
    const now = Date.now();
    
    if (data.lockedUntil && data.lockedUntil > now) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        attemptsCount: data.attempts || 0,
      };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsCount: data.attempts || 0,
    };
  } catch (e) {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
  }
}

/**
 * Records a failed login attempt and applies progressive lockdown
 */
export function recordFailedLoginAttempt(): LockoutStatus {
  try {
    const current = getLoginLockoutStatus();
    const newCount = (current.attemptsCount || 0) + 1;
    const now = Date.now();
    let lockDurationMs = 0;

    // Progressive lockout rules
    if (newCount >= 10) {
      lockDurationMs = 15 * 60 * 1000; // 15 minutes lockout
    } else if (newCount >= 7) {
      lockDurationMs = 5 * 60 * 1000; // 5 minutes lockout
    } else if (newCount >= 5) {
      lockDurationMs = 60 * 1000; // 60 seconds lockout
    }

    const lockedUntil = lockDurationMs > 0 ? now + lockDurationMs : 0;
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify({
      attempts: newCount,
      lastFailedAt: now,
      lockedUntil,
    }));

    return {
      isLocked: lockDurationMs > 0,
      remainingSeconds: Math.ceil(lockDurationMs / 1000),
      attemptsCount: newCount,
    };
  } catch (e) {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 1 };
  }
}

/**
 * Clears lockout state on successful authentication
 */
export function clearLoginLockout(): void {
  try {
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Automatically logs a verified successful login into the `login_logs` audit collection
 */
export async function recordSuccessfulLogin(
  user: { email?: string | null; uid: string },
  options?: { authMethod?: string }
): Promise<string | null> {
  try {
    clearLoginLockout();

    const networkInfo = await getClientNetworkInfo();
    const { browser, os, device } = parseUserAgent();
    
    // Generate high-entropy session fingerprint
    const sessionFingerprint = 'sec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown';

    const logEntry: Omit<LoginLog, 'id'> = {
      email: user.email || 'abdo@kamal.portfolio',
      userId: user.uid,
      timestamp: serverTimestamp(),
      isoDate: new Date().toISOString(),
      ip: networkInfo.ip || 'Unknown',
      city: networkInfo.city || '',
      region: networkInfo.region || '',
      country: networkInfo.country || '',
      countryCode: networkInfo.countryCode || '',
      isp: networkInfo.isp || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      browser,
      os,
      device,
      screenResolution: screenRes,
      status: 'success',
      authMethod: options?.authMethod || 'Password Authentication',
      fingerprint: sessionFingerprint,
    };

    const docRef = await addDoc(collection(db, 'login_logs'), logEntry);
    console.log('[Security Audit] Successfully recorded admin login log:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.error('[Security Audit] Failed to record login audit log:', err);
    return null;
  }
}

/**
 * Master Purge: deletes all documents in `login_logs` collection in batches.
 * Corresponds to the user's specific request: "that log is no deletable .. just has one button to delete all"
 */
export async function purgeAllLoginLogs(): Promise<number> {
  const q = collection(db, 'login_logs');
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return 0;
  }

  // Firestore batch limit is 500 operations
  const batches = [];
  let currentBatch = writeBatch(db);
  let count = 0;

  for (const doc of snapshot.docs) {
    currentBatch.delete(doc.ref);
    count++;
    if (count % 450 === 0) {
      batches.push(currentBatch.commit());
      currentBatch = writeBatch(db);
    }
  }

  if (count % 450 !== 0) {
    batches.push(currentBatch.commit());
  }

  await Promise.all(batches);
  return count;
}

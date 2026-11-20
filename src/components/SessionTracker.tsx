import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SessionTracker() {
  const location = useLocation();
  const sessionRef = useRef<string | null>(null);
  const docRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Generate a simple unique ID for this browser session
    let sessionId = sessionStorage.getItem('portfolio_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('portfolio_session_id', sessionId);
    }
    sessionRef.current = sessionId;

    const initVisit = async () => {
      try {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        let deviceType = 'Desktop';

        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
          deviceType = 'Tablet';
        } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
          deviceType = 'Mobile';
        }

        if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr|opera/i.test(ua)) {
          browser = 'Chrome';
        } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua) && !/android/i.test(ua)) {
          browser = 'Safari';
        } else if (/firefox|fxios/i.test(ua)) {
          browser = 'Firefox';
        } else if (/edge|edg/i.test(ua)) {
          browser = 'Edge';
        } else if (/opr|opera/i.test(ua)) {
          browser = 'Opera';
        }

        if (/windows/i.test(ua)) {
          os = 'Windows';
        } else if (/macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua)) {
          os = 'macOS';
        } else if (/iphone|ipad|ipod/i.test(ua)) {
          os = 'iOS';
        } else if (/android/i.test(ua)) {
          os = 'Android';
        } else if (/linux/i.test(ua)) {
          os = 'Linux';
        }

        const screenResolution = `${window.screen.width}x${window.screen.height}`;
        const referrer = document.referrer || 'Direct';

        let ipData = {};
        try {
          const ipRes = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
          });
          if (ipRes.ok) {
            const json = await ipRes.json();
            ipData = {
              ip: json.ip || 'Unknown',
              city: json.city || 'Unknown',
              region: json.region || 'Unknown',
              country: json.country_name || 'Unknown',
              countryCode: json.country_code || 'Unknown',
              isp: json.org || 'Unknown'
            };
          }
        } catch {
          // Silently skip geolocation if blocked or timed out
        }

        const visitData = {
          sessionId: sessionRef.current,
          userAgent: ua,
          language: navigator.language,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: 0,
          path: location.pathname,
          deviceType,
          browser,
          os,
          screenResolution,
          referrer,
          ...ipData
        };
        const ref = await addDoc(collection(db, 'visits'), visitData);
        docRef.current = ref.id;
      } catch (error) {
        console.error('Failed to initialize visit tracking:', error);
      }
    };

    const deferTimer = setTimeout(() => {
      initVisit();
    }, 1500);

    const heartbeat = setInterval(async () => {
      if (docRef.current) {
        const now = Date.now();
        const duration = Math.floor((now - startTimeRef.current) / 1000);
        try {
          await updateDoc(doc(db, 'visits', docRef.current), {
            endTime: new Date().toISOString(),
            duration: duration,
            path: location.pathname
          });
        } catch (err) {
          console.error('Heartbeat update failed:', err);
        }
      }
    }, 10000);

    return () => {
      clearTimeout(deferTimer);
      clearInterval(heartbeat);
    };
  }, []);

  // Update path when it changes
  useEffect(() => {
    if (docRef.current) {
      updateDoc(doc(db, 'visits', docRef.current), {
        path: location.pathname
      }).catch(console.error);
    }
  }, [location.pathname]);

  return null;
}

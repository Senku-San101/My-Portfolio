import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*';
const ARABIC_OR_NON_LATIN = /[^\u0020-\u007E]/;

interface ScrambleHeaderProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
  delay?: number;
  duration?: number;
}

export default function ScrambleHeader({
  text,
  className = '',
  as = 'span',
  delay = 40,
  duration = 380,
}: ScrambleHeaderProps) {
  const isNonLatin = ARABIC_OR_NON_LATIN.test(text);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!text || isNonLatin) {
      setDisplayText(text);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(text);
      return;
    }

    let rafId = 0;
    let startTime = 0;

    const timeoutId = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        const settledCount = Math.floor(progress * text.length);

        let next = '';
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === ' ' || ch === '&' || ch === '-' || i < settledCount) {
            next += ch;
          } else {
            next += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
        }
        setDisplayText(next);

        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          setDisplayText(text);
        }
      };

      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [text, isNonLatin, delay, duration]);

  const MotionTag = motion[as];

  return (
    <MotionTag
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {displayText}
    </MotionTag>
  );
}

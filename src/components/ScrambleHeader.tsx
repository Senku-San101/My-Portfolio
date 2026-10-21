import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface ScrambleHeaderProps {
  text: string;
  className?: string;
  active?: boolean;
}

export default function ScrambleHeader({ text, className = "", active = false }: ScrambleHeaderProps) {
  const [displayText, setDisplayText] = useState(text);
  const characters = '!@#$%^&*()_+{}:"<>?|[];\',./`~';
  const isScrambling = useRef(false);

  const startScramble = () => {
    if (isScrambling.current) return;
    isScrambling.current = true;
    let frame = 0;
    const maxFrames = 20;
    const interval = setInterval(() => {
      frame++;
      const scrambled = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (frame / maxFrames > (index / text.length)) return char;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join('');
      
      setDisplayText(scrambled);
      if (frame >= maxFrames) {
        clearInterval(interval);
        isScrambling.current = false;
      }
    }, 50);
  };

  useEffect(() => {
    startScramble();
  }, [text]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.8) startScramble();
    }, 5000);
    return () => clearInterval(interval);
  }, [active, text]);

  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      onMouseEnter={startScramble}
      className={`inline-block ${className}`}
    >
      {displayText}
    </motion.span>
  );
}

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className = "" }: PageWrapperProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { 
      opacity: 0, 
      y: 10,
    },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 20,
      }
    },
  };

  // Convert children to array and wrap them to stagger
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {childrenArray.map((child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

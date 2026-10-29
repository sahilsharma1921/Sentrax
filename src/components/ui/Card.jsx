import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hoverEffect = false, onClick, ...props }) => {
  const content = (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        hoverEffect ? 'hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );

  if (hoverEffect) {
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
        {content}
      </motion.div>
    );
  }

  return content;
};
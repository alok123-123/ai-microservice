import React from 'react';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border";
  
  const variants = {
    positive: "bg-positive/10 text-positive border-positive/20",
    negative: "bg-negative/10 text-negative border-negative/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    neutral: "bg-text-secondary/10 text-text-secondary border-text-secondary/20",
  };

  return (
    <span className={`${baseClasses} ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
}

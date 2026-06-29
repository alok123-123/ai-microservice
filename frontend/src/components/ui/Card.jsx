import React from 'react';

export function Card({ children, className = '', noPadding = false }) {
  return (
    <div className={`premium-glass ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
}

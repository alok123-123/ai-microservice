import React from 'react';
import { Card } from './Card';

export function Metric({ title, value, icon: Icon, trend, trendLabel }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  
  const trendColor = isPositive ? 'text-positive' : isNegative ? 'text-negative' : 'text-text-secondary';
  const trendIcon = isPositive ? '↗' : isNegative ? '↘' : '→';

  return (
    <Card className="flex flex-col justify-between group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</h3>
        {Icon && <Icon className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors" />}
      </div>
      
      <div>
        <p className="text-2xl font-mono font-bold text-text-primary">
          {value !== null && value !== undefined ? value : '—'}
        </p>
        
        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-mono font-semibold ${trendColor}`}>
              {trendIcon} {Math.abs(trend).toFixed(2)}{typeof trend === 'number' && trendLabel?.includes('%') ? '' : '%'}
            </span>
            {trendLabel && <span className="text-[10px] text-text-secondary">{trendLabel}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

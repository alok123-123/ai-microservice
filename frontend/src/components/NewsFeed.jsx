import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Badge } from './ui/Badge';

export default function NewsFeed({ articles }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-3 border border-border">
          <Clock className="w-6 h-6 text-text-secondary opacity-50" />
        </div>
        <p className="text-sm text-text-secondary">Awaiting data stream...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {articles.map((article, idx) => {
        const sentimentVariant = article.sentimentLabel?.toLowerCase() || 'neutral';
        
        return (
          <div 
            key={idx} 
            className="group relative bg-background border border-border hover:border-accent/30 rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-[0_4px_20px_rgba(22,224,189,0.05)] overflow-hidden"
          >
            {/* Hover Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="flex justify-between items-start gap-4">
              <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-0.5 rounded">
                {article.source || 'WIRE'}
              </span>
              <Badge variant={sentimentVariant} className="flex items-center gap-1 font-mono">
                {sentimentVariant === 'positive' && <TrendingUp className="w-3 h-3" />}
                {sentimentVariant === 'negative' && <TrendingDown className="w-3 h-3" />}
                {sentimentVariant === 'neutral' && <Minus className="w-3 h-3" />}
                {article.sentimentLabel} ({article.sentimentScore?.toFixed(2)})
              </Badge>
            </div>
            
            <h4 className="text-sm font-medium text-text-primary line-clamp-2 leading-relaxed group-hover:text-accent transition-colors">
              {article.title}
            </h4>
            
            <div className="flex justify-end pt-2 border-t border-border/50">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-mono font-semibold text-text-secondary group-hover:text-text-primary flex items-center gap-1 uppercase tracking-widest transition-colors"
              >
                Read <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

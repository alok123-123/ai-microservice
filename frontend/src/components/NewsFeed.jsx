import React from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function NewsFeed({ articles }) {
  if (!articles || articles.length === 0) {
    return <div className="text-slate-400">No recent articles found.</div>;
  }

  const getSentimentBadge = (label, score) => {
    if (label === 'Positive') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          Positive ({score?.toFixed(2)})
        </span>
      );
    }
    if (label === 'Negative') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <TrendingDown className="w-3 h-3" />
          Negative ({score?.toFixed(2)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <Minus className="w-3 h-3" />
        Neutral ({score?.toFixed(2)})
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, idx) => (
        <div key={idx} className="glass-panel p-5 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 duration-300">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{article.source}</span>
            {getSentimentBadge(article.sentimentLabel, article.sentimentScore)}
          </div>
          
          <h4 className="text-slate-200 font-semibold mb-4 flex-1 line-clamp-3">
            {article.title}
          </h4>
          
          <div className="mt-auto pt-4 border-t border-slate-700/50 flex justify-end">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Read article <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

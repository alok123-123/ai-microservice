import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SentimentBreakdown({ articles }) {
  if (!articles || articles.length === 0) {
    return <div className="h-full flex items-center justify-center text-text-secondary text-sm font-mono">No data available</div>;
  }

  // Count sentiments
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  articles.forEach(article => {
    const label = article.sentimentLabel || 'Neutral';
    if (label === 'Positive') positive++;
    else if (label === 'Negative') negative++;
    else neutral++;
  });

  const chartData = {
    labels: ['BULLISH', 'NEUTRAL', 'BEARISH'],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: [
          '#16E0BD', // Teal
          '#E8B923', // Warning yellow
          '#F23F43', // Red
        ],
        borderColor: [
          '#08111F', // Match background
          '#08111F',
          '#08111F',
        ],
        borderWidth: 4,
        hoverOffset: 6,
        hoverBorderColor: '#08111F',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(8, 17, 31, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "'JetBrains Mono', monospace",
          size: 11,
          weight: 'bold'
        },
        bodyFont: {
          family: "'JetBrains Mono', monospace",
          size: 12
        },
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = positive + neutral + negative;
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${value} srcs (${percentage}%)`;
          }
        }
      }
    },
    cutout: '75%', 
    borderRadius: 0, // Keep sharp or round edges depending on style
  };

  return (
    <div className="w-full h-full flex items-center">
      <div className="relative flex-1 h-full min-w-0">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold font-mono text-text-primary">{articles.length}</span>
          <span className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-widest mt-1 text-center">Total<br/>Srcs</span>
        </div>
      </div>

      <div className="w-24 shrink-0 flex flex-col gap-4 pl-4 ml-2 border-l border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartData.datasets[0].backgroundColor[0] }} />
          <span className="text-xs font-mono font-bold text-text-secondary uppercase">Bullish</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartData.datasets[0].backgroundColor[1] }} />
          <span className="text-xs font-mono font-bold text-text-secondary uppercase">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartData.datasets[0].backgroundColor[2] }} />
          <span className="text-xs font-mono font-bold text-text-secondary uppercase">Bearish</span>
        </div>
      </div>
    </div>
  );
}

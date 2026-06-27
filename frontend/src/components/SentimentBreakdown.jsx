import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SentimentBreakdown({ articles }) {
  if (!articles || articles.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">No sentiment breakdown available</div>;
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
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)', // Emerald-400
          'rgba(148, 163, 184, 0.8)', // Slate-400
          'rgba(251, 113, 133, 0.8)', // Rose-400
        ],
        borderColor: [
          'rgba(52, 211, 153, 1)',
          'rgba(148, 163, 184, 1)',
          'rgba(251, 113, 133, 1)',
        ],
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(226, 232, 240, 0.9)',
          boxWidth: 12,
          font: {
            family: 'Inter',
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(51, 65, 85, 1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = positive + neutral + negative;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%', // Thin ring look
  };

  return <Doughnut data={chartData} options={options} />;
}

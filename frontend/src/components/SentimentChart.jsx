import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SentimentChart({ data, comparisonData, primaryTicker, comparisonTicker }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">No chart data available</div>;
  }

  // Get union of all dates, sorted chronologically
  const allDates = Array.from(new Set([
    ...data.map(d => new Date(d.date).toLocaleDateString()),
    ...(comparisonData || []).map(d => new Date(d.date).toLocaleDateString())
  ])).sort((a, b) => new Date(a) - new Date(b));

  // Align data points to union of dates
  const primaryPoints = allDates.map(dateStr => {
    const record = data.find(d => new Date(d.date).toLocaleDateString() === dateStr);
    return record ? record.averageScore : null;
  });

  const datasets = [
    {
      label: primaryTicker || 'Average Sentiment Score',
      data: primaryPoints,
      borderColor: 'rgba(6, 182, 212, 1)', // Cyan-500
      backgroundColor: 'rgba(6, 182, 212, 0.05)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(6, 182, 212, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(6, 182, 212, 1)',
      fill: !comparisonData, // Only fill area if not comparing
      tension: 0.4,
      spanGaps: true // link points even if there's a missing day
    }
  ];

  if (comparisonData && comparisonData.length > 0 && comparisonTicker) {
    const comparisonPoints = allDates.map(dateStr => {
      const record = comparisonData.find(d => new Date(d.date).toLocaleDateString() === dateStr);
      return record ? record.averageScore : null;
    });

    datasets.push({
      label: comparisonTicker,
      data: comparisonPoints,
      borderColor: 'rgba(139, 92, 246, 1)', // Violet-500
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(139, 92, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(139, 92, 246, 1)',
      fill: false,
      tension: 0.4,
      spanGaps: true
    });
  }

  const chartData = {
    labels: allDates,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.8)',
          callback: function(value) {
            if (value === 1) return 'Positive (+1)';
            if (value === 0) return 'Neutral (0)';
            if (value === -1) return 'Negative (-1)';
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(148, 163, 184, 0.8)',
        }
      }
    },
    plugins: {
      legend: {
        display: !!comparisonData, // Show legend only in comparison mode
        position: 'top',
        labels: {
          color: 'rgba(226, 232, 240, 0.9)',
          boxWidth: 15,
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
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(4)}`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return <Line data={chartData} options={options} />;
}

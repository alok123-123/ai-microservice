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

export default function SentimentChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500">No chart data available</div>;
  }

  // Sort data chronologically for the chart
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  const chartData = {
    labels: sortedData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Average Sentiment Score',
        data: sortedData.map(d => d.averageScore),
        borderColor: 'rgba(6, 182, 212, 1)', // cyan-500
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(6, 182, 212, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(6, 182, 212, 1)',
        fill: true,
        tension: 0.4, // smooth curves
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)', // slate-400 with opacity
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
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900
        titleColor: '#fff',
        bodyColor: '#cbd5e1', // slate-300
        borderColor: 'rgba(51, 65, 85, 1)', // slate-700
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Score: ${context.parsed.y.toFixed(2)}`;
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

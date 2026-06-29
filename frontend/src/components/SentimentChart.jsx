import React, { useRef, useEffect, useState } from 'react';
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
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState({
    datasets: [],
  });

  useEffect(() => {
    if (!data || data.length === 0) return;

    const chart = chartRef.current;
    if (!chart) return;

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

    const ctx = chart.ctx;
    const primaryGradient = ctx.createLinearGradient(0, 0, 0, 300);
    primaryGradient.addColorStop(0, 'rgba(22, 224, 189, 0.4)'); // Teal accent
    primaryGradient.addColorStop(1, 'rgba(22, 224, 189, 0.0)');

    const datasets = [
      {
        label: primaryTicker || 'Average Sentiment Score',
        data: primaryPoints,
        borderColor: '#16E0BD', // Teal
        backgroundColor: primaryGradient,
        borderWidth: 2,
        pointBackgroundColor: '#08111F', // Deep navy
        pointBorderColor: '#16E0BD',
        pointHoverBackgroundColor: '#16E0BD',
        pointHoverBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: !comparisonData, 
        tension: 0.4,
        spanGaps: true
      }
    ];

    if (comparisonData && comparisonData.length > 0 && comparisonTicker) {
      const comparisonPoints = allDates.map(dateStr => {
        const record = comparisonData.find(d => new Date(d.date).toLocaleDateString() === dateStr);
        return record ? record.averageScore : null;
      });

      const comparisonGradient = ctx.createLinearGradient(0, 0, 0, 300);
      comparisonGradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)'); // Violet
      comparisonGradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

      datasets.push({
        label: comparisonTicker,
        data: comparisonPoints,
        borderColor: '#8B5CF6',
        backgroundColor: comparisonGradient,
        borderWidth: 2,
        pointBackgroundColor: '#08111F',
        pointBorderColor: '#8B5CF6',
        pointHoverBackgroundColor: '#8B5CF6',
        pointHoverBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        spanGaps: true
      });
    }

    setChartData({
      labels: allDates,
      datasets: datasets,
    });
  }, [data, comparisonData, primaryTicker, comparisonTicker]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary text-sm font-mono">
        No chart data available
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 10
          },
          callback: function(value) {
            if (value === 1) return 'BULL (+1)';
            if (value === 0) return 'NEUT (0)';
            if (value === -1) return 'BEAR (-1)';
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
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 10
          }
        }
      }
    },
    plugins: {
      legend: {
        display: !!comparisonData,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          boxWidth: 12,
          usePointStyle: true,
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(8, 17, 31, 0.95)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: '600'
        },
        bodyFont: {
          family: "'JetBrains Mono', monospace",
          size: 12
        },
        displayColors: true,
        boxPadding: 4,
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

  return <Line ref={chartRef} data={chartData} options={options} />;
}

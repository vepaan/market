"use client"

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TooltipItem
} from 'chart.js';

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

export default function PortfolioChart() {
    // Dummy data for a portfolio chart
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
            {
                label: 'Portfolio Value (USD)',
                data: [1000, 1100, 1050, 1200, 1350, 1250, 1755],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                titleColor: '#000',
                bodyColor: '#000',
                borderColor: '#000',
                borderWidth: 1,
                callbacks: {
                    label: function (tooltipItem: TooltipItem<"line">) {
                        return `Value: $${(tooltipItem.raw as number).toFixed(2)}`;
                    },
                },
            },
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: "#9ca3af",
                    maxTicksLimit: 7
                },
            },
            y: {
                display: true,
                grid: {
                    color: "rgba(100, 100, 100, 0.2)",
                    drawBorder: false,
                },
                ticks: {
                    color: "#9ca3af",
                },
            },
        },
    };

    return <Line data={data} options={options} />;
}
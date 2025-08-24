// app/components/portfoliodiversity.tsx
"use client"

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioDiversityProps {
    positions: { ticker: string; shares: number; price: number }[];
}

export default function PortfolioDiversity({ positions }: PortfolioDiversityProps) {
    // Dummy prices for calculation, replace with actual fetching logic
    const dummyPrices: { [key: string]: number } = {
        'AAPL': 175.00,
        'MSFT': 350.00,
        'GOOG': 2600.00,
    };

    const holdings = positions.map(pos => ({
        ...pos,
        value: pos.shares * (dummyPrices[pos.ticker] || 0)
    }));

    const totalPortfolioValue = holdings.reduce((sum, pos) => sum + pos.value, 0);

    const data = {
        labels: holdings.map(pos => pos.ticker),
        datasets: [
            {
                label: 'Portfolio Allocation',
                data: holdings.map(pos => (pos.value / totalPortfolioValue) * 100),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.7)', // Green for AAPL
                    'rgba(66, 165, 245, 0.7)', // Blue for MSFT
                    'rgba(239, 68, 68, 0.7)',  // Red for GOOG
                ],
                borderColor: [
                    '#10b981',
                    '#42a5f5',
                    '#ef4444',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // This creates the donut chart effect
        plugins: {
            legend: {
                display: false, // Hide the default legend
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ${value.toFixed(2)}%`;
                    }
                }
            }
        },
    };

    return (
        <div className="bg-zinc-800 rounded-lg p-5 flex flex-col h-full">
            <h3 className='text-xl font-bold mb-3'>Portfolio Diversity</h3>
            {totalPortfolioValue > 0 ? (
                <>
                    <div className="flex-grow flex items-center justify-center mb-5">
                        <div className="w-48 h-48">
                            <Pie data={data} options={options} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        {holdings.map((pos, index) => (
                            <div key={pos.ticker} className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: data.datasets[0].backgroundColor[index] as string }}></div>
                                <span className="text-gray-300 font-semibold">{pos.ticker}</span>
                                <span className="ml-auto text-white font-bold">
                                    {((pos.value / totalPortfolioValue) * 100).toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-gray-400 text-center">No positions to display.</p>
            )}
        </div>
    );
}
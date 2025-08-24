// app/components/positionstab.tsx
"use client"

import React from 'react';
import LineChart from './chart';

interface Position {
    ticker: string;
    shares: number;
    chartData: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        fill: boolean;
      }[];
    };
}

interface PositionsTabProps {
    onTickerClick: (ticker: string) => void;
}

export default function PositionsTab({ onTickerClick }: PositionsTabProps) {
    const positions: Position[] = [
        { ticker: 'AAPL', shares: 10, chartData: { labels: ['1', '2', '3', '4', '5'], datasets: [{ label: 'AAPL', data: [160, 165, 162, 170, 175], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.5)', fill: true }] } },
        { ticker: 'MSFT', shares: 5, chartData: { labels: ['1', '2', '3', '4', '5'], datasets: [{ label: 'MSFT', data: [280, 285, 283, 290, 295], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.5)', fill: true }] } },
        { ticker: 'GOOG', shares: 8, chartData: { labels: ['1', '2', '3', '4', '5'], datasets: [{ label: 'GOOG', data: [2500, 2550, 2520, 2600, 2650], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.5)', fill: true }] } },
    ];

    return (
        <div className="flex flex-col gap-4">
            {positions.map((pos, index) => (
                <div
                    key={index}
                    onClick={() => onTickerClick(pos.ticker)}
                    className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-600 transition duration-300"
                >
                    <div>
                        <h4 className="text-white font-bold">{pos.ticker}</h4>
                        <p className="text-sm text-gray-400">{pos.shares} Shares</p>
                    </div>
                    <div className="w-20 h-10">
                        <LineChart chartData={pos.chartData} />
                    </div>
                </div>
            ))}
        </div>
    );
}
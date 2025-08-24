"use client"

import React from 'react';

interface Position {
    ticker: string;
    shares: number;
    chartData: number[];
}

interface PositionsTabProps {
    onTickerClick: (ticker: string) => void;
}

export default function PositionsTab({ onTickerClick }: PositionsTabProps) {
    const positions: Position[] = [
        { ticker: 'AAPL', shares: 10, chartData: [160, 165, 162, 170, 175] },
        { ticker: 'MSFT', shares: 5, chartData: [280, 285, 283, 290, 295] },
        { ticker: 'GOOG', shares: 8, chartData: [2500, 2550, 2520, 2600, 2650] },
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
                    {/* Placeholder for small chart thumbnail */}
                    <div className="w-20 h-10 bg-zinc-800 rounded-md">
                        {/* A real chart component would go here */}
                    </div>
                </div>
            ))}
        </div>
    );
}
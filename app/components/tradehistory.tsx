"use client"

import React from 'react';

interface Trade {
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    date: string;
}

interface TradeHistoryProps {
    trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
    return (
        <div className="flex flex-col mt-5">
            <h4 className="text-xl font-bold mb-3">Trade History</h4>
            <div className="flex-grow overflow-y-auto max-h-40 pr-3 custom-scrollbar">
                {trades.length > 0 ? (
                    <ul className="space-y-3">
                        {trades.map((trade, index) => (
                            <li key={index} className="flex items-center text-sm">
                                <span className={`font-semibold mr-2 ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                    {trade.type.toUpperCase()}
                                </span>
                                <span className="text-gray-400">
                                    {trade.shares} shares at ${trade.price.toFixed(2)} on {trade.date}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">No trade history available.</p>
                )}
            </div>
        </div>
    );
}
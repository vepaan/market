"use client";

import React from 'react';

interface PortfolioMetricsProps {
    totalEquity: number;
    buyingPower: number;
    totalPnL: number;
}

export default function PortfolioMetrics({ totalEquity, buyingPower, totalPnL }: PortfolioMetricsProps) {
  const isPositive = totalPnL >= 0;
  const pnlColor = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div className='flex flex-col gap-5 h-full'>
      <div className='grid grid-cols-2 gap-5'>
        <div className='bg-zinc-800 rounded-lg p-5'>
          <h3 className='text-xl font-bold mb-3'>Total Equity</h3>
          <p className="text-3xl font-bold text-white">${totalEquity.toFixed(2)}</p>
        </div>
        <div className='bg-zinc-800 rounded-lg p-5'>
          <h3 className='text-xl font-bold mb-3'>Buying Power</h3>
          <p className="text-3xl font-bold text-white">${buyingPower.toFixed(2)}</p>
        </div>
      </div>
      <div className='bg-zinc-800 rounded-lg p-5'>
        <h3 className='text-xl font-bold mb-3'>Total P&L</h3>
        <p className={`text-3xl font-bold ${pnlColor}`}>${totalPnL.toFixed(2)}</p>
      </div>
    </div>
  );
}
"use client"

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const bridgeSocketUrl = process.env.NEXT_PUBLIC_BRIDGE_URL;
if (!bridgeSocketUrl) {
  console.warn("NEXT_PUBLIC_BRIDGE_URL is not set; falling back to current origin.");
}
const socket = io(bridgeSocketUrl ?? "");

interface BidAskTableProps {
  ticker: string | null;
  price: number | null;
}

interface PriceLevel {
  price: number;
  volume: number;
}

export default function BidAskTable({ ticker, price }: BidAskTableProps) {
  // We use objects (dictionaries) to easily update/delete specific price levels
  const [bids, setBids] = useState<Record<number, number>>({});
  const [asks, setAsks] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!ticker) return;

    // Reset state on ticker change
    setBids({});
    setAsks({});

    // 1. Ask the Node.js Bridge for the current Snapshot
    socket.emit("get_snapshot", ticker);

    // 2. Handle the incoming Snapshot
    const handleSnapshot = (data: { ticker: string, bids: PriceLevel[], asks: PriceLevel[] }) => {
      if (data.ticker !== ticker) return;
      
      const newBids: Record<number, number> = {};
      const newAsks: Record<number, number> = {};
      
      data.bids.forEach(b => newBids[b.price] = b.volume);
      data.asks.forEach(a => newAsks[a.price] = a.volume);
      
      setBids(newBids);
      setAsks(newAsks);
    };

    // 3. Handle live tape updates
    const handleUpdate = (data: any) => {
      if (data.ticker !== ticker) return;

      if (data.bid !== null) {
        setBids(prev => {
          const copy = { ...prev };
          if (data.bid_size === 0) delete copy[data.bid]; // Level completely eaten
          else copy[data.bid] = data.bid_size; // Level updated or added
          return copy;
        });
      }
      
      if (data.ask !== null) {
        setAsks(prev => {
          const copy = { ...prev };
          if (data.ask_size === 0) delete copy[data.ask]; // Level completely eaten
          else copy[data.ask] = data.ask_size; // Level updated or added
          return copy;
        });
      }
    };

    socket.on("snapshot", handleSnapshot);
    socket.on("market_update", handleUpdate);

    return () => {
      socket.off("snapshot", handleSnapshot);
      socket.off("market_update", handleUpdate);
    };
  }, [ticker]);

  if (!ticker) {
    return <div className="text-gray-400 p-4">Select a ticker to see market data.</div>;
  }

  // Convert states to sorted arrays (Best Bid = Highest Price, Best Ask = Lowest Price)
  const sortedBids = Object.entries(bids)
    .map(([p, v]) => ({ price: Number(p), volume: v }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 10); // Show Top 10 Bids

  const sortedAsks = Object.entries(asks)
    .map(([p, v]) => ({ price: Number(p), volume: v }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 10); // Show Top 10 Asks

  // Pad arrays so the table always has matching row lengths
  const maxRows = Math.max(sortedBids.length, sortedAsks.length, 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-zinc-800">
          <tr>
            <th className="py-2 px-4 text-left font-bold text-gray-300 border-r border-zinc-700">Bid Size</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300 border-r border-zinc-700">Bid Price</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300 border-r border-zinc-700">Ask Price</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Ask Size</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, index) => {
            const bid = sortedBids[index];
            const ask = sortedAsks[index];

            return (
              <tr key={index} className="hover:bg-zinc-700 transition duration-200 border-b border-zinc-800">
                <td className="py-2 px-4 text-gray-400 border-r border-zinc-700">{bid ? bid.volume : '—'}</td>
                <td className="py-2 px-4 text-green-500 font-bold border-r border-zinc-700">{bid ? `$${bid.price.toFixed(2)}` : '—'}</td>
                <td className="py-2 px-4 text-red-500 font-bold border-r border-zinc-700">{ask ? `$${ask.price.toFixed(2)}` : '—'}</td>
                <td className="py-2 px-4 text-gray-400">{ask ? ask.volume : '—'}</td>
              </tr>
            );
          })}
          {maxRows === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-400 italic">
                Order Book Empty
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
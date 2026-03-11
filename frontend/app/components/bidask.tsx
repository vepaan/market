"use client"

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const bridgeSocketUrl = process.env.NEXT_PUBLIC_BRIDGE_URL;
if (!bridgeSocketUrl) {
  console.warn("NEXT_PUBLIC_BRIDGE_URL is not set; falling back to current origin.");
}
const socket = io(bridgeSocketUrl ?? "");

interface BidAskData {
  bid_size: number;
  bid: number;
  ask: number;
  ask_size: number;
}

interface BidAskTableProps {
  ticker: string | null;
  price: number | null;
}

export default function BidAskTable({ ticker, price }: BidAskTableProps) {
  const [bidAskData, setBidAskData] = useState<BidAskData[]>([]);

  useEffect(() => {
    if (!ticker) return;

    setBidAskData([]); //reset

    // Listen for real-time updates from the C++ Backend
    socket.on("market_update", (data) => {
      // Only update if the ticker matches what the user selected
      if (data.ticker === ticker) {
        setBidAskData((prevData) => {
          // Keep the 10 most recent updates
          const updatedList = [data, ...prevData];
          return updatedList.slice(0, 10);
        });
      }
    });

    return () => {
      socket.off("market_update");
    };
  }, [ticker]);

  if (!ticker) {
    return <div className="text-gray-400 p-4">Select a ticker to see market data.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-zinc-800">
          <tr>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Bid Size</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Bid</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Ask</th>
            <th className="py-2 px-4 text-left font-bold text-gray-300">Ask Size</th>
          </tr>
        </thead>
        <tbody>
          {bidAskData.length > 0 ? (
            bidAskData.map((data, index) => (
              <tr key={index} className="hover:bg-zinc-700 transition duration-200 border-b border-zinc-800">
                <td className="py-2 px-4 text-gray-400">{data.bid_size}</td>
                <td className="py-2 px-4 text-green-500 font-bold">{data.bid != null ? `$${data.bid.toFixed(2)}` : '—'}</td>
                <td className="py-2 px-4 text-red-500 font-bold">{data.ask != null ? `$${data.ask.toFixed(2)}` : '—'}</td>
                <td className="py-2 px-4 text-gray-400">{data.ask_size}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-400 italic">
                Waiting for C++ Market Data...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
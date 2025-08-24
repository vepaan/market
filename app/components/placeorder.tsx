"use client"

import React, { useState } from "react";

interface PlaceOrderProps {
  currentPrice: number | null;
}

export default function PlaceOrder({ currentPrice }: PlaceOrderProps) {
  const [quantity, setQuantity] = useState(0);
  const [dollarAmount, setDollarAmount] = useState(0);
  const [orderType, setOrderType] = useState("market");
  const [orderMethod, setOrderMethod] = useState("shares"); // "shares" or "dollars"

  const handleOrder = (type: 'buy' | 'sell') => {
    let shares = quantity;
    if (orderMethod === "dollars" && currentPrice && currentPrice > 0) {
      shares = dollarAmount / currentPrice;
    }
    console.log(`Placing ${type} order for ${shares.toFixed(4)} shares at ${orderType} price.`);
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setQuantity(value);
    if (currentPrice && currentPrice > 0) {
      setDollarAmount(value * currentPrice);
    }
  };

  const handleDollarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setDollarAmount(value);
    if (currentPrice && currentPrice > 0) {
      setQuantity(value / currentPrice);
    }
  };

  const isQuantityActive = orderMethod === "shares";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-around bg-zinc-800 rounded-lg p-1 mb-2">
        <button
          onClick={() => setOrderMethod("shares")}
          className={`flex-1 py-1 rounded-md text-sm font-semibold transition duration-300 ${isQuantityActive ? 'bg-zinc-700 text-white' : 'text-gray-500'}`}
        >
          Shares
        </button>
        <button
          onClick={() => setOrderMethod("dollars")}
          className={`flex-1 py-1 rounded-md text-sm font-semibold transition duration-300 ${!isQuantityActive ? 'bg-zinc-700 text-white' : 'text-gray-500'}`}
        >
          Dollars
        </button>
      </div>
      <div className="flex flex-col">
        <label className="text-gray-400 text-sm mb-1">{isQuantityActive ? "Quantity" : "Amount in $"}</label>
        {isQuantityActive ? (
          <input
            type="number"
            value={quantity}
            onChange={handleQuantityChange}
            className="px-3 py-2 text-white bg-zinc-900 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <input
            type="number"
            value={dollarAmount}
            onChange={handleDollarChange}
            className="px-3 py-2 text-white bg-zinc-900 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
      </div>
      <div className="flex flex-col">
        <label className="text-gray-400 text-sm mb-1">Order Type</label>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="px-3 py-2 text-white bg-zinc-900 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="market">Market</option>
          <option value="limit">Limit</option>
        </select>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handleOrder("buy")}
          className="flex-1 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-600 transition duration-300"
        >
          Buy
        </button>
        <button
          onClick={() => handleOrder("sell")}
          className="flex-1 py-2 bg-red-500 text-black font-bold rounded-lg hover:bg-red-600 transition duration-300"
        >
          Sell
        </button>
      </div>
    </div>
  );
}
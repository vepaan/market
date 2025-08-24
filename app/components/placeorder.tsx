"use client"

import React, { useState } from "react";

export default function PlaceOrder() {
  const [quantity, setQuantity] = useState(0);
  const [orderType, setOrderType] = useState("market");

  const handleOrder = (type: 'buy' | 'sell') => {
    console.log(`Placing ${type} order for ${quantity} shares at ${orderType} price.`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label className="text-gray-400 text-sm mb-1">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="px-3 py-2 text-white bg-zinc-900 rounded-md outline-none focus:ring-2 focus:ring-emerald-500"
        />
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
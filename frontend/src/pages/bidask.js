import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../bidask.css'; // Import custom styles

function BidAskTable({ ticker }) {
  const [orders, setOrders] = useState([]); // Stores unique orders
  const [orderIds, setOrderIds] = useState(new Set()); // Tracks unique order IDs
  const MAX_ORDERS = 10; // Maximum number of orders to display

  useEffect(() => {
    // Cleanup orders and orderIds whenever ticker changes
    setOrders([]);
    setOrderIds(new Set());

    const fetchBidAskData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/bid-ask', {
          params: { symbol: ticker },
        });

        const newOrder = {
          orderId: `${ticker}-${Date.now()}`, // Using ticker and timestamp to generate unique orderId
          bid: response.data.bid,
          ask: response.data.ask,
          bid_size: response.data.bid_size,
          ask_size: response.data.ask_size,
        };

        if (!orderIds.has(newOrder.orderId)) {
          setOrders((prevOrders) => {
            const updatedOrders = [...prevOrders, newOrder];
            if (updatedOrders.length > MAX_ORDERS) {
              updatedOrders.shift(); // Remove the first (oldest) entry
            }
            return updatedOrders;
          });

          setOrderIds((prevIds) => {
            const updatedIds = new Set(prevIds).add(newOrder.orderId);
            if (updatedIds.size > MAX_ORDERS) {
              updatedIds.delete([...updatedIds][0]); // Remove the first (oldest) ID
            }
            return updatedIds;
          });
        }
      } catch (error) {
        console.error('Error fetching bid/ask data:', error);

        // Generate random fallback data if there is an error
        const randomBid = (Math.random() * (100 - 90) + 90).toFixed(2);
        const randomAsk = (Math.random() * (110 - 100) + 100).toFixed(2);
        const randomOrderId = `fallback-${Math.random().toString(36).substr(2, 9)}`;
        const randomOrder = {
          orderId: randomOrderId,
          bid: randomBid,
          ask: randomAsk,
          bid_size: Math.floor(Math.random() * 100),
          ask_size: Math.floor(Math.random() * 100),
        };

        if (!orderIds.has(randomOrder.orderId)) {
          setOrders((prevOrders) => [...prevOrders, randomOrder]);
          setOrderIds((prevIds) => new Set(prevIds).add(randomOrder.orderId));
        }
      }
    };

    // Fetch data every second
    const intervalId = setInterval(() => {
      if (ticker) {
        fetchBidAskData();
      }
    }, 2000);

    // Cleanup interval on component unmount or ticker change
    return () => {
      clearInterval(intervalId);
    };
  }, [ticker]); // Only trigger when `ticker` changes

  return (
    <div className="bid-ask">
      {orders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Qty</th>
              <th>Bid</th>
              <th>Ask</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderId}>
                <td>{order.bid_size || 'N/A'}</td>
                <td className="green-text">{order.bid || 'N/A'}</td>
                <td className="red-text">{order.ask || 'N/A'}</td>
                <td>{order.ask_size || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading bid/ask data...</p>
      )}
    </div>
  );
}

export default BidAskTable;

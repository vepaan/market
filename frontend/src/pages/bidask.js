import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../bidask.css'; // Import custom styles

function BidAskTable({ ticker, price }) {
  const [orders, setOrders] = useState([]); // Store previous orders
  const [orderIds, setOrderIds] = useState(new Set()); // Ensure uniqueness of orders
  const MAX_ORDERS = 10;
  
  // Track the previous ticker to check for changes
  const prevTickerRef = useRef();

  // Check if ticker has changed
  useEffect(() => {
    if (prevTickerRef.current !== ticker) {
      // Clear orders and orderIds when the ticker changes
      setOrders([]);
      setOrderIds(new Set());
    }
    prevTickerRef.current = ticker; // Update the previous ticker value

  }, [ticker]); // This will run when the ticker changes

  useEffect(() => {
    const fetchBidAskData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/bid-ask', {
          params: { symbol: ticker, price }, // Pass price to the backend
        });

        const newOrder = {
          orderId: `${ticker}-${Date.now()}`, // Unique ID for each order
          bid: response.data.bid,
          ask: response.data.ask,
          bid_size: response.data.bid_size,
          ask_size: response.data.ask_size,
        };

        // Only add new orders that are not already in the orderIds set
        if (!orderIds.has(newOrder.orderId)) {
          setOrders((prevOrders) => {
            const updatedOrders = [...prevOrders, newOrder];
            if (updatedOrders.length > MAX_ORDERS) {
              updatedOrders.shift(); // Remove the oldest entry if over the max limit
            }
            return updatedOrders;
          });

          setOrderIds((prevIds) => {
            const updatedIds = new Set(prevIds).add(newOrder.orderId);
            if (updatedIds.size > MAX_ORDERS) {
              updatedIds.delete([...updatedIds][0]); // Remove the oldest order ID if over the max limit
            }
            return updatedIds;
          });
        }
      } catch (error) {
        console.error('Error fetching bid/ask data:', error);
      }
    };

    const intervalId = setInterval(() => {
      if (ticker && price) {
        fetchBidAskData();
      }
    }, 2000);

    return () => {
      clearInterval(intervalId); // Cleanup interval when component unmounts
    };
  }, [ticker, price]); // Only re-run effect when ticker or price changes

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

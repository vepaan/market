import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../bidask.css'; // Import custom styles

function BidAskTable({ ticker, price }) {
  const [orders, setOrders] = useState([]);
  const [orderIds, setOrderIds] = useState(new Set());
  const MAX_ORDERS = 10;

  useEffect(() => {
    setOrders([]);
    setOrderIds(new Set());

    const fetchBidAskData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/bid-ask', {
          params: { symbol: ticker, price }, // Pass price to the backend
        });

        const newOrder = {
          orderId: `${ticker}-${Date.now()}`,
          bid: response.data.bid,
          ask: response.data.ask,
          bid_size: response.data.bid_size,
          ask_size: response.data.ask_size,
        };

        if (!orderIds.has(newOrder.orderId)) {
          setOrders((prevOrders) => {
            const updatedOrders = [...prevOrders, newOrder];
            if (updatedOrders.length > MAX_ORDERS) {
              updatedOrders.shift();
            }
            return updatedOrders;
          });

          setOrderIds((prevIds) => {
            const updatedIds = new Set(prevIds).add(newOrder.orderId);
            if (updatedIds.size > MAX_ORDERS) {
              updatedIds.delete([...updatedIds][0]);
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
      clearInterval(intervalId);
    };
  }, [ticker, price]);

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

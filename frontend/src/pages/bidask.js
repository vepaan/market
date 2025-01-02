import React, { useEffect, useState } from 'react';
import axios from 'axios';

function BidAskTable({ ticker }) {
  const [bidAskData, setBidAskData] = useState(null);

  useEffect(() => {
    const fetchBidAskData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/bid-ask', {
          params: { symbol: ticker },
        });
        setBidAskData(response.data);
      } catch (error) {
        console.error('Error fetching bid/ask data:', error);
  
        // Generate random fallback data
        const randomBid = (Math.random() * (100 - 90) + 90).toFixed(2);
        const randomAsk = (Math.random() * (110 - 100) + 100).toFixed(2);
        setBidAskData({
          bid: randomBid,
          ask: randomAsk,
        });
      }
    };
  
    // Set an interval to fetch data every second
    const intervalId = setInterval(() => {
      if (ticker) {
        fetchBidAskData();
      }
    }, 1000);
  
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [ticker]);
  

  return (
    <div className="bid-ask">
      {bidAskData ? (
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
            <tr>   
              <td>{bidAskData.bid_size || 'N/A'}</td>
              <td>{bidAskData.bid || 'N/A'}</td>
              <td>{bidAskData.ask || 'N/A'}</td>
              <td>{bidAskData.ask_size || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>Loading bid/ask data...</p>
      )}
    </div>
  );
}

export default BidAskTable;

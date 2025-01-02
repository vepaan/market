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
        setBidAskData(null);
      }
    };

    if (ticker) {
      fetchBidAskData();
    }
  }, [ticker]); // Fetch data whenever the ticker changes

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

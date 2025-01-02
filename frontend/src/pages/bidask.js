import React, { useEffect, useState } from 'react';

const BidAskTable = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Simulated data fetching
    const interval = setInterval(() => {
      const simulatedData = Array.from({ length: 10 }, () => ({
        bidQty: Math.floor(Math.random() * 100),
        bidPrice: (Math.random() * 100).toFixed(2),
        askPrice: (Math.random() * 100).toFixed(2),
        askQty: Math.floor(Math.random() * 100),
      }));
      setData(simulatedData);
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <div className="bid-ask">
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
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.bidQty}</td>
              <td>{row.bidPrice}</td>
              <td>{row.askPrice}</td>
              <td>{row.askQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BidAskTable;

import React, { useState } from 'react';

function Dashboard() {
  const [ticker, setTicker] = useState('AAPL');
  const [currentPrice, setCurrentPrice] = useState(175.50);
  const [percentChange, setPercentChange] = useState(1.25);
  const [position, setPosition] = useState({ shares: 10, averageCost: 160.00 });

  // Placeholder functions for fetching data from the backend
  const fetchStockData = (stock) => {
    // Assume this fetches data from a backend endpoint
    console.log(`Fetching data for ${stock}...`);
    // Example: fetch(`/api/stock/${stock}`).then(...)
    // Update state with new data
    setTicker(stock.toUpperCase());
    setCurrentPrice(Math.random() * 100 + 100); // Dummy data
    setPercentChange(Math.random() * 5 - 2.5); // Dummy data
  };

  const fetchPositionData = () => {
    // Assume this fetches user position data
    console.log('Fetching user position data...');
    // Example: fetch('/api/user/positions').then(...)
    // Update state with new position
    setPosition({ shares: 10, averageCost: 160.00 }); // Dummy data
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newTicker = e.target.elements.tickerInput.value;
    if (newTicker) {
      fetchStockData(newTicker);
    }
  };

  return (
    <div className='dashboard'>
      <div className='main-content'>
        <div className='stock-header'>
          <form onSubmit={handleSearch}>
            <input name="tickerInput" placeholder="Search for stocks..." className="search-bar" />
            <button type="submit" className="ticker-submit">Search</button>
          </form>
          <h2>{ticker}</h2>
          <div className='price-info'>
            <span className='current-price'>${currentPrice.toFixed(2)}</span>
            <span className='percent-change' style={{ color: percentChange >= 0 ? 'green' : 'red' }}>
              ({percentChange.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className='chart-section'>
          {/* Placeholder for chart component */}
          <div className='chart-placeholder'>
            <h3>Chart Placeholder</h3>
            <p>A chart would be rendered here, fetching data from an endpoint like `/api/chart/${ticker}`.</p>
          </div>
        </div>
        
        <div className='user-position-section'>
          <h3>Your Position</h3>
          <p>Shares: {position.shares}</p>
          <p>Average Cost: ${position.averageCost.toFixed(2)}</p>
          <p>Total Value: ${(position.shares * currentPrice).toFixed(2)}</p>
          <p>Today's Return: ${((currentPrice - position.averageCost) * position.shares).toFixed(2)}</p>
        </div>

      </div>

      <div className='sidebar'>
        {/* Placeholder for order form section */}
        <div className='order-section'>
          <h3>Place an Order</h3>
          <div className='order-form'>
            <form>
              <label>
                Quantity:
                <input type="number" name="quantity" min="1" />
              </label>
              <label>
                Order Type:
                <select name="orderType">
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </label>
              <button type="submit">Buy/Sell</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
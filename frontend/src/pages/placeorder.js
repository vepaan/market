import React, {useEffect, useState, useRef} from "react";
import '../placeorder.css';

function PlaceOrder() {
  return (
    <div className="order-form">
        <form className="order-form">
          <div>
            <input type="number" className='qty-box' id="quantity" name="quantity" placeholder="Enter quantity..." />
            <input type="number" className='price-box' id="price" name="price" placeholder="Enter price..." />
          </div>  
          <div>
            <button type="submit">Buy</button>
            <button type="submit">Sell</button>
            <button type="submit">Short Sell</button>
          </div>
          <div>
            <label for="orderType">Order Type:</label>
            <select id="orderType" name="orderType">
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
              <option value="stop-limit">Stop Limit</option>
            </select>
          </div>
        </form>
    </div>
  );
}

export default PlaceOrder
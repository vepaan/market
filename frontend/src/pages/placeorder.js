import React from "react";
import "../placeorder.css";

function PlaceOrder() {
  return (
    <div className="order-form">
      <form className="order-form-space">
        <div className="form-row">
          <input type="number" className="qty-box" id="quantity" name="quantity" placeholder="Enter quantity..."/>
          <input type="number" className="price-box" id="price" name="price" placeholder="Enter price..."/>
        </div>

        <div className="form-row">
          <button type="submit" className="btn btn-buy">
            Buy
          </button>
          <button type="submit" className="btn btn-sell">
            Sell
          </button>
          <button type="submit" className="btn btn-short-sell">
            Short Sell
          </button>
        </div>

        <div className="form-row">
          <label htmlFor="orderType" className="order-type-label">
            Order Type:
          </label>
          <select id="orderType" name="orderType" className="order-type-dropdown">
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

export default PlaceOrder;

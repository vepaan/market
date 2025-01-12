import React, { useState } from "react";
import "../placeorder.css";

function PlaceOrder() {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [duration, setDuration] = useState("day");

  const handleSubmit = (e, action) => {
    e.preventDefault();
    const orderDetails = {
      quantity,
      price,
      orderType,
      duration,
      action,
    };
    console.log(orderDetails);  // Here you can handle the form submission
  };

  return (
    <div className="order-form">
      <form className="order-form-space">
        <div className="form-row">
          <input
            type="number"
            className="qty-box"
            id="quantity"
            name="quantity"
            placeholder="Enter quantity..."
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <input
            type="number"
            className="price-box"
            id="price"
            name="price"
            placeholder="Enter price..."
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="orderType" className="order-type-label">
            Order Type:
          </label>
          <select
            id="orderType"
            name="orderType"
            className="order-type-dropdown-1"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
          >
            <option value="market">Market (MKT)</option>
            <option value="limit">Limit (LMT)</option>
          </select>
          <select
            id="duration"
            name="duration"
            className="order-type-dropdown-2"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="day">Day</option>
            <option value="GTC">Good Til Canceled</option>
            <option value="IOC">Immediate Or Cancel</option>
            <option value="FOK">Fill Or Kill</option>
          </select>
        </div>

        <div className="form-row">
          <button
            type="submit"
            className="button"
            onClick={(e) => handleSubmit(e, "buy")}
          >
            Buy
          </button>
          <button
            type="submit"
            className="button"
            onClick={(e) => handleSubmit(e, "sell")}
          >
            Sell
          </button>
          <button
            type="submit"
            className="button"
            onClick={(e) => handleSubmit(e, "shortSell")}
          >
            Short Sell
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlaceOrder;

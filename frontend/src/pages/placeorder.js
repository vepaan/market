import React, { useState } from "react";
import "../placeorder.css";

function PlaceOrder() {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [duration, setDuration] = useState("day");
  const [stoploss, setStopLoss] = useState(0);
  const [leverage, setLevergae] = useState(1);

  const handleSubmit = (e, action) => {
    e.preventDefault();
    const orderDetails = {
      quantity,
      price,
      orderType,
      duration,
      stoploss,
      leverage,
      action,
    };
    console.log(orderDetails);  // Here you can handle the form submission
  };

  return (
    <div className="order-form">
      <form className="order-form-space">
        {/* Quantity and Price */}
        <div className="form-row">
          <div className="label">Qty</div>
          <div className="label">Price</div>
        </div>
        <div className="form-row">
          <div className="input-field">
            <input
              type="number"
              className="qty-box"
              id="quantity"
              name="quantity"
              placeholder="Enter quantity..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <span className="currency-sign">$</span>
          </div>
          <div className="input-field">
            <input
              type="number"
              className="price-box"
              id="price"
              name="price"
              placeholder="Enter price..."
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <span className="currency-sign">$</span>
          </div>
        </div>

        {/* Order Type and Duration */}
        <div className="form-row">
          <div className="label">Order Type</div>
          <div className="label">Time in Force</div>
        </div>
        <div className="form-row">
          <div className="input-field">
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
          </div>

          <div className="input-field">
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
        </div>

        {/* Stop Loss and Leverage */}
        <div className="form-row">
          <div className="label">Stop Loss</div>
          <div className="label">Leverage</div>
        </div>
        <div className="form-row">
          <div className="input-field">
            <input
              type="number"
              className="stop-loss"
              id="stoploss"
              name="stoploss"
              value={stoploss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
            <span className="currency-sign">$</span>
          </div>
          <div className="input-field">
            <input
              type="number"
              className="leverage"
              id="leverage"
              name="leverage"
              value={leverage}
              onChange={(e) => setLevergae(e.target.value)}
            />
            <span className="currency-sign">x</span>
          </div>
        </div>

        {/* Action Buttons */}
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

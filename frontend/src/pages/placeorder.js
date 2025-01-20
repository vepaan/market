import React, { useState } from "react";
import "../placeorder.css";

function PlaceOrder() {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [duration, setDuration] = useState("day");
  const [stoploss, setStopLoss] = useState(0);
  const [leverage, setLeverage] = useState(1);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleSelect = (action) => {
    setSelectedAction(action);
  };

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
    console.log(orderDetails);  // Here we can handle the form submission
  };

  return (
    <div className="order-form">
      <form className="order-form-space">

        {/* Action Buttons */}
        <div className="form-row">
          <button
            type="button"
            className={`button ${selectedAction === "buy" ? "selected" : ""}`}
            onClick={() => handleSelect("buy")}
          >
            Buy
          </button>
          <button
            type="button"
            className={`button ${selectedAction === "sell" ? "selected" : ""}`}
            onClick={() => handleSelect("sell")}
          >
            Sell
          </button>
          <button
            type="button"
            className={`button ${selectedAction === "shortSell" ? "selected" : ""}`}
            onClick={() => handleSelect("shortSell")}
          >
            Short Sell
          </button>
        </div>

        {/* Quantity and Price */}
        <div className="form-row">
          <div className="input-field">
            <label className="label">Quantity</label>
            <input
              type="number"
              className="qty-box"
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <span className="currency-sign">#</span>
          </div>
          <div className="input-field">
            <label className="label">Price</label>
            <input
              type="number"
              className="price-box"
              id="price"
              name="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <span className="currency-sign">$</span>
          </div>
        </div>

        {/* Order Type and Duration */}
        <div className="form-row">
          <div className="input-field">
            <label className="label">Order Type</label>
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
            <label className="label">Time in Force</label>
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
          <div className="input-field">
            <label className="label">Stop Loss</label>
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
            <label className="label">Leverage</label>
            <input
              type="number"
              className="leverage"
              id="leverage"
              name="leverage"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
            />
            <span className="currency-sign">X</span>
          </div>
        </div>

        {/* Submit order Button */}
        <div className="form-row">
          <button
            type="submit"
            className='execute-button'
            onClick={(e) => handleSubmit(e, "executed")}
          >
            Execute Order
          </button>
        </div>

      </form>
    </div>
  );
}

export default PlaceOrder;

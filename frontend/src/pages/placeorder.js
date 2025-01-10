import React, {useEffect, useState, useRef} from "react";
import '../App.css';

function PlaceOrder() {
  return (
    <div className="order-form">
        <form>
            <label htmlFor="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" placeholder="Enter quantity..." />
            <label htmlFor="price">Price</label>
            <input type="number" id="price" name="price" placeholder="Enter price..." />
            <button type="submit">Buy</button>
            <button type="submit">Sell</button>
        </form>
    </div>
  );
}

export default PlaceOrder
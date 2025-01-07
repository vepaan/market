from flask import Flask, request, jsonify
import yfinance as yf
from flask_cors import CORS
import time
from math import exp
import random
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/api/stock-data', methods=['GET'])
def get_stock_data():
    try:
        ticker = request.args.get('ticker', default='AAPL', type=str)
        range_period = request.args.get('range', default='1mo', type=str)

        # Determine interval based on range
        interval_map = {
            '1d': '1m',  # 1-minute data for 1 day
            '5d': '5m',  # 5-minute data for 5 days
            '1mo': '30m',  # Daily data for 1 month
            '1y': '1d',  # Daily data for 1 year
            'max': '1mo',  # Monthly data for max range
        }
        interval = interval_map.get(range_period, '1d')

        # Fetch stock data
        stock = yf.Ticker(ticker)
        history = stock.history(period=range_period, interval=interval)

        labels = history.index.strftime('%H:%M' if interval in ['1m', '5m'] else '%b %d').tolist()
        if interval == '1d':
            labels = history.index.strftime('%b').tolist()
        elif interval == '1mo':
            labels = history.index.strftime('%y').tolist()

        prices = history['Close'].tolist()

        return jsonify({
            'labels': labels,
            'prices': prices
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/company-name', methods=['GET'])
def get_company_name():
    try:
        ticker = request.args.get('ticker', default='AAPL', type=str)
        stock = yf.Ticker(ticker)
        company_name = stock.info.get('longName', 'N/A')  # Default to 'N/A' if name not found
        return jsonify({'companyName': company_name})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bid-ask', methods=['GET'])
def get_bid_ask():
    symbol = request.args.get('symbol', 'AAPL')
    price = request.args.get('price', type=float)  # Accept `price` as a query parameter

    try:
        if price is None:
            raise ValueError("Price parameter is required.")

        current_price = price

        # Generate volume (you can replace this with your actual logic)
        volume = random.randint(1_000_000, 10_000_000)

        base_spread_min = 0.001  # 0.1% of price for stable markets
        base_spread_max = 0.02   # 2% of price for highly unstable markets
        volume_normalizer = 1e6

        normalized_volume = volume / volume_normalizer
        spread_factor = exp(-normalized_volume)  # Exponential decay for spread
        spread_width = base_spread_min + (base_spread_max - base_spread_min) * spread_factor

        # Generate bid and ask prices
        half_spread = spread_width * current_price / 2
        bid_price = current_price - half_spread
        ask_price = current_price + half_spread

        # Add randomness to simulate real market behavior
        bid_price += random.uniform(-1.365, 0.01)
        ask_price += random.uniform(-0.01, 1.365)

        def generate_volume():
            if random.random() <= 0.85:  # 85% chance for smaller volumes
                return random.randint(10, 300)
            else:  # 15% chance for larger volumes
                return random.randint(300, 5000)

        bid_size = generate_volume()
        ask_size = generate_volume()

        order_id = str(int(time.time() * 1000))

        return jsonify({
            'orderId': order_id,
            'symbol': symbol,
            'bid': round(bid_price, 2),
            'bid_size': bid_size,
            'ask': round(ask_price, 2),
            'ask_size': ask_size
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_historical_volatility(prices):
    log_returns = np.log(prices / prices.shift(1)).dropna()
    daily_volatility = np.std(log_returns)
    annualized_volatility = daily_volatility * np.sqrt(252)
    return annualized_volatility

@app.route('/api/simulate-price', methods=['GET'])
def simulate_stock_price():
    symbol = request.args.get('symbol', 'AAPL')
    steps = 5  # Simulate 5 price points for 5s chart
    dt = 1     # Time step in seconds
    theta = 0.1  # Mean reversion speed
    mu = None

    try:
        # Fetch historical data
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1mo", interval="1d")
        if hist.empty:
            raise ValueError("No historical data available.")

        current_price = hist['Close'].iloc[-1]
        mu = hist['Close'].mean()  # Mean price over the period
        sigma = calculate_historical_volatility(hist['Close'])

        # Ornstein-Uhlenbeck simulation
        prices = [current_price]
        for _ in range(steps - 1):
            mean_reverting_term = theta * (mu - prices[-1]) * dt
            stochastic_term = sigma * np.random.normal(0, 1) * np.sqrt(dt)
            new_price = prices[-1] + mean_reverting_term + stochastic_term
            prices.append(round(new_price, 2))

        return jsonify({
            'symbol': symbol,
            'simulated_prices': prices,
            'volatitlity': sigma
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)

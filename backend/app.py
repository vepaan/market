from flask import Flask, request, jsonify
import yfinance as yf
from flask_cors import CORS
import time
from math import exp
import random

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

    try:
        stock = yf.Ticker(symbol)
        market_data = stock.info

        current_price = market_data.get('currentPrice', None)
        volume = market_data.get('volume', None)

        if current_price is None or volume is None:
            raise ValueError("Insufficient data to calculate bid/ask spreads.")
        
        base_spread_min = 0.001  # 0.1% of price the stable markets
        base_spread_max = 0.02   # 2% of price highly unstable markets
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
            if random.random() < 0.85:  # 85% chance for smaller volumes
                return random.randint(10, 300)
            else:  # 20% chance for larger volumes
                return random.randint(300, 5000)

        bid_size = generate_volume()
        ask_size = generate_volume()

        order_id = str(int(time.time() * 1000))

        return jsonify({
            'orderId': order_id,
            'symbol': symbol,
            'bid': round(bid_price,2),
            'bid_size': bid_size,
            'ask': round(ask_price,2),
            'ask_size': ask_size
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

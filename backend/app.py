from flask import Flask, request, jsonify
import yfinance as yf
from flask_cors import CORS
import time
import os
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
CORS(app)

ALPHA_VANTAGE_API_KEY = os.getenv('ALPHA_VANTAGE_API')
ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query'

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
        # Fetch real-time data from Alpha Vantage
        params = {
            'function': 'GLOBAL_QUOTE',
            'symbol': symbol,
            'apikey': ALPHA_VANTAGE_API_KEY,
        }
        response = requests.get(ALPHA_VANTAGE_URL, params=params)
        data = response.json()

        # Parse the response to extract bid and ask prices
        global_quote = data.get('Global Quote', {})
        bid_price = global_quote.get('05. price')  # Use appropriate keys from the API response
        ask_price = global_quote.get('08. ask price')  # Example key, adjust if needed
        bid_size = global_quote.get('06. bid size', None)  # Adjust based on the response structure
        ask_size = global_quote.get('09. ask size', None)

        # Generate a unique order ID using the current timestamp
        order_id = str(int(time.time() * 1000))

        return jsonify({
            'orderId': order_id,
            'symbol': symbol,
            'bid': bid_price,
            'bid_size': bid_size,
            'ask': ask_price,
            'ask_size': ask_size
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)

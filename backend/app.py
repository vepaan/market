from flask import Flask, request, jsonify
import yfinance as yf
from flask_cors import CORS

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
            'max': '1mo',  # Daily data for max range
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

if __name__ == '__main__':
    app.run(debug=True)

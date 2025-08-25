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
    

@app.route('/api/valid-ticker', methods=['GET'])
def isvalid():
    ticker = request.args.get('ticker', type=str)
    ticker = ticker.upper()
    data = yf.Ticker(ticker).history(period='1d')
    return {"is_valid": not data.empty}


@app.route('/api/bid-ask', methods=['GET'])
def get_bid_ask():
    symbol = request.args.get('symbol', 'AAPL')
    price = request.args.get('price', type=float)  # Accept `price` as a query parameter
    count = request.args.get('count', type=int) # New parameter for fetching multiple data points

    try:
        if price is None:
            raise ValueError("Price parameter is required.")

        bid_ask_data = []

        # Function to generate a single bid-ask entry
        def generate_bid_ask_entry(current_price):
            volume = random.randint(1_000_000, 10_000_000)

            base_spread_min = 0.001  # 0.1% of price for stable markets
            base_spread_max = 0.02   # 2% of price for highly unstable markets
            volume_normalizer = 1e6

            normalized_volume = volume / volume_normalizer
            spread_factor = exp(-normalized_volume)
            spread_width = base_spread_min + (base_spread_max - base_spread_min) * spread_factor

            half_spread = spread_width * current_price / 2
            bid_price = current_price - half_spread
            ask_price = current_price + half_spread

            bid_price += random.uniform(-1.365, 0.01)
            ask_price += random.uniform(-0.01, 1.365)

            def generate_volume():
                if random.random() <= 0.85:
                    return random.randint(10, 300)
                else:
                    return random.randint(300, 5000)

            return {
                'orderId': str(int(time.time() * 1000)),
                'symbol': symbol,
                'bid': round(bid_price, 2),
                'bid_size': generate_volume(),
                'ask': round(ask_price, 2),
                'ask_size': generate_volume()
            }

        if count and count > 0:
            for _ in range(count):
                bid_ask_data.append(generate_bid_ask_entry(price))
        else:
            bid_ask_data.append(generate_bid_ask_entry(price))

        return jsonify(bid_ask_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/company-details', methods=['GET'])
def get_company_details():
    try:
        ticker = request.args.get('ticker', default='AAPL', type=str)
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info or 'longBusinessSummary' not in info:
            return jsonify({'error': f"Could not fetch details for ticker: {ticker}"}), 404

        relevant_info = {
            'longName': info.get('longName', 'N/A'),
            'sector': info.get('sector', 'N/A'),
            'industry': info.get('industry', 'N/A'),
            'longBusinessSummary': info.get('longBusinessSummary', 'N/A'),
            'country': info.get('country', 'N/A'),
            'website': info.get('website', 'N/A'),
            'marketCap': info.get('marketCap', 'N/A'),
            'dividendYield': info.get('dividendYield', 'N/A'),
            'trailingPE': info.get('trailingPE', 'N/A'),
        }
        return jsonify(relevant_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_historical_volatility(prices):
    log_returns = np.log(prices / prices.shift(1)).dropna()
    daily_volatility = np.std(log_returns)
    # 10 day volatility gives better simuations
    annualized_volatility = daily_volatility * np.sqrt(10)  # 252 if computing the annualized volatility
    return annualized_volatility

def simulate_price_sequence(symbol):
    # Bull and Bear trend probabilities and duration
    bull_probability = 0.15
    bull_duration = 10  # Bull trend lasts for 10 data points
    bear_probability = 0.15
    bear_duration = 8  # Bear trend lasts for 8 data points

    dt = 5 / (252 * 6.5 * 3600)  # Convert 5 seconds to trading years
    theta = 0.1  # Mean reversion speed
    random_drift_factor = 0.001  # Small stochastic drift to simulate natural price movement

    # Fetch the last closing price as the starting point
    stock = yf.Ticker(symbol)
    hist = stock.history(period="1mo", interval="1d")
    if hist.empty:
        raise ValueError("No historical data available.")

    current_price = hist['Close'].iloc[-1]  # Use the latest close price
    mu = hist['Close'].mean()  # Mean price over the period
    sigma = calculate_historical_volatility(hist['Close'])  # Annualized volatility

    prices = [current_price]  # Initialize prices list with the latest close price

    trend_state = None  # Track current trend (None, 'bull', or 'bear')
    trend_counter = 0  # Track the number of data points in the current trend

    for _ in range(719):  # Generate 719 additional prices to make a total of 720
        # Handle trend logic
        if trend_counter == 0:
            # No active trend, decide randomly to start a bull or bear trend
            curr_random = random.random()
            if curr_random < bull_probability:
                trend_state = 'bull'
                trend_counter = bull_duration
            elif curr_random >= 1 - bear_probability:
                trend_state = 'bear'
                trend_counter = bear_duration

        # Adjust price movement based on the trend
        if trend_state == 'bull':
            trend_bias = 0.8 * sigma  # Upward bias, max .80 of the volatility
            trend_counter -= 1
        elif trend_state == 'bear':
            trend_bias = -0.8 * sigma  # Downward bias, max .80 of the volatility
            trend_counter -= 1
        else:
            trend_bias = 0  # No trend bias

        # Reset trend if duration is over
        if trend_counter <= 0:
            trend_state = None

        # Generate the next data point using GBM, Ornstein-Uhlenbeck mean reversion, and stochastic drift
        mean_reverting_term = theta * (mu - current_price) * dt
        stochastic_term = sigma * np.random.normal(0, 1) * np.sqrt(dt)
        stochastic_drift = random_drift_factor * current_price * np.random.normal(0, 1)

        # Calculate the new price with GBM, stochastic drift, and trend bias
        new_price = current_price + mean_reverting_term + stochastic_term + trend_bias + stochastic_drift

        # Ensure the new price doesn't go negative
        new_price = max(new_price, 0.01)

        prices.append(round(new_price, 2))
        current_price = new_price

    return prices


@app.route('/api/simulate-price-5s', methods=['GET'])
def simulate_5s_chart():
    symbol = request.args.get('symbol', 'AAPL')
    
    try:
        # Generate 720 price values based on the simulation
        prices = simulate_price_sequence(symbol)

        return jsonify({
            'symbol': symbol,
            'prices': prices,  # Return array
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import yfinance as yf
import pandas as pd
import random
import time
import numpy as np
from math import exp


# Endpoint to get stock data
@csrf_exempt
def get_stock_data(request: HttpRequest) -> JsonResponse:
    try:
        ticker = request.GET.get("ticker", "AAPL")
        range_period = request.GET.get("range", "1mo")

        interval_map = {
            "1d": "1m",
            "5d": "5m",
            "1mo": "30m",
            "1y": "1d",
            "max": "1mo",
        }
        interval = interval_map.get(range_period, "1d")

        stock = yf.Ticker(ticker)
        history = stock.history(period=range_period, interval=interval)

        datetime_index = pd.to_datetime(history.index)
        labels = datetime_index.strftime(
            "%H:%M" if interval in ["1m", "5m"] else "%b %d"
        ).tolist()

        if interval == "1d":
            labels = datetime_index.strftime("%b").tolist()
        elif interval == "1mo":
            labels = datetime_index.strftime("%y").tolist()

        prices = history["Close"].tolist()

        return JsonResponse({"labels": labels, "prices": prices})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Endpoint to get company name
@csrf_exempt
def get_company_name(request: HttpRequest):
    try:
        ticker = request.GET.get("ticker", "AAPL")
        stock = yf.Ticker(ticker)
        company_name = stock.info.get("longName", "N/A")
        return JsonResponse({"companyName": company_name})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Endpoint to check if ticker is valid
@csrf_exempt
def isvalid(request: HttpRequest):
    ticker = request.GET.get("ticker", "").upper()
    try:
        data = yf.Ticker(ticker).history(period="1d")
        return JsonResponse({"is_valid": not data.empty})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Endpoint to get bid/ask prices
@csrf_exempt
def get_bid_ask(request: HttpRequest) -> JsonResponse:
    symbol: str = request.GET.get("symbol", "AAPL")
    price = float(request.GET.get("price") or 0)

    try:
        if price is None:
            raise ValueError("Price parameter is required.")

        current_price = price
        volume = random.randint(1_000_000, 10_000_000)
        base_spread_min = 0.001
        base_spread_max = 0.02
        volume_normalizer = 1e6
        normalized_volume = volume / volume_normalizer
        spread_factor = exp(-normalized_volume)
        spread_width = (
            base_spread_min + (base_spread_max - base_spread_min) * spread_factor
        )

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

        bid_size = generate_volume()
        ask_size = generate_volume()

        order_id = str(int(time.time() * 1000))

        return JsonResponse(
            {
                "orderId": order_id,
                "symbol": symbol,
                "bid": round(bid_price, 2),
                "bid_size": bid_size,
                "ask": round(ask_price, 2),
                "ask_size": ask_size,
            }
        )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Helper function for volatility calculation
def calculate_historical_volatility(prices: pd.Series):
    prices = prices.dropna()
    log_returns: pd.Series = prices / prices.shift(1)
    log_returns.apply(np.log)
    daily_volatility: pd.Series = log_returns.apply(np.std)
    annualized_volatility: pd.Series = daily_volatility * np.sqrt(10)
    return annualized_volatility


# Endpoint to simulate stock prices
@csrf_exempt
def simulate_price_sequence(symbol: str):
    bull_probability = 0.15
    bull_duration = 10
    bear_probability = 0.15
    bear_duration = 8
    dt = 5 / (252 * 6.5 * 3600)
    theta = 0.1
    random_drift_factor = 0.001

    stock = yf.Ticker(symbol)
    hist: pd.DataFrame = stock.history(period="1mo", interval="1d")
    if hist.empty:
        raise ValueError("No historical data available.")

    current_price: float = hist["Close"].iloc[-1]
    mu = hist["Close"].mean()
    sigma = calculate_historical_volatility(hist["Close"])

    prices = [current_price]
    trend_state = None
    trend_counter = 0

    for _ in range(719):
        if trend_counter == 0:
            curr_random = random.random()
            if curr_random < bull_probability:
                trend_state = "bull"
                trend_counter = bull_duration
            elif curr_random >= 1 - bear_probability:
                trend_state = "bear"
                trend_counter = bear_duration

        if trend_state == "bull":
            trend_bias = 0.8 * sigma
            trend_counter -= 1
        elif trend_state == "bear":
            trend_bias = -0.8 * sigma
            trend_counter -= 1
        else:
            trend_bias = 0

        if trend_counter <= 0:
            trend_state = None

        mean_reverting_term = theta * (mu - current_price) * dt
        stochastic_term = sigma * np.random.normal(0, 1) * np.sqrt(dt)
        stochastic_drift = random_drift_factor * current_price * np.random.normal(0, 1)

        new_price = (
            current_price
            + mean_reverting_term
            + stochastic_term
            + trend_bias
            + stochastic_drift
        )
        new_price = max(new_price, 0.01)

        prices.append(round(new_price, 2))
        current_price = new_price

    return prices


# Endpoint to simulate prices for 5-second intervals
@csrf_exempt
def simulate_5s_chart(request: HttpRequest):
    symbol = request.GET.get("symbol", "AAPL")

    try:
        prices = simulate_price_sequence(symbol)

        return JsonResponse(
            {
                "symbol": symbol,
                "prices": prices,
            }
        )

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

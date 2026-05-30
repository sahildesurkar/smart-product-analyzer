import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def predict_future_prices(history_data, days_to_predict=30):
    """
    Uses Linear Regression to predict future price trends based on historical data.
    history_data: List of dicts with {'date': datetime, 'price': float}
    """
    if len(history_data) < 2:
        return None, "Insufficient data for AI prediction. Need at least 2 data points."

    try:
        # Prepare data for regression
        # X: days from the first data point
        # Y: prices
        history_data.sort(key=lambda x: x['date'])
        start_date = history_data[0]['date']
        
        X = []
        Y = []
        for entry in history_data:
            days_diff = (entry['date'] - start_date).days
            X.append([days_diff])
            Y.append(entry['price'])

        X = np.array(X)
        Y = np.array(Y)

        # Train model
        model = LinearRegression()
        model.fit(X, Y)

        # Predict future
        predictions = []
        last_day = X[-1][0]
        
        for i in range(1, 5): # Predict 4 major milestones (e.g., 7, 15, 30, 60 days)
            future_day = last_day + (i * (days_to_predict // 4))
            predicted_price = model.predict([[future_day]])[0]
            
            future_date = datetime.now() + timedelta(days=i * (days_to_predict // 4))
            predictions.append({
                "label": future_date.strftime('%b %d'),
                "predicted_price": round(float(predicted_price), 2),
                "days_ahead": i * (days_to_predict // 4)
            })

        # Calculate metrics
        current_price = Y[-1]
        future_price_30 = predictions[-1]['predicted_price']
        expected_change = round(float(future_price_30 - current_price), 2)
        
        trend = "Stable"
        if expected_change > (current_price * 0.02):
            trend = "Rising"
        elif expected_change < -(current_price * 0.02):
            trend = "Falling"

        recommendation = "Wait for a potential drop" if trend == "Falling" else "Buy Now"
        if trend == "Rising":
            recommendation = "Buy Now before price rises"

        return {
            "predictions": predictions,
            "trend": trend,
            "expected_change_30_days": expected_change,
            "recommendation": recommendation,
            "confidence": "Medium (Linear Projection)"
        }, None

    except Exception as e:
        logger.error(f"Prediction Engine Error: {e}")
        return None, f"Error processing prediction model: {str(e)}"

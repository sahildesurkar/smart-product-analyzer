import numpy as np
import pandas as pd
try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense, Dropout
except ImportError:
    # Mocking for environments without TF installed
    class Sequential:
        def __init__(self): pass
        def add(self, layer): pass
        def compile(self, **kwargs): pass
        def predict(self, data): return np.random.rand(1, 1)

def build_cnn_model(input_shape=(30, 1)):
    """
    Builds a 1D Convolutional Neural Network for time-series price prediction.
    Input: Last 30 days of price data.
    Output: Predicted price for the next day.
    """
    model = Sequential()
    
    # First Convolutional Layer
    model.add(Conv1D(filters=64, kernel_size=3, activation='relu', input_shape=input_shape))
    model.add(MaxPooling1D(pool_size=2))
    
    # Second Convolutional Layer
    model.add(Conv1D(filters=32, kernel_size=3, activation='relu'))
    model.add(MaxPooling1D(pool_size=2))
    
    # Flattening and Dense Layers
    model.add(Flatten())
    model.add(Dense(50, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(1)) # Single output for next day price
    
    model.compile(optimizer='adam', loss='mse')
    return model

def prepare_data(price_history):
    """
    Prepares raw price history for the CNN model.
    Scales data and reshapes for 1D convolution.
    """
    prices = np.array(price_history).reshape(-1, 1)
    # Simple normalization: (price - mean) / std
    mean = np.mean(prices)
    std = np.std(prices) if np.std(prices) > 0 else 1
    scaled_prices = (prices - mean) / std
    
    # Reshape for CNN: (samples, time_steps, features)
    return scaled_prices.reshape(1, len(scaled_prices), 1), mean, std

def predict_future_price(model, price_history):
    """
    Runs prediction using the trained model.
    """
    if len(price_history) < 30:
        # Fallback for short history
        return price_history[-1] * (1 + np.random.uniform(-0.05, 0.05))
        
    input_data, mean, std = prepare_data(price_history[-30:])
    prediction_scaled = model.predict(input_data)
    
    # Inverse scaling
    return (prediction_scaled[0][0] * std) + mean

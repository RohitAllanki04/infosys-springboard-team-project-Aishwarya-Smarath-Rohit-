# python-ai-service/utils/data_processor.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class DataProcessor:
    
    @staticmethod
    def prepare_time_series(df, date_column='sale_date', value_column='quantity_sold'):
        """Prepare time series data for forecasting"""
        if df.empty:
            return pd.Series()
        
        # Convert to datetime
        df[date_column] = pd.to_datetime(df[date_column])
        
        # Set date as index
        df = df.set_index(date_column)
        
        # Resample to daily frequency and fill missing dates
        ts = df[value_column].resample('D').sum().fillna(0)
        
        return ts
    
    @staticmethod
    def fill_missing_dates(df, start_date, end_date):
        """Fill missing dates in time series"""
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        df = df.reindex(date_range, fill_value=0)
        return df
    
    @staticmethod
    def calculate_moving_average(series, window=7):
        """Calculate moving average"""
        return series.rolling(window=window, min_periods=1).mean()
    
    @staticmethod
    def detect_outliers(series, threshold=3):
        """Detect outliers using Z-score method"""
        z_scores = np.abs((series - series.mean()) / series.std())
        return z_scores > threshold
    
    @staticmethod
    def remove_outliers(series, threshold=3):
        """Remove outliers from series"""
        outliers = DataProcessor.detect_outliers(series, threshold)
        clean_series = series.copy()
        clean_series[outliers] = series.median()
        return clean_series
    
    @staticmethod
    def calculate_trend(series):
        """Calculate trend coefficient"""
        if len(series) < 2:
            return 0.0
        
        x = np.arange(len(series))
        y = series.values
        
        # Linear regression
        coefficients = np.polyfit(x, y, 1)
        trend = coefficients[0]
        
        return float(trend)
    
    @staticmethod
    def calculate_seasonality(series, period=7):
        """Calculate seasonal indices"""
        if len(series) < period * 2:
            return None
        
        # Calculate average for each day of the week/month
        seasonal_indices = {}
        for i in range(period):
            period_values = series[i::period]
            seasonal_indices[i] = period_values.mean() / series.mean() if series.mean() > 0 else 1.0
        
        return seasonal_indices
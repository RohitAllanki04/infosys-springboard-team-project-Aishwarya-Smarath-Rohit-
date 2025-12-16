# python-ai-service/models/demand_forecaster.py
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
from utils.data_processor import DataProcessor

class DemandForecaster:
    
    def __init__(self):
        self.data_processor = DataProcessor()
    
    def forecast_demand(self, historical_data, days_ahead=30, method='auto'):
        """
        Forecast demand using various methods
        
        Args:
            historical_data: DataFrame with historical sales
            days_ahead: Number of days to forecast
            method: 'auto', 'moving_average', 'exponential_smoothing', 'arima', 'linear_regression'
        
        Returns:
            dict with forecast results
        """
        if historical_data.empty or len(historical_data) < 7:
            return self._generate_default_forecast(days_ahead)
        
        # Prepare time series
        ts = self.data_processor.prepare_time_series(historical_data)
        
        if len(ts) < 7:
            return self._generate_default_forecast(days_ahead)
        
        # Auto-select best method
        if method == 'auto':
            method = self._select_best_method(ts)
        
        # Generate forecast based on method
        if method == 'moving_average':
            forecast = self._moving_average_forecast(ts, days_ahead)
        elif method == 'exponential_smoothing':
            forecast = self._exponential_smoothing_forecast(ts, days_ahead)
        elif method == 'arima':
            forecast = self._arima_forecast(ts, days_ahead)
        elif method == 'linear_regression':
            forecast = self._linear_regression_forecast(ts, days_ahead)
        else:
            forecast = self._moving_average_forecast(ts, days_ahead)
        
        # Calculate confidence and bounds
        forecast = self._add_confidence_bounds(forecast, ts)
        
        return forecast
    
    def _select_best_method(self, ts):
        """Select best forecasting method based on data characteristics"""
        data_length = len(ts)
        
        if data_length < 14:
            return 'moving_average'
        elif data_length < 30:
            return 'exponential_smoothing'
        else:
            # Check for trend and seasonality
            trend = self.data_processor.calculate_trend(ts)
            if abs(trend) > 0.1:
                return 'linear_regression'
            else:
                return 'exponential_smoothing'
    
    def _moving_average_forecast(self, ts, days_ahead):
        """Simple Moving Average forecast"""
        window = min(7, len(ts))
        last_values = ts.tail(window)
        avg_demand = last_values.mean()
        
        forecast_dates = pd.date_range(
            start=ts.index[-1] + pd.Timedelta(days=1),
            periods=days_ahead,
            freq='D'
        )
        
        forecasted_values = [avg_demand] * days_ahead
        
        return {
            'method': 'moving_average',
            'dates': forecast_dates.tolist(),
            'values': forecasted_values,
            'avg_daily_demand': float(avg_demand),
            'total_forecast': float(sum(forecasted_values))
        }
    
    def _exponential_smoothing_forecast(self, ts, days_ahead):
        """Exponential Smoothing forecast"""
        try:
            # Clean data
            ts_clean = self.data_processor.remove_outliers(ts)
            
            # Fit Exponential Smoothing model
            model = ExponentialSmoothing(
                ts_clean,
                seasonal_periods=7,
                trend='add',
                seasonal='add',
                initialization_method='estimated'
            )
            fitted_model = model.fit()
            
            # Forecast
            forecast = fitted_model.forecast(days_ahead)
            forecast = np.maximum(forecast, 0)  # Ensure non-negative
            
            forecast_dates = pd.date_range(
                start=ts.index[-1] + pd.Timedelta(days=1),
                periods=days_ahead,
                freq='D'
            )
            
            return {
                'method': 'exponential_smoothing',
                'dates': forecast_dates.tolist(),
                'values': forecast.tolist(),
                'avg_daily_demand': float(forecast.mean()),
                'total_forecast': float(forecast.sum())
            }
        except Exception as e:
            print(f"Exponential Smoothing failed: {e}, falling back to Moving Average")
            return self._moving_average_forecast(ts, days_ahead)
    
    def _arima_forecast(self, ts, days_ahead):
        """ARIMA forecast"""
        try:
            # Clean data
            ts_clean = self.data_processor.remove_outliers(ts)
            
            # Fit ARIMA model (p=1, d=1, q=1)
            model = ARIMA(ts_clean, order=(1, 1, 1))
            fitted_model = model.fit()
            
            # Forecast
            forecast = fitted_model.forecast(steps=days_ahead)
            forecast = np.maximum(forecast, 0)  # Ensure non-negative
            
            forecast_dates = pd.date_range(
                start=ts.index[-1] + pd.Timedelta(days=1),
                periods=days_ahead,
                freq='D'
            )
            
            return {
                'method': 'arima',
                'dates': forecast_dates.tolist(),
                'values': forecast.tolist(),
                'avg_daily_demand': float(forecast.mean()),
                'total_forecast': float(forecast.sum())
            }
        except Exception as e:
            print(f"ARIMA failed: {e}, falling back to Exponential Smoothing")
            return self._exponential_smoothing_forecast(ts, days_ahead)
    
    def _linear_regression_forecast(self, ts, days_ahead):
        """Linear Regression forecast"""
        try:
            # Prepare data
            X = np.arange(len(ts)).reshape(-1, 1)
            y = ts.values
            
            # Fit model
            model = LinearRegression()
            model.fit(X, y)
            
            # Forecast
            future_X = np.arange(len(ts), len(ts) + days_ahead).reshape(-1, 1)
            forecast = model.predict(future_X)
            forecast = np.maximum(forecast, 0)  # Ensure non-negative
            
            forecast_dates = pd.date_range(
                start=ts.index[-1] + pd.Timedelta(days=1),
                periods=days_ahead,
                freq='D'
            )
            
            return {
                'method': 'linear_regression',
                'dates': forecast_dates.tolist(),
                'values': forecast.tolist(),
                'avg_daily_demand': float(forecast.mean()),
                'total_forecast': float(forecast.sum())
            }
        except Exception as e:
            print(f"Linear Regression failed: {e}, falling back to Moving Average")
            return self._moving_average_forecast(ts, days_ahead)
    
    def _add_confidence_bounds(self, forecast, historical_ts):
        """Add confidence intervals to forecast"""
        # Calculate standard deviation of historical data
        std_dev = historical_ts.std()
        
        # 95% confidence interval (±2 standard deviations)
        upper_bound = [max(0, v + 2 * std_dev) for v in forecast['values']]
        lower_bound = [max(0, v - 2 * std_dev) for v in forecast['values']]
        
        forecast['upper_bound'] = upper_bound
        forecast['lower_bound'] = lower_bound
        forecast['confidence'] = self._calculate_confidence(historical_ts)
        
        return forecast
    
    def _calculate_confidence(self, ts):
        """Calculate forecast confidence based on data quality"""
        data_points = len(ts)
        
        if data_points < 7:
            return 0.5
        elif data_points < 14:
            return 0.65
        elif data_points < 30:
            return 0.75
        
        # Calculate coefficient of variation
        mean = ts.mean()
        std = ts.std()
        cv = std / mean if mean > 0 else 1.0
        
        # Lower CV = higher confidence
        confidence = max(0.5, min(0.95, 0.95 - cv))
        
        return float(confidence)
    
    def _generate_default_forecast(self, days_ahead):
        """Generate default forecast when insufficient data"""
        forecast_dates = pd.date_range(
            start=pd.Timestamp.now(),
            periods=days_ahead,
            freq='D'
        )
        
        return {
            'method': 'default',
            'dates': forecast_dates.tolist(),
            'values': [5.0] * days_ahead,
            'avg_daily_demand': 5.0,
            'total_forecast': 5.0 * days_ahead,
            'upper_bound': [10.0] * days_ahead,
            'lower_bound': [1.0] * days_ahead,
            'confidence': 0.5
        }
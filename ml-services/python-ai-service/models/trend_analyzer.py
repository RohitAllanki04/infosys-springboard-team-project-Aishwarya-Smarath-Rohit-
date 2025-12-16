# python-ai-service/models/trend_analyzer.py
import numpy as np
import pandas as pd
from utils.data_processor import DataProcessor

class TrendAnalyzer:
    
    def __init__(self):
        self.data_processor = DataProcessor()
    
    def analyze_trends(self, historical_data):
        """
        Analyze trends in historical data
        
        Args:
            historical_data: DataFrame with historical sales
        
        Returns:
            dict with trend analysis
        """
        if historical_data.empty:
            return self._default_trend_analysis()
        
        # Prepare time series
        ts = self.data_processor.prepare_time_series(historical_data)
        
        if len(ts) < 7:
            return self._default_trend_analysis()
        
        # Calculate various metrics
        trend_coefficient = self.data_processor.calculate_trend(ts)
        seasonality = self.data_processor.calculate_seasonality(ts, period=7)
        
        # Moving averages
        ma7 = self.data_processor.calculate_moving_average(ts, window=7)
        ma30 = self.data_processor.calculate_moving_average(ts, window=30) if len(ts) >= 30 else ma7
        
        # Growth rate
        growth_rate = self._calculate_growth_rate(ts)
        
        # Volatility
        volatility = self._calculate_volatility(ts)
        
        # Trend direction
        if trend_coefficient > 0.1:
            trend_direction = 'INCREASING'
        elif trend_coefficient < -0.1:
            trend_direction = 'DECREASING'
        else:
            trend_direction = 'STABLE'
        
        return {
            'trend_direction': trend_direction,
            'trend_coefficient': float(trend_coefficient),
            'growth_rate': float(growth_rate),
            'volatility': float(volatility),
            'seasonality': seasonality,
            'moving_average_7d': float(ma7.iloc[-1]) if len(ma7) > 0 else 0,
            'moving_average_30d': float(ma30.iloc[-1]) if len(ma30) > 0 else 0,
            'min_demand': float(ts.min()),
            'max_demand': float(ts.max()),
            'avg_demand': float(ts.mean()),
            'std_demand': float(ts.std())
        }
    
    def _calculate_growth_rate(self, ts):
        """Calculate overall growth rate"""
        if len(ts) < 2:
            return 0.0
        
        # Compare first half vs second half
        mid_point = len(ts) // 2
        first_half_avg = ts.iloc[:mid_point].mean()
        second_half_avg = ts.iloc[mid_point:].mean()
        
        if first_half_avg == 0:
            return 0.0
        
        growth_rate = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        return growth_rate
    
    def _calculate_volatility(self, ts):
        """Calculate demand volatility (coefficient of variation)"""
        mean = ts.mean()
        std = ts.std()
        
        if mean == 0:
            return 0.0
        
        cv = (std / mean) * 100
        return cv
    
    def _default_trend_analysis(self):
        """Default trend analysis when insufficient data"""
        return {
            'trend_direction': 'UNKNOWN',
            'trend_coefficient': 0.0,
            'growth_rate': 0.0,
            'volatility': 0.0,
            'seasonality': None,
            'moving_average_7d': 0.0,
            'moving_average_30d': 0.0,
            'min_demand': 0.0,
            'max_demand': 0.0,
            'avg_demand': 0.0,
            'std_demand': 0.0
        }
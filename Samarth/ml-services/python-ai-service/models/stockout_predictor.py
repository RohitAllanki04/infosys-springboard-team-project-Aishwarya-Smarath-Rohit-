# python-ai-service/models/stockout_predictor.py
import numpy as np
from models.demand_forecaster import DemandForecaster

class StockoutPredictor:
    
    def __init__(self):
        self.forecaster = DemandForecaster()
    
    def predict_stockout_risk(self, product_info, historical_data):
        """
        Predict stockout risk for a product
        
        Args:
            product_info: dict with product information
            historical_data: DataFrame with historical sales
        
        Returns:
            dict with stockout prediction
        """
        current_stock = product_info.get('current_stock', 0)
        lead_time_days = product_info.get('lead_time_days', 7)
        
        # Forecast demand for lead time + safety period
        forecast_days = lead_time_days + 7
        forecast = self.forecaster.forecast_demand(historical_data, forecast_days)
        
        # Calculate stockout probability
        avg_daily_demand = forecast['avg_daily_demand']
        total_forecast_demand = forecast['total_forecast']
        
        # Days until stockout
        days_until_stockout = current_stock / avg_daily_demand if avg_daily_demand > 0 else 999
        
        # Stockout risk calculation
        if days_until_stockout <= 3:
            risk_level = 'CRITICAL'
            risk_score = 1.0
        elif days_until_stockout <= 7:
            risk_level = 'HIGH'
            risk_score = 0.75
        elif days_until_stockout <= 14:
            risk_level = 'MEDIUM'
            risk_score = 0.5
        elif days_until_stockout <= 30:
            risk_level = 'LOW'
            risk_score = 0.25
        else:
            risk_level = 'VERY_LOW'
            risk_score = 0.1
        
        # Calculate shortfall
        shortfall = max(0, total_forecast_demand - current_stock)
        
        return {
            'product_id': product_info['id'],
            'product_name': product_info['name'],
            'current_stock': current_stock,
            'avg_daily_demand': round(avg_daily_demand, 2),
            'forecast_demand': round(total_forecast_demand, 2),
            'days_until_stockout': round(days_until_stockout, 1),
            'risk_level': risk_level,
            'risk_score': risk_score,
            'shortfall': round(shortfall, 2),
            'recommended_reorder_qty': self._calculate_reorder_quantity(
                product_info, avg_daily_demand, lead_time_days
            )
        }
    
    def _calculate_reorder_quantity(self, product_info, avg_daily_demand, lead_time_days):
        """Calculate recommended reorder quantity"""
        # Economic Order Quantity (EOQ) simplified
        safety_stock = avg_daily_demand * 7  # 7 days safety stock
        lead_time_demand = avg_daily_demand * lead_time_days
        reorder_qty = safety_stock + lead_time_demand - product_info.get('current_stock', 0)
        
        # Use configured reorder quantity if available
        configured_qty = product_info.get('reorder_quantity', 0)
        if configured_qty > 0:
            reorder_qty = max(reorder_qty, configured_qty)
        
        return max(10, int(np.ceil(reorder_qty)))
# python-ai-service/routes/forecast_routes.py
from flask import Blueprint, request, jsonify
from models.demand_forecaster import DemandForecaster
from models.stockout_predictor import StockoutPredictor
from models.trend_analyzer import TrendAnalyzer
from utils.db_connector import db
import traceback

forecast_bp = Blueprint('forecast', __name__)

forecaster = DemandForecaster()
stockout_predictor = StockoutPredictor()
trend_analyzer = TrendAnalyzer()

@forecast_bp.route('/forecast/product/<int:product_id>', methods=['POST'])
def forecast_product_demand(product_id):
    """Forecast demand for a specific product"""
    try:
        data = request.get_json() or {}
        days_ahead = data.get('days_ahead', 30)
        method = data.get('method', 'auto')
        
        # Get product info
        product_info = db.get_product_info(product_id)
        if not product_info:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get historical sales data
        historical_data = db.get_historical_sales(product_id, days=90)
        
        # Generate forecast
        forecast = forecaster.forecast_demand(historical_data, days_ahead, method)
        
        # Add product info to response
        forecast['product_id'] = product_id
        forecast['product_name'] = product_info['name']
        forecast['current_stock'] = product_info['current_stock']
        
        return jsonify({
            'success': True,
            'forecast': forecast
        })
        
    except Exception as e:
        print(f"Error in forecast_product_demand: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@forecast_bp.route('/forecast/all', methods=['POST'])
def forecast_all_products():
    """Forecast demand for all products"""
    try:
        data = request.get_json() or {}
        days_ahead = data.get('days_ahead', 30)
        
        products = db.get_all_products()
        forecasts = []
        
        for product in products:
            try:
                product_id = product['id']
                historical_data = db.get_historical_sales(product_id, days=90)
                
                forecast = forecaster.forecast_demand(historical_data, days_ahead)
                forecast['product_id'] = product_id
                forecast['product_name'] = product['name']
                forecast['current_stock'] = product['current_stock']
                
                forecasts.append(forecast)
            except Exception as e:
                print(f"Error forecasting product {product['id']}: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'count': len(forecasts),
            'forecasts': forecasts
        })
        
    except Exception as e:
        print(f"Error in forecast_all_products: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@forecast_bp.route('/forecast/stockout-risks', methods=['GET'])
def get_stockout_risks():
    """Get stockout risk predictions for all products"""
    try:
        products = db.get_all_products()
        risks = []
        
        for product in products:
            try:
                product_id = product['id']
                historical_data = db.get_historical_sales(product_id, days=90)
                
                risk = stockout_predictor.predict_stockout_risk(product, historical_data)
                
                # Only include products with medium or higher risk
                if risk['risk_score'] >= 0.5:
                    risks.append(risk)
                    
            except Exception as e:
                print(f"Error predicting stockout for product {product['id']}: {str(e)}")
                continue
        
        # Sort by risk score (highest first)
        risks.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'count': len(risks),
            'risks': risks
        })
        
    except Exception as e:
        print(f"Error in get_stockout_risks: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@forecast_bp.route('/forecast/trends/<int:product_id>', methods=['GET'])
def analyze_product_trends(product_id):
    """Analyze trends for a specific product"""
    try:
        # Get product info
        product_info = db.get_product_info(product_id)
        if not product_info:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get historical sales data
        historical_data = db.get_historical_sales(product_id, days=90)
        
        # Analyze trends
        trends = trend_analyzer.analyze_trends(historical_data)
        trends['product_id'] = product_id
        trends['product_name'] = product_info['name']
        
        return jsonify({
            'success': True,
            'trends': trends
        })
        
    except Exception as e:
        print(f"Error in analyze_product_trends: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@forecast_bp.route('/forecast/restock-recommendations', methods=['GET'])
def get_restock_recommendations():
    """Get AI-based restock recommendations"""
    try:
        products = db.get_all_products()
        recommendations = []
        
        for product in products:
            try:
                product_id = product['id']
                current_stock = product['current_stock']
                reorder_point = product['reorder_point']
                
                # Check if product needs restocking
                if current_stock <= reorder_point:
                    historical_data = db.get_historical_sales(product_id, days=90)
                    
                    # Get stockout risk
                    risk = stockout_predictor.predict_stockout_risk(product, historical_data)
                    
                    # Get trends
                    trends = trend_analyzer.analyze_trends(historical_data)
                    
                    recommendation = {
                        'product_id': product_id,
                        'product_name': product['name'],
                        'current_stock': current_stock,
                        'reorder_point': reorder_point,
                        'recommended_order_qty': risk['recommended_reorder_qty'],
                        'avg_daily_demand': risk['avg_daily_demand'],
                        'days_until_stockout': risk['days_until_stockout'],
                        'risk_level': risk['risk_level'],
                        'risk_score': risk['risk_score'],
                        'trend_direction': trends['trend_direction'],
                        'growth_rate': trends['growth_rate'],
                        'estimated_cost': risk['recommended_reorder_qty'] * product['price'],
                        'lead_time_days': product['lead_time_days']
                    }
                    
                    recommendations.append(recommendation)
                    
            except Exception as e:
                print(f"Error generating recommendation for product {product['id']}: {str(e)}")
                continue
        
        # Sort by risk score (highest first)
        recommendations.sort(key=lambda x: x['risk_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'count': len(recommendations),
            'recommendations': recommendations
        })
        
    except Exception as e:
        print(f"Error in get_restock_recommendations: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
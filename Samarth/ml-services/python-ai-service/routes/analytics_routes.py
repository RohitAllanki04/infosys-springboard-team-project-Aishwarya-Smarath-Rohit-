# python-ai-service/routes/analytics_routes.py
from flask import Blueprint, jsonify
from utils.db_connector import db
from models.trend_analyzer import TrendAnalyzer
import traceback

analytics_bp = Blueprint('analytics', __name__)
trend_analyzer = TrendAnalyzer()

@analytics_bp.route('/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Get overall analytics summary"""
    try:
        products = db.get_all_products()
        
        total_products = len(products)
        total_stock_value = sum(p['current_stock'] * p['price'] for p in products)
        low_stock_products = sum(1 for p in products if p['current_stock'] <= p['reorder_point'])
        
        # Get total sales from historical data
        all_sales = db.get_historical_sales(days=30)
        total_sales_30d = all_sales['quantity_sold'].sum() if not all_sales.empty else 0
        total_revenue_30d = all_sales['revenue'].sum() if not all_sales.empty else 0
        
        return jsonify({
            'success': True,
            'summary': {
                'total_products': total_products,
                'total_stock_value': round(total_stock_value, 2),
                'low_stock_products': low_stock_products,
                'total_sales_30d': int(total_sales_30d),
                'total_revenue_30d': round(total_revenue_30d, 2)
            }
        })
        
    except Exception as e:
        print(f"Error in get_analytics_summary: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/analytics/top-products', methods=['GET'])
def get_top_products():
    """Get top selling products"""
    try:
        all_sales = db.get_historical_sales(days=30)
        
        if all_sales.empty:
            return jsonify({
                'success': True,
                'products': []
            })
        
        # Group by product and sum quantities
        top_products = all_sales.groupby(['product_id', 'product_name']).agg({
            'quantity_sold': 'sum',
            'revenue': 'sum'
        }).reset_index()
        
        top_products = top_products.sort_values('quantity_sold', ascending=False).head(10)
        
        result = top_products.to_dict('records')
        
        return jsonify({
            'success': True,
            'products': result
        })
        
    except Exception as e:
        print(f"Error in get_top_products: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/analytics/trends/all', methods=['GET'])
def get_all_trends():
    """Get trend analysis for all products"""
    try:
        products = db.get_all_products()
        trends_data = []
        
        for product in products:
            try:
                product_id = product['id']
                historical_data = db.get_historical_sales(product_id, days=90)
                
                if not historical_data.empty:
                    trends = trend_analyzer.analyze_trends(historical_data)
                    trends['product_id'] = product_id
                    trends['product_name'] = product['name']
                    trends_data.append(trends)
                    
            except Exception as e:
                print(f"Error analyzing trends for product {product['id']}: {str(e)}")
                continue
        
        return jsonify({
            'success': True,
            'count': len(trends_data),
            'trends': trends_data
        })
        
    except Exception as e:
        print(f"Error in get_all_trends: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
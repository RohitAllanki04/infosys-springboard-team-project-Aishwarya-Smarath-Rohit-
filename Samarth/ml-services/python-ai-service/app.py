# python-ai-service/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from utils.db_connector import db
from routes.forecast_routes import forecast_bp
from routes.analytics_routes import analytics_bp

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:8080"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Register blueprints
app.register_blueprint(forecast_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'AI Forecasting Service',
        'version': '1.0.0'
    })

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'AI-Powered Inventory Forecasting Service',
        'version': '1.0.0',
        'endpoints': {
            'forecast_product': '/api/forecast/product/<product_id>',
            'forecast_all': '/api/forecast/all',
            'stockout_risks': '/api/forecast/stockout-risks',
            'trends': '/api/forecast/trends/<product_id>',
            'restock_recommendations': '/api/forecast/restock-recommendations',
            'analytics_summary': '/api/analytics/summary',
            'top_products': '/api/analytics/top-products',
            'all_trends': '/api/analytics/trends/all'
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🤖 AI-Powered Inventory Forecasting Service")
    print("=" * 60)
    
    # Connect to database
    print("📊 Connecting to MySQL database...")
    if db.connect():
        print("✅ Database connection established")
    else:
        print("❌ Failed to connect to database")
        print("⚠️  Service will continue but forecasts may not work")
    
    print(f"🚀 Starting Flask server on {Config.HOST}:{Config.PORT}")
    print("=" * 60)
    
    # Run Flask app
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
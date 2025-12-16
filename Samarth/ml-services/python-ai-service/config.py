# python-ai-service/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # MySQL Database Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_NAME = os.getenv('DB_NAME', 'inventory_db')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'root123')
    
    # Spring Boot API Configuration
    SPRING_BOOT_URL = os.getenv('SPRING_BOOT_URL', 'http://localhost:8080/api')
    
    # ML Model Configuration
    FORECAST_CONFIDENCE_THRESHOLD = 0.7
    MIN_HISTORICAL_DATA_POINTS = 7
    DEFAULT_FORECAST_DAYS = 30
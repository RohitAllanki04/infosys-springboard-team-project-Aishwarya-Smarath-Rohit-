# python-ai-service/utils/db_connector.py
import mysql.connector
from mysql.connector import Error
from config import Config
import pandas as pd

class DatabaseConnector:
    def __init__(self):
        self.connection = None
        
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                database=Config.DB_NAME,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD
            )
            if self.connection.is_connected():
                print("✅ Successfully connected to MySQL database")
                return True
        except Error as e:
            print(f"❌ Error connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("✅ Database connection closed")
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            result = cursor.fetchall()
            cursor.close()
            return result
        except Error as e:
            print(f"❌ Error executing query: {e}")
            return None
    
    def get_historical_sales(self, product_id=None, days=90):
        """Get historical sales data"""
        if product_id:
            query = """
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    DATE(o.order_date) as sale_date,
                    SUM(oi.quantity) as quantity_sold,
                    SUM(oi.quantity * oi.price_at_purchase) as revenue
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE p.id = %s 
                    AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY p.id, p.name, DATE(o.order_date)
                ORDER BY sale_date ASC
            """
            params = (product_id, days)
        else:
            query = """
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    DATE(o.order_date) as sale_date,
                    SUM(oi.quantity) as quantity_sold,
                    SUM(oi.quantity * oi.price_at_purchase) as revenue
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY p.id, p.name, DATE(o.order_date)
                ORDER BY p.id, sale_date ASC
            """
            params = (days,)
        
        results = self.execute_query(query, params)
        return pd.DataFrame(results) if results else pd.DataFrame()
    
    def get_product_info(self, product_id):
        """Get product information"""
        query = """
            SELECT id, name, price, current_stock, purchase_count,
                   reorder_point, reorder_quantity, lead_time_days
            FROM products
            WHERE id = %s
        """
        result = self.execute_query(query, (product_id,))
        return result[0] if result else None
    
    def get_all_products(self):
        """Get all products"""
        query = """
            SELECT id, name, price, current_stock, purchase_count,
                   reorder_point, reorder_quantity, lead_time_days
            FROM products
            ORDER BY name
        """
        return self.execute_query(query)

# Create singleton instance
db = DatabaseConnector()
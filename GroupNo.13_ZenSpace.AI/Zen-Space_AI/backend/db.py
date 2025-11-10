import mysql.connector
from mysql.connector import Error
from config import Config
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Database connection and management"""
    
    def __init__(self):
        self.connection = None
        self.config = {
            'host': Config.MYSQL_HOST,
            'user': Config.MYSQL_USER,
            'password': Config.MYSQL_PASSWORD,
            'database': Config.MYSQL_DATABASE,
            'charset': 'utf8mb4',
            'collation': 'utf8mb4_unicode_ci',
            'autocommit': True,
            'raise_on_warnings': True
        }
    
    def connect(self):
        """Establish database connection"""
        try:
            if self.connection is None or not self.connection.is_connected():
                self.connection = mysql.connector.connect(**self.config)
                logger.info("Successfully connected to MySQL database")
            return self.connection
        except Error as e:
            logger.error(f"Error connecting to MySQL: {e}")
            return None
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("MySQL connection closed")
    
    def execute_query(self, query, params=None, fetch=False):
        """Execute a query with optional parameters"""
        try:
            connection = self.connect()
            if not connection:
                return None
            
            cursor = connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            
            if fetch:
                if 'SELECT' in query.upper():
                    if 'LIMIT 1' in query.upper() or 'WHERE' in query.upper() and 'id' in query:
                        result = cursor.fetchone()
                    else:
                        result = cursor.fetchall()
                else:
                    result = cursor.rowcount
            else:
                connection.commit()
                result = cursor.lastrowid if cursor.lastrowid else cursor.rowcount
            
            cursor.close()
            return result
            
        except Error as e:
            logger.error(f"Database error: {e}")
            if connection:
                connection.rollback()
            return None
    
    def check_connection(self):
        """Check if database connection is healthy"""
        try:
            connection = self.connect()
            if connection and connection.is_connected():
                cursor = connection.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                return True
        except Error as e:
            logger.error(f"Connection check failed: {e}")
        return False
    
    def get_table_info(self, table_name):
        """Get information about a table"""
        query = f"DESCRIBE {table_name}"
        return self.execute_query(query, fetch=True)
    
    def initialize_database(self):
        """Initialize database with required tables"""
        try:
            # Check if tables exist
            tables_query = """
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = %s
            """
            tables = self.execute_query(tables_query, (Config.MYSQL_DATABASE,), fetch=True)
            
            required_tables = ['users', 'designs', 'products', 'design_items']
            existing_tables = [table['TABLE_NAME'] for table in (tables or [])]
            
            missing_tables = [table for table in required_tables if table not in existing_tables]
            
            if missing_tables:
                logger.warning(f"Missing tables: {missing_tables}")
                logger.info("Please run the schema.sql file to create required tables")
                return False
            else:
                logger.info("All required tables exist")
                return True
                
        except Error as e:
            logger.error(f"Database initialization error: {e}")
            return False

# Global database manager instance
db_manager = DatabaseManager()

def get_db_connection():
    """Get database connection - for backward compatibility"""
    return db_manager.connect()

def init_db():
    """Initialize database - for use in app startup"""
    return db_manager.initialize_database()

import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
from config import Config

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE,
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci'
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

class User:
    @staticmethod
    def create_user(username, email, password):
        """Create a new user in the database"""
        connection = get_db_connection()
        if not connection:
            return None
        
        cursor = connection.cursor()
        password_hash = generate_password_hash(password)
        
        try:
            query = """
                INSERT INTO users (username, email, password_hash, created_at)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (username, email, password_hash, datetime.now()))
            connection.commit()
            user_id = cursor.lastrowid
            return user_id
        except mysql.connector.IntegrityError as err:
            print(f"User creation failed: {err}")
            return None
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email address"""
        connection = get_db_connection()
        if not connection:
            return None
        
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = "SELECT * FROM users WHERE email = %s"
            cursor.execute(query, (email,))
            user = cursor.fetchone()
            return user
        except mysql.connector.Error as err:
            print(f"Error fetching user: {err}")
            return None
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        connection = get_db_connection()
        if not connection:
            return None
        
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = "SELECT id, username, email, created_at FROM users WHERE id = %s"
            cursor.execute(query, (user_id,))
            user = cursor.fetchone()
            return user
        except mysql.connector.Error as err:
            print(f"Error fetching user: {err}")
            return None
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def verify_password(user, password):
        """Verify user password"""
        return check_password_hash(user['password_hash'], password)

class Design:
    @staticmethod
    def create_design(user_id, room_image, room_name='Untitled Room', style=None):
        """Create a new design in the database"""
        connection = get_db_connection()
        if not connection:
            return None
        
        cursor = connection.cursor()
        
        try:
            query = """
                INSERT INTO designs (user_id, room_name, room_image, style, created_at, status)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (user_id, room_name, room_image, style, datetime.now(), 'processing'))
            connection.commit()
            design_id = cursor.lastrowid
            return design_id
        except mysql.connector.Error as err:
            print(f"Design creation failed: {err}")
            return None
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def get_user_designs(user_id):
        """Get all designs for a user"""
        connection = get_db_connection()
        if not connection:
            return []
        
        cursor = connection.cursor(dictionary=True)
        
        try:
            query = """
                SELECT id, room_name, style, status, created_at, room_image, ai_analysis
                FROM designs WHERE user_id = %s ORDER BY created_at DESC
            """
            cursor.execute(query, (user_id,))
            designs = cursor.fetchall()
            
            # Parse JSON fields
            for design in designs:
                if design['ai_analysis']:
                    try:
                        design['ai_analysis'] = json.loads(design['ai_analysis'])
                    except json.JSONDecodeError:
                        design['ai_analysis'] = {}
            
            return designs
        except mysql.connector.Error as err:
            print(f"Error fetching designs: {err}")
            return []
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def update_ai_analysis(design_id, ai_analysis):
        """Update design with AI analysis results"""
        connection = get_db_connection()
        if not connection:
            return False
        
        cursor = connection.cursor()
        
        try:
            query = """
                UPDATE designs 
                SET ai_analysis = %s, status = %s, updated_at = %s 
                WHERE id = %s
            """
            cursor.execute(query, (
                json.dumps(ai_analysis), 
                'analyzed', 
                datetime.now(), 
                design_id
            ))
            connection.commit()
            return cursor.rowcount > 0
        except mysql.connector.Error as err:
            print(f"Error updating AI analysis: {err}")
            return False
        finally:
            cursor.close()
            connection.close()

class Product:
    @staticmethod
    def get_products(category=None):
        """Get products, optionally filtered by category"""
        connection = get_db_connection()
        if not connection:
            return []
        
        cursor = connection.cursor(dictionary=True)
        
        try:
            if category:
                query = "SELECT * FROM products WHERE category = %s ORDER BY name"
                cursor.execute(query, (category,))
            else:
                query = "SELECT * FROM products ORDER BY category, name"
                cursor.execute(query)
            
            products = cursor.fetchall()
            return products
        except mysql.connector.Error as err:
            print(f"Error fetching products: {err}")
            return []
        finally:
            cursor.close()
            connection.close()

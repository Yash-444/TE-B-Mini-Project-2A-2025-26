import os
import sqlite3
import mysql.connector
from flask import g, current_app
from urllib.parse import urlparse


def init_db(app):
    # ensure instance folder - use app.config directly instead of current_app
    with app.app_context():
        os.makedirs(os.path.dirname(app.config["SQLITE_PATH"]), exist_ok=True)
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

def get_db():
    """Get database connection - supports both SQLite and MySQL"""
    conn = getattr(g, "_db_conn", None)
    if conn is None:
        if current_app.config.get("DATABASE_URL") and not current_app.config.get("SQLITE_FALLBACK"):
            # MySQL connection
            conn = get_mysql_connection()
        else:
            # SQLite (dev default)
            conn = get_sqlite_connection()
        g._db_conn = conn
    return conn

def get_sqlite_connection():
    """Get SQLite connection"""
    path = current_app.config["SQLITE_PATH"]
    conn = sqlite3.connect(path, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    # ensure schema
    _ensure_schema(conn)
    return conn

def get_mysql_connection():
    """Get MySQL connection"""
    database_url = current_app.config["DATABASE_URL"]
    parsed = urlparse(database_url)
    
    config = {
        'host': parsed.hostname,
        'port': parsed.port or 3306,
        'user': parsed.username,
        'password': parsed.password,
        'database': parsed.path.lstrip('/'),
        'autocommit': True,
    }
    
    conn = mysql.connector.connect(**config)
    return conn

def get_mysql_data_connection():
    """Get a separate MySQL connection specifically for data queries"""
    try:
        database_url = current_app.config.get("DATABASE_URL")
        if not database_url:
            return None
            
        parsed = urlparse(database_url)
        config = {
            'host': parsed.hostname,
            'port': parsed.port or 3306,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path.lstrip('/'),
            'autocommit': True,
        }
        
        return mysql.connector.connect(**config)
    except Exception as e:
        current_app.logger.error(f"Failed to connect to MySQL: {e}")
        return None

def _ensure_schema(conn):
    """Ensure schema exists - only for SQLite"""
    if hasattr(conn, 'executescript'):  # SQLite
        conn.executescript(open("db/schema.sql", "r", encoding="utf-8").read())
        conn.commit()

def close_db(e=None):
    conn = getattr(g, "_db_conn", None)
    if conn is not None:
        conn.close()

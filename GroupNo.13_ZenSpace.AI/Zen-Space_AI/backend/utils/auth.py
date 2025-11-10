from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            current_user = User.get_user_by_id(current_user_id)
            
            if not current_user:
                return jsonify({'success': False, 'message': 'Invalid token'}), 401
                
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'success': False, 'message': 'Token verification failed'}), 401
    
    return decorated

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if not current_user.get('is_admin', False):
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated

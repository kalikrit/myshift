import jwt
import bcrypt
import datetime
from functools import wraps
from flask import request, jsonify

JWT_SECRET = "your-super-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

def hash_password(password):
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')  # Возвращаем строку вместо bytes

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, username, role):
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token required"}), 401

        if token.startswith('Bearer '):
            token = token[7:]

        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid token"}), 401

        request.user = payload
        return f(*args, **kwargs)
    return decorated

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({"error": "Token required"}), 401

            if token.startswith('Bearer '):
                token = token[7:]

            payload = verify_token(token)
            if not payload:
                return jsonify({"error": "Invalid token"}), 401

            # ПРОВЕРЬ ЭТУ ЛОГИКУ:
            user_role = payload.get('role')
            print(f"User role: {user_role}, Required: {required_role}")  # ← отладка

            # Админ должен иметь доступ ко всему
            if user_role == 'admin':
                request.user = payload
                return f(*args, **kwargs)

            # Для не-админов проверяем соответствие роли
            if user_role != required_role:
                return jsonify({"error": "Insufficient permissions"}), 403

            request.user = payload
            return f(*args, **kwargs)
        return decorated
    return decorator
# backend\run.py
# Main Backend Server: Flask application that defines all API endpoints for dashboard data, authentication, and health checks.

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys
import json
import sqlite3
import logging

# Configure Logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'app.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("NYC-Taxi-API")

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.security.validator import RequestValidator
from backend.logic.aggregators import TripAggregator
from backend.security.auth_logic import AuthLogic

app = Flask(__name__)
CORS(app) # Enable CORS for frontend integration

# Serve Frontend
@app.route('/')
def index():
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend'), 'index.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend'), 'dashboard.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend'), path)

# Here we'll use a secret key and a simple token storage
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'nyc-taxi-secret-key')
tokens = {} # In-memory token storage (resets on restart)

def get_db_path():
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'taxi_data.db')

# Performance Cache
import time
summary_cache = {
    "data": None,
    "timestamp": 0,
    "filters": None
}

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    hashed_password = AuthLogic.hash_password(password)
    
    try:
        conn = sqlite3.connect(get_db_path(), timeout=30)
        cur = conn.cursor()
        cur.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({"message": "User created successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
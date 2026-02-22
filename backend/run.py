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
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        conn = sqlite3.connect(get_db_path(), timeout=30)
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        conn.close()

        if row and AuthLogic.verify_password(password, row[0]):
            token = AuthLogic.generate_token()
            tokens[token] = email # Store session
            return jsonify({"token": token, "email": email}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    @app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "NYC Taxi API"})

@app.before_request
def log_request():
    logger.info(f"Request: {request.method} {request.path} {request.args}")

@app.route('/api/trips/summary', methods=['GET'])
def get_trip_summary():
    """Returns combined mobility metrics (Optimized single-pass)"""
    try:
        from backend.logic.aggregators import TripAggregator
        filters = {
            "start_date": request.args.get('start_date'),
            "end_date": request.args.get('end_date'),
            "borough": request.args.get('borough', 'all'),
            "zone_id": request.args.get('zone_id')
        }
        
        # Cache Logic: Valid for 30 seconds
        now = time.time()
        if summary_cache["data"] and (now - summary_cache["timestamp"] < 30) and (summary_cache["filters"] == filters):
            # Caching successful
            return jsonify(summary_cache["data"])

        # Super-Aggregator pass
        full_data = TripAggregator.get_global_summary(filters)
        
        # Merge summary with extra health metrics (choke points)
        response_data = full_data['summary']
        
        # Update Cache
        summary_cache.update({
            "data": response_data,
            "timestamp": now,
            "filters": filters
        })
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trips/revenue', methods=['GET'])
def get_congestion_report():
    """Returns Congestion Index (Optimized)"""
    try:
        from backend.logic.aggregators import TripAggregator
        # Call super-aggregator - it's fast now!
        full_data = TripAggregator.get_global_summary({"borough": "all"})
        return jsonify(full_data['congestion'])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trips/hourly', methods=['GET'])
def get_hourly_activity():
    """Returns trip volume and speed by hour for Rush Hour analysis"""
    try:
        from backend.logic.aggregators import TripAggregator
        filters = {
            "start_date": request.args.get('start_date'),
            "end_date": request.args.get('end_date'),
            "borough": request.args.get('borough', 'all'),
            "zone_id": request.args.get('zone_id')
        }
        data = TripAggregator.get_hourly_stats(filters)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/trips/gaps', methods=['GET'])
def get_coverage_gaps():
    """Returns top 5 underserved zones (Filtered)"""
    try:
        from backend.logic.aggregators import TripAggregator
        filters = {
            "start_date": request.args.get('start_date'),
            "end_date": request.args.get('end_date'),
            "borough": request.args.get('borough', 'all'),
            "zone_id": request.args.get('zone_id')
        }
        data = TripAggregator.get_coverage_gaps(filters)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/boroughs/<borough>/stats', methods=['GET'])
def get_borough_stats(borough):
    """Returns aggregated stats for a specific borough"""
    try:
        from backend.logic.aggregators import TripAggregator
        filters = {
            "start_date": request.args.get('start_date'),
            "end_date": request.args.get('end_date')
        }
        data = TripAggregator.get_borough_stats(borough, filters)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/report', methods=['GET'])
def get_report():
    """Returns detailed diagnostic report data"""
    try:
        from backend.logic.aggregators import TripAggregator
        filters = {
            "start_date": request.args.get('start_date'),
            "end_date": request.args.get('end_date'),
            "borough": request.args.get('borough', 'all'),
            "zone_id": request.args.get('zone_id')
        }
        data = TripAggregator.get_detailed_report(filters)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/zones', methods=['GET'])
def get_zones():
    """Returns spatial data for the map"""
    try:
        # We can reuse the DAL or call it directly
        from backend.dal.trip_dal import TripDAL
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'taxi_data.db')
        dal = TripDAL(db_path)
        
        conn = sqlite3.connect(db_path, timeout=30)
        cur = conn.cursor()
        cur.execute("SELECT location_id, borough, zone, geojson FROM taxi_zones")
        rows = cur.fetchall()
        
        zones = []
        for r in rows:
            zones.append({
                "id": r[0],
                "borough": r[1],
                "zone": r[2],
                "geometry": json.loads(r[3]) if r[3] else None
            })
        return jsonify(zones)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

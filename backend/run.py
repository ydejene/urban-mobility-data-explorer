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
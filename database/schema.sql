# backend\etl\pipeline.py
# ETL Pipeline Orchestrator: Coordinates the full data lifecycle from ingestion and cleaning to feature engineering and storage.

import os
import sys
import logging

# Configure Logging for ETL
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'etl.log')),
        logging.StreamHandler()
    ]
)
logger = logginggetLogger("ETL-Pipeline")
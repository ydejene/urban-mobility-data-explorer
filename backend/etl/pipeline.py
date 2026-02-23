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
logger = logging.getLogger("ETL-Pipeline")

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.ingestion.loaders import CSVLoader, ShapefileLoader
from etl.processing.cleaner import DataCleaner
from etl.features.feature_engineer import FeatureEngineer
from dal.trip_dal import TripDAL

def run_pipeline():
    # 1. Setup paths
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_data_path = os.path.join(base_dir, 'data', 'yellow_tripdata_2019-01.csv')
    shp_path = os.path.join(base_dir, 'data', 'taxi_zones', 'taxi_zones.shp')
    db_path = os.path.join(base_dir, 'database', 'taxi_data.db')
    
    dal = TripDAL(db_path)
    
    # 2. Process Zones (Dimension Table)
    logger.info("--- Processing Taxi Zones ---")
    zone_loader = ShapefileLoader(shp_path)
    zones = zone_loader.load()
    if zones:
        clean_zones = DataCleaner.clean_zone_data(zones)
        dal.insert_zones(clean_zones)
    
    # 3. Process Trip Data (Fact Table) in chunks to avoid memory issues
    logger.info("--- Processing Trip Data ---")
    trip_loader = CSVLoader(raw_data_path)
    # We'll process a small sample for verification first, or just use chunks
    chunk_size = 100000 
    
    try:
        chunks = trip_loader.load(chunksize=chunk_size)
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}...")
            
            # Cleaning
            clean_chunk = DataCleaner.clean_trip_data(chunk)
            
            # Feature Engineering
            engineered_chunk = FeatureEngineer.add_time_features(clean_chunk)
            engineered_chunk = FeatureEngineer.add_calculated_metrics(engineered_chunk)
            
            # Storage
            # Note: We need pickup_time_id and dropoff_time_id for the star schema
            # For now, we'll store the raw datetimes or handle dimensional IDs later
            # In a full star schema, we'd lookup/insert into time_dim first.
            
            dal.insert_trips(engineered_chunk)
            
            # Process up to 10 chunks (1 million rows) for a solid demo
            if i >= 9: 
                break
                
        logger.info("ETL Pipeline execution complete.")
    except Exception as e:
        logger.error(f"Pipeline error: {e}")

if __name__ == "__main__":
    run_pipeline()

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger("DataCleaner")

class DataCleaner:
    """Handles data quality and cleaning steps"""
    
    @staticmethod
    def clean_trip_data(df):
        initial_count = len(df)
        
        df = df[df['fare_amount'] >= 0]
        df = df[df['total_amount'] >= 0]

        df = df[df['trip_distance'] > 0]
        
        if 'passenger_count' in df.columns:
            df = df[df['passenger_count'] > 0]

        df = df.dropna(subset=['PULocationID', 'DOLocationID', 'tpep_pickup_datetime'])
        
        logger.info(f"Cleaning complete. Reduced rows from {initial_count} to {len(df)}.")
        return df
    
    @staticmethod
    def clean_zone_data(zones_list):
        """Cleans spatial data if necessary"""
        # Ensure all zones have valid geometry
        return [z for z in zones_list if z.get('geometry')]
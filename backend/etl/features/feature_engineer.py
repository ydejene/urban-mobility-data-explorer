import pandas as pd
import numpy as np

class FeatureEngineer:
    """Calculates derived features for the taxi dataset"""
    
    @staticmethod
    def add_time_features(df):
        """Adds time-based dimension features"""
        df['tpep_pickup_datetime'] = pd.to_datetime(df['tpep_pickup_datetime'])
        df['tpep_dropoff_datetime'] = pd.to_datetime(df['tpep_dropoff_datetime'])

        # Calculate duration in seconds
        df['trip_duration_seconds'] = (df['tpep_dropoff_datetime'] - df['tpep_pickup_datetime']).dt.total_seconds()

        # Additional time features for the dashboard
        df['pickup_hour'] = df['tpep_pickup_datetime'].dt.hour
        df['pickup_date'] = df['tpep_pickup_datetime'].dt.strftime('%Y-%m-%d')
        df['pickup_day'] = df['tpep_pickup_datetime'].dt.day_name()
        df['is_weekend'] = df['tpep_pickup_datetime'].dt.weekday >= 5
        
        return df
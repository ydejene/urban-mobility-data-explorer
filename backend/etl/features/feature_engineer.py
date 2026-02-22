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
    
    @staticmethod
    def add_calculated_metrics(df):
        """Calculates speed and financial ratios"""
        
        # 1. Average Speed (MPH)
        duration_hours = df['trip_duration_seconds'] / 3600
        df['speed_mph'] = np.where(duration_hours > 0, df['trip_distance'] / duration_hours, 0)
        
        # 2. Fare per Mile
        df['fare_per_mile'] = np.where(df['trip_distance'] > 0, df['fare_amount'] / df['trip_distance'], 0)

        # 3. Tip Percentage
        df['tip_percentage'] = np.where(df['fare_amount'] > 0, (df['tip_amount'] / df['fare_amount']) * 100, 0)
        
        # Cap outliers (e.g., speed > 100mph) - often data entry errors
        df.loc[df['speed_mph'] > 100, 'speed_mph'] = np.nan
        
        return df
import pandas as pd
import numpy as np

class FeatureEngineer:
    """Calculates derived features for the taxi dataset"""
    
    @staticmethod
    def add_time_features(df):
        """Adds time-based dimension features"""
        df['tpep_pickup_datetime'] = pd.to_datetime(df['tpep_pickup_datetime'])
        df['tpep_dropoff_datetime'] = pd.to_datetime(df['tpep_dropoff_datetime'])
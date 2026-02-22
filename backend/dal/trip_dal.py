import sqlite3
import os
import json

class TripDAL:
    def __init__(self, db_path):
        self.db_path = db_path

    def insert_trips(self, trips_df):
        conn = sqlite3.connect(self.db_path, timeout=30)
        try:
            df_to_save = trips_df.copy()
            
            # Map raw CSV columns to schema.sql names
            column_mapping = {
                'VendorID': 'vendor_id',
                'RatecodeID': 'rate_code_id',
                'PULocationID': 'pickup_location_id',
                'DOLocationID': 'dropoff_location_id',
                'payment_type': 'payment_type_id',
                'tpep_pickup_datetime': 'pickup_time', 
                'tpep_dropoff_datetime': 'dropoff_time'
            }
            df_to_save = df_to_save.rename(columns=column_mapping)